"use server"

import { and, eq } from "drizzle-orm"
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

/**
 * Aprueba una solicitud de autorregistro. Solo admin.
 *
 * Es el único punto donde una persona pasa de "Pendiente" a "Activo", y donde
 * se le asigna el rol. El rol lo elige el administrador acá y en ningún otro
 * lado: el que se registró guardó "alumno" provisorio y no tuvo voz en esto.
 *
 * Además se le reescribe el id y el legajo. Al registrarse recibió un id de
 * solicitud ("SOL-04") porque todavía no se sabía qué era; aprobada, pasa a la
 * numeración que usa la escuela según el rol ("A-12", "P-07"). Cambiar la clave
 * primaria es seguro en este caso concreto: ninguna tabla referencia people.id
 * — préstamos, sanciones y auditoría guardan nombre o legajo como texto.
 */
export async function approvePersonAction(input: {
  personId: string
  role: Role
  curso?: string
  division?: string
  orientacion?: string
  supervisor?: string
}) {
  return guard("approvePerson", async () => {
    const actor = await requireRole("admin")

    if (!["admin", "docente", "alumno"].includes(input.role)) {
      return fail("Rol inválido.")
    }

    return db.transaction(async (tx) => {
      // Se bloquea la fila: dos administradores mirando la misma bandeja
      // podrían aprobar la misma solicitud a la vez y consumir dos ids.
      const [solicitud] = await tx
        .select()
        .from(s.people)
        .where(eq(s.people.id, input.personId))
        .for("update")
        .limit(1)

      if (!solicitud) return fail("La solicitud no existe.")
      if (solicitud.estado !== "Pendiente") {
        return fail(
          `La solicitud de ${solicitud.nombre} ya fue resuelta por otro administrador.`,
        )
      }

      const nuevoId = await nextId(tx, ROLE_PREFIX[input.role])

      await tx
        .update(s.people)
        .set({
          id: nuevoId,
          legajo: `LEG-${nuevoId}`,
          role: input.role,
          estado: "Activo",
          curso: input.curso?.trim() || null,
          division: input.division?.trim() || null,
          orientacion: input.orientacion?.trim() || null,
          supervisor: input.supervisor?.trim() || null,
        })
        .where(eq(s.people.id, input.personId))

      await writeAudit(tx, actor, {
        accion: `Aprobó la solicitud de acceso de ${solicitud.nombre}`,
        anterior: `${input.personId} (Pendiente)`,
        siguiente: `${nuevoId} (${input.role}, Activo)`,
      })

      revalidatePath("/")
      return ok(
        `${solicitud.nombre} fue aprobado como ${input.role}. Legajo LEG-${nuevoId}.`,
      )
    })
  })
}

/**
 * Rechaza una solicitud. Solo admin.
 *
 * No borra nada: deja la fila en "Inactivo". La cuenta de Supabase Auth sigue
 * existiendo — borrarla requiere la service_role key, que a propósito no está
 * en la app —, así que la persona va a poder loguearse. Con la fila en
 * "Inactivo", getSessionUser le niega el acceso igual. Si se borrara la fila,
 * esa misma cuenta quedaría huérfana y podría volver a registrarse en loop.
 */
export async function rejectPersonAction(personId: string) {
  return guard("rejectPerson", async () => {
    const actor = await requireRole("admin")

    return db.transaction(async (tx) => {
      const actualizado = await tx
        .update(s.people)
        .set({ estado: "Inactivo" })
        .where(and(eq(s.people.id, personId), eq(s.people.estado, "Pendiente")))
        .returning({ nombre: s.people.nombre })

      if (actualizado.length === 0) {
        return fail("Esa solicitud ya fue resuelta.")
      }

      await writeAudit(tx, actor, {
        accion: `Rechazó la solicitud de acceso de ${actualizado[0].nombre}`,
        anterior: `${personId} (Pendiente)`,
        siguiente: `${personId} (Inactivo)`,
      })

      revalidatePath("/")
      return ok(`Solicitud de ${actualizado[0].nombre} rechazada.`)
    })
  })
}
