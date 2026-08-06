"use server"

import { revalidatePath } from "next/cache"
import { and, eq, sql } from "drizzle-orm"

import { requireRole, requireUser } from "@/lib/auth"
import { fail, guard, ok } from "@/lib/action-result"
import { writeAudit } from "@/lib/db/audit-log"
import { db } from "@/lib/db/client"
import { inDays, nextId, today } from "@/lib/db/ids"
import * as s from "@/lib/db/schema"
import { canLoan } from "@/lib/lab-data"

/**
 * Entrega de un artículo: descuenta una unidad del stock y abre el préstamo.
 *
 * Todo pasa dentro de una transacción con la fila del artículo bloqueada
 * (`FOR UPDATE`). Es lo que hace correcta la operación con varios usuarios a la
 * vez: sin el lock, dos preceptores que entregan la última unidad al mismo
 * tiempo leen `disponible = 1` los dos, los dos pasan el chequeo y el stock
 * termina en -1. Con el lock, el segundo espera, vuelve a leer `disponible = 0`
 * y su préstamo se rechaza.
 *
 * La versión anterior de esto vivía en el cliente con `setEquipment`, así que
 * ni siquiera había una operación que pudiera ser atómica.
 */
export async function registerLoanAction(input: {
  equipoId: string
  alumno: string
  docente: string
  dias?: number
}) {
  return guard("registerLoan", async () => {
    const actor = await requireRole("admin", "docente")

    return db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(s.equipment)
        .where(eq(s.equipment.id, input.equipoId))
        .for("update")
        .limit(1)

      if (!item) return fail("El artículo no existe en el inventario.")

      if (!canLoan(item.estado, item.disponible)) {
        return fail(
          `Sin stock disponible de "${item.nombre}" o el equipo no está apto para préstamo.`,
        )
      }

      const restante = item.disponible - 1
      await tx
        .update(s.equipment)
        .set({
          disponible: restante,
          // "En Uso Activo" describe que no queda nada libre, no una falla
          // técnica: por eso solo se aplica al agotarse el stock.
          estado: restante <= 0 ? "En Uso Activo" : item.estado,
        })
        .where(eq(s.equipment.id, item.id))

      const id = await nextId(tx, "P", 4)
      await tx.insert(s.loans).values({
        id,
        equipoId: item.id,
        equipo: item.nombre,
        alumno: input.alumno,
        docente: input.docente,
        fechaSalida: today(),
        fechaDevolucionPrevista: inDays(input.dias ?? 7),
        estado: "Activo",
      })

      await writeAudit(tx, actor, {
        accion: `Registró préstamo ${id} (${item.nombre})`,
        anterior: `Disponible: ${item.disponible}`,
        siguiente: `Disponible: ${restante}`,
      })

      revalidatePath("/")
      return ok(
        `Préstamo ${id} registrado. Stock de "${item.nombre}": ${restante}/${item.total}`,
      )
    })
  })
}

/**
 * Devolución: repone la unidad y cierra el préstamo.
 *
 * El UPDATE del préstamo lleva `and(id, estado='Activo')` en el WHERE y se
 * comprueba cuántas filas tocó. Eso lo hace idempotente frente a un doble clic:
 * la segunda ejecución no encuentra nada que actualizar y aborta antes de
 * devolver una unidad de más al inventario.
 */
export async function returnLoanAction(loanId: string) {
  return guard("returnLoan", async () => {
    const actor = await requireRole("admin", "docente")

    return db.transaction(async (tx) => {
      const [loan] = await tx
        .select()
        .from(s.loans)
        .where(eq(s.loans.id, loanId))
        .for("update")
        .limit(1)

      if (!loan) return fail("El préstamo no existe.")
      if (loan.estado === "Devuelto") {
        return fail(`El préstamo ${loanId} ya figura como devuelto.`)
      }

      const [item] = await tx
        .select()
        .from(s.equipment)
        .where(eq(s.equipment.id, loan.equipoId))
        .for("update")
        .limit(1)

      if (!item) return fail("El artículo asociado al préstamo ya no existe.")

      const updated = await tx
        .update(s.loans)
        .set({ estado: "Devuelto", fechaDevolucion: today() })
        .where(and(eq(s.loans.id, loanId), eq(s.loans.estado, "Activo")))
        .returning({ id: s.loans.id })

      if (updated.length === 0) {
        return fail(`El préstamo ${loanId} ya fue devuelto por otro usuario.`)
      }

      // Nunca por encima del total físico: el inventario no puede inventar
      // unidades por un error de conteo previo.
      const repuesto = Math.min(item.total, item.disponible + 1)
      await tx
        .update(s.equipment)
        .set({
          disponible: repuesto,
          estado:
            item.estado === "En Uso Activo" && repuesto > 0
              ? "Operativo"
              : item.estado,
        })
        .where(eq(s.equipment.id, item.id))

      await writeAudit(tx, actor, {
        accion: `Registró devolución del préstamo ${loanId} (${loan.equipo})`,
        anterior: `Disponible: ${item.disponible}`,
        siguiente: `Disponible: ${repuesto}`,
      })

      revalidatePath("/")
      return ok(`Devolución de "${loan.equipo}" registrada. Stock repuesto.`)
    })
  })
}

/** Los préstamos vencidos se calculan en la base, no recorriendo el array en el cliente. */
export async function getOverdueCountAction() {
  await requireUser()
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(s.loans)
    .where(
      and(
        eq(s.loans.estado, "Activo"),
        sql`${s.loans.fechaDevolucionPrevista} < current_date`,
      ),
    )
  return row?.total ?? 0
}
