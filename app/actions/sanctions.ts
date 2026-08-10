"use server"

import { revalidatePath } from "next/cache"
import { and, eq } from "drizzle-orm"

import { requireRole } from "@/lib/auth"
import { fail, guard, ok } from "@/lib/action-result"
import { writeAudit } from "@/lib/db/audit-log"
import { db } from "@/lib/db/client"
import { nextId, today } from "@/lib/db/ids"
import * as s from "@/lib/db/schema"
import type { SanctionLevel } from "@/lib/lab-data"

/** Aplicar una sanción a un alumno. Solo admin. */
export async function createSanctionAction(input: {
  personId: string
  nivel: SanctionLevel
  motivo: string
  dias: number
}) {
  return guard("createSanction", async () => {
    const actor = await requireRole("admin")

    const motivo = input.motivo.trim()
    if (!motivo) return fail("Indicá el motivo de la sanción.")
    if (!Number.isInteger(input.dias) || input.dias < 0) {
      return fail("Los días de sanción deben ser un número entero no negativo.")
    }

    return db.transaction(async (tx) => {
      const [alumno] = await tx
        .select()
        .from(s.people)
        .where(and(eq(s.people.id, input.personId), eq(s.people.role, "alumno")))
        .limit(1)

      if (!alumno) return fail("El alumno no existe.")

      const id = await nextId(tx, "S", 3)
      await tx.insert(s.sanctions).values({
        id,
        alumno: alumno.nombre,
        legajo: alumno.legajo,
        nivel: input.nivel,
        motivo,
        dias: input.dias,
        fecha: today(),
        activa: true,
      })

      await writeAudit(tx, actor, {
        accion: `Aplicó sanción ${id} a ${alumno.nombre}`,
        anterior: "Sin sanción",
        siguiente: `${input.nivel} · ${input.dias} días · ${motivo}`,
      })

      revalidatePath("/")
      return ok(`Sanción ${input.nivel} aplicada a ${alumno.nombre}`)
    })
  })
}

/** Levantar una sanción activa. Idempotente: exige que siga activa en el WHERE. */
export async function liftSanctionAction(id: string) {
  return guard("liftSanction", async () => {
    const actor = await requireRole("admin")

    return db.transaction(async (tx) => {
      const updated = await tx
        .update(s.sanctions)
        .set({ activa: false })
        .where(and(eq(s.sanctions.id, id), eq(s.sanctions.activa, true)))
        .returning({ alumno: s.sanctions.alumno })

      if (updated.length === 0) {
        return fail("La sanción no existe o ya estaba levantada.")
      }

      await writeAudit(tx, actor, {
        accion: `Levantó sanción ${id}`,
        anterior: "Activa",
        siguiente: "Levantada",
      })

      revalidatePath("/")
      return ok(`Sanción de ${updated[0].alumno} levantada`)
    })
  })
}
