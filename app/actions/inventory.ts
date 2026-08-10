"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"

import { requireRole } from "@/lib/auth"
import { fail, guard, ok } from "@/lib/action-result"
import { writeAudit } from "@/lib/db/audit-log"
import { db } from "@/lib/db/client"
import { nextId } from "@/lib/db/ids"
import * as s from "@/lib/db/schema"
import { CATEGORIA_PREFIX, type Equipment } from "@/lib/lab-data"

/** Alta de artículo. Solo el preceptor/admin da de alta inventario. */
export async function addEquipmentAction(input: {
  nombre: string
  categoria: Equipment["categoria"]
  total: number
  estado: Equipment["estado"]
}) {
  return guard("addEquipment", async () => {
    const actor = await requireRole("admin")

    const nombre = input.nombre.trim()
    if (!nombre) return fail("Ingresá el nombre del artículo.")
    if (!Number.isInteger(input.total) || input.total < 1) {
      return fail("La cantidad total debe ser un número entero mayor a cero.")
    }

    return db.transaction(async (tx) => {
      const id = await nextId(tx, CATEGORIA_PREFIX[input.categoria])

      await tx.insert(s.equipment).values({
        id,
        nombre,
        categoria: input.categoria,
        total: input.total,
        // Un artículo nuevo entra entero: nada prestado todavía.
        disponible: input.total,
        estado: input.estado,
      })

      await writeAudit(tx, actor, {
        accion: `Dio de alta el artículo ${id}`,
        anterior: "—",
        siguiente: `${nombre} · ${input.total} u.`,
      })

      revalidatePath("/")
      return ok(`Artículo ${id} agregado al inventario (${input.total} u.)`)
    })
  })
}

/**
 * Ajuste manual del stock disponible (recuento físico, pérdidas, roturas).
 *
 * Se bloquea la fila porque el valor nuevo se valida contra el `total` leído en
 * la misma transacción; si otro proceso cambiara el total en el medio, la
 * validación estaría mirando un dato viejo.
 */
export async function updateStockAction(id: string, disponible: number) {
  return guard("updateStock", async () => {
    const actor = await requireRole("admin")

    return db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(s.equipment)
        .where(eq(s.equipment.id, id))
        .for("update")
        .limit(1)

      if (!item) return fail("El artículo no existe.")
      if (!Number.isInteger(disponible)) {
        return fail("El stock disponible debe ser un número entero.")
      }
      if (disponible < 0 || disponible > item.total) {
        return fail(
          `El stock disponible debe estar entre 0 y ${item.total} unidades.`,
        )
      }
      if (disponible === item.disponible) return ok("Sin cambios.")

      await tx
        .update(s.equipment)
        .set({ disponible })
        .where(eq(s.equipment.id, id))

      await writeAudit(tx, actor, {
        accion: `Ajustó el stock de ${item.nombre} (${id})`,
        anterior: `Disponible: ${item.disponible}`,
        siguiente: `Disponible: ${disponible}`,
      })

      revalidatePath("/")
      return ok(
        `Stock de "${item.nombre}" actualizado a ${disponible}/${item.total}`,
      )
    })
  })
}

/** Cambio manual del estado técnico. Queda auditado igual que cualquier otra mutación. */
export async function updateEquipmentStatusAction(
  id: string,
  estado: Equipment["estado"],
) {
  return guard("updateEquipmentStatus", async () => {
    const actor = await requireRole("admin")

    return db.transaction(async (tx) => {
      const [item] = await tx
        .select()
        .from(s.equipment)
        .where(eq(s.equipment.id, id))
        .for("update")
        .limit(1)

      if (!item) return fail("El artículo no existe.")
      if (item.estado === estado) return ok("Sin cambios.")

      await tx.update(s.equipment).set({ estado }).where(eq(s.equipment.id, id))

      await writeAudit(tx, actor, {
        accion: `Cambió el estado técnico de ${item.nombre} (${id})`,
        anterior: item.estado,
        siguiente: estado,
      })

      revalidatePath("/")
      return ok(`"${item.nombre}" pasó a estado "${estado}"`)
    })
  })
}
