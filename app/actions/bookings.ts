"use server"

import { revalidatePath } from "next/cache"

import { requireRole } from "@/lib/auth"
import { fail, guard, ok } from "@/lib/action-result"
import { writeAudit } from "@/lib/db/audit-log"
import { db } from "@/lib/db/client"
import { nextId } from "@/lib/db/ids"
import * as s from "@/lib/db/schema"
import { DIAS, MODULOS } from "@/lib/lab-data"

/**
 * Reserva de un módulo horario del laboratorio.
 *
 * El choque de reservas lo resuelve un índice único en (dia, modulo_id, fecha):
 * si dos docentes reservan el mismo módulo a la vez, Postgres rechaza el
 * segundo INSERT. Acá se traduce ese rechazo a un mensaje entendible en vez de
 * dejar salir el error crudo del driver.
 */
export async function registerBookingAction(input: {
  dia: string
  moduloId: string
  division: string
  docente?: string
  actividad?: string
  fecha?: string
}) {
  return guard("registerBooking", async () => {
    const actor = await requireRole("admin", "docente")

    if (!DIAS.includes(input.dia)) return fail("El día seleccionado no es válido.")
    if (!MODULOS.some((m) => m.id === input.moduloId)) {
      return fail("El módulo horario seleccionado no es válido.")
    }
    if (!input.division?.trim()) return fail("Seleccioná una división.")

    try {
      return await db.transaction(async (tx) => {
        const id = await nextId(tx, "B")

        await tx.insert(s.bookings).values({
          id,
          dia: input.dia,
          moduloId: input.moduloId,
          division: input.division.trim(),
          docente: input.docente?.trim() || null,
          actividad: input.actividad?.trim() || null,
          fecha: input.fecha || null,
        })

        await writeAudit(tx, actor, {
          accion: `Reservó módulo ${id}`,
          anterior: "—",
          siguiente: `${input.dia} ${input.moduloId}`,
        })

        revalidatePath("/")
        return ok(`Reserva ${id} creada para ${input.division}`)
      })
    } catch (error) {
      // 23505 = unique_violation
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "23505"
      ) {
        return fail("Ese módulo ya está reservado para ese día.")
      }
      throw error
    }
  })
}
