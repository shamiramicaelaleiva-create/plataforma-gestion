"use server"

import { revalidatePath } from "next/cache"

import { requireRole } from "@/lib/auth"
import { fail, guard, ok } from "@/lib/action-result"
import { writeAudit } from "@/lib/db/audit-log"
import { db } from "@/lib/db/client"
import { nextId } from "@/lib/db/ids"
import * as s from "@/lib/db/schema"
import type { Role } from "@/lib/lab-data"

const ROLE_PREFIX: Record<Role, string> = {
  admin: "ADM",
  docente: "P",
  alumno: "A",
}

/**
 * Alta de persona. Solo admin.
 *
 * Ojo con lo que esto NO hace: crea la fila en `people`, no la cuenta de
 * Supabase Auth. La persona todavía no puede loguearse. El vínculo se completa
 * creando el usuario en Auth y cargando su uuid en `people.auth_user_id`
 * (el procedimiento está en DEPLOY.md). Se dejó así a propósito: crear cuentas
 * de autenticación requiere la service_role key, y esa clave no debería estar
 * al alcance de una Server Action llamada desde un formulario.
 */
export async function addPersonAction(input: {
  nombre: string
  role: Role
  email?: string
  curso?: string
  division?: string
  orientacion?: string
  supervisor?: string
}) {
  return guard("addPerson", async () => {
    const actor = await requireRole("admin")

    const nombre = input.nombre.trim()
    if (!nombre) return fail("Ingresá el nombre de la persona.")
    if (!["admin", "docente", "alumno"].includes(input.role)) {
      return fail("Rol inválido.")
    }

    const email = input.email?.trim().toLowerCase()
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return fail("El email no tiene un formato válido.")
    }

    return db.transaction(async (tx) => {
      const id = await nextId(tx, ROLE_PREFIX[input.role])

      await tx.insert(s.people).values({
        id,
        nombre,
        role: input.role,
        legajo: `LEG-${id}`,
        email: email || `${id.toLowerCase()}@escuela.edu.ar`,
        curso: input.curso?.trim() || null,
        division: input.division?.trim() || null,
        orientacion: input.orientacion?.trim() || null,
        supervisor: input.supervisor?.trim() || null,
        estado: "Activo",
      })

      await writeAudit(tx, actor, {
        accion: `Dio de alta al usuario ${id}`,
        anterior: "—",
        siguiente: `${nombre} (${input.role})`,
      })

      revalidatePath("/")
      return ok(`Usuario ${nombre} creado con legajo LEG-${id}`)
    })
  })
}
