"use server"

import { revalidatePath } from "next/cache"
import { and, eq, ne } from "drizzle-orm"

import { requireRole, requireUser } from "@/lib/auth"
import { fail, guard, ok } from "@/lib/action-result"
import { writeAudit } from "@/lib/db/audit-log"
import { db } from "@/lib/db/client"
import { nextId, today } from "@/lib/db/ids"
import * as s from "@/lib/db/schema"
import type { Equipment, TicketStatus } from "@/lib/lab-data"

/**
 * Reportar un desperfecto. Cualquier rol puede hacerlo: el que usa el equipo es
 * el que detecta la falla.
 *
 * La regla "un solo ticket abierto por artículo" se chequea acá Y está impuesta
 * por un índice único parcial en la base. El chequeo de acá da un mensaje
 * lindo; el índice es el que garantiza que se cumpla aunque dos personas
 * reporten el mismo equipo en el mismo segundo.
 */
export async function createTicketAction(input: {
  equipoId: string
  problema: string
  tecnico?: string
}) {
  return guard("createTicket", async () => {
    const actor = await requireUser()

    const problema = input.problema.trim()
    if (!problema) return fail("Describí el problema del artículo.")

    return db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(s.equipment)
        .where(eq(s.equipment.id, input.equipoId))
        .limit(1)

      if (!item) return fail("El artículo no existe en el inventario.")

      const [abierto] = await tx
        .select({ id: s.tickets.id })
        .from(s.tickets)
        .where(
          and(
            eq(s.tickets.equipoId, input.equipoId),
            ne(s.tickets.estado, "solucionado"),
          ),
        )
        .limit(1)

      if (abierto) {
        return fail(`"${item.nombre}" ya tiene el ticket ${abierto.id} abierto.`)
      }

      const id = await nextId(tx, "T", 3)
      await tx.insert(s.tickets).values({
        id,
        equipoId: item.id,
        equipo: item.nombre,
        problema,
        reporta: actor.nombre,
        tecnico: input.tecnico?.trim() || "Sin asignar",
        fecha: today(),
        estado: "pendiente",
      })

      await writeAudit(tx, actor, {
        accion: `Abrió el ticket ${id} sobre ${item.nombre} (${item.id})`,
        anterior: "Sin ticket",
        siguiente: `Pendiente · ${problema}`,
      })

      revalidatePath("/")
      return ok(`Ticket ${id} creado para "${item.nombre}"`)
    })
  })
}

/**
 * Avance del ticket. El estado del ticket manda sobre el estado técnico del
 * artículo, y ese efecto colateral se audita como una entrada aparte: quien
 * lea el log tiene que ver por qué cambió el equipo, no solo que cambió.
 */
export async function updateTicketStatusAction(
  id: string,
  estado: TicketStatus,
) {
  return guard("updateTicketStatus", async () => {
    const actor = await requireRole("admin")

    return db.transaction(async (tx) => {
      const [ticket] = await tx
        .select()
        .from(s.tickets)
        .where(eq(s.tickets.id, id))
        .for("update")
        .limit(1)

      if (!ticket) return fail("El ticket no existe.")
      if (ticket.estado === estado) return ok("Sin cambios.")

      await tx.update(s.tickets).set({ estado }).where(eq(s.tickets.id, id))

      await writeAudit(tx, actor, {
        accion: `Cambió estado del ticket ${id}`,
        anterior: ticket.estado,
        siguiente: estado,
      })

      const nuevoEstado: Equipment["estado"] | null =
        estado === "proceso"
          ? "En Reparación"
          : estado === "solucionado"
            ? "Operativo"
            : null

      if (nuevoEstado) {
        const [item] = await tx
          .select()
          .from(s.equipment)
          .where(eq(s.equipment.id, ticket.equipoId))
          .for("update")
          .limit(1)

        if (item && item.estado !== nuevoEstado) {
          await tx
            .update(s.equipment)
            .set({ estado: nuevoEstado })
            .where(eq(s.equipment.id, item.id))

          await writeAudit(tx, actor, {
            accion: `Ticket ${id}: actualizó el estado de ${item.nombre} (${item.id})`,
            anterior: item.estado,
            siguiente: nuevoEstado,
          })
        }
      }

      revalidatePath("/")
      return ok(`Ticket ${id} actualizado a "${estado}"`)
    })
  })
}
