import "server-only"

import { eq } from "drizzle-orm"
import { cache } from "react"

import { db } from "@/lib/db/client"
import { LabAuthError } from "@/lib/errors"
import { people } from "@/lib/db/schema"
import type { Role } from "@/lib/lab-data"
import { createClient } from "@/lib/supabase/server"

export type SessionUser = {
  /** id de people, ej "ADM-01" */
  id: string
  /** uuid de auth.users */
  authUserId: string
  nombre: string
  role: Role
  legajo: string
  email: string | null
}

/**
 * Devuelve el usuario logueado con su rol leído de la tabla `people`, o null.
 *
 * POR QUÉ EL ROL SALE DE POSTGRES Y NUNCA DEL JWT:
 * `user_metadata` (y `raw_user_meta_data`) es escribible por el propio usuario
 * con su access token vía `supabase.auth.updateUser({ data: { role: "admin" } })`.
 * Si autorizáramos leyendo el rol del JWT, cualquier alumno se haría admin con
 * una sola llamada desde la consola del browser. La tabla `people` solo la
 * escribe el servidor, así que es la única fuente de verdad para el rol.
 *
 * Se cachea por request con `cache()` de React: en un render se puede llamar
 * desde el layout, la página y varios Server Components, y sería una consulta
 * a la DB por cada llamada.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()

  // getUser() valida el token contra Supabase. getSession() lee la cookie sin
  // verificar la firma, así que no sirve para decidir accesos.
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const [persona] = await db
    .select({
      id: people.id,
      authUserId: people.authUserId,
      nombre: people.nombre,
      role: people.role,
      legajo: people.legajo,
      email: people.email,
      estado: people.estado,
    })
    .from(people)
    .where(eq(people.authUserId, user.id))
    .limit(1)

  // Hay sesión de Supabase pero la persona no está aprovisionada en people.
  // No se le asume ningún rol: sin fila, sin acceso.
  if (!persona || !persona.authUserId) return null

  // Persona dada de baja: la sesión puede seguir viva, el acceso no.
  if (persona.estado === "Inactivo") return null

  return {
    id: persona.id,
    authUserId: persona.authUserId,
    nombre: persona.nombre,
    role: persona.role,
    legajo: persona.legajo,
    email: persona.email,
  }
})

/** Igual que getSessionUser pero tira Error si no hay sesión. Para Server Actions. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) {
    // Mensaje genérico a propósito: no distingue "sin sesión" de "sin fila en
    // people" ni de "inactivo", para no darle información al que sondea.
    throw new LabAuthError(
      "No tenés una sesión activa. Iniciá sesión para continuar.",
    )
  }
  return user
}

/** Tira Error si el usuario no tiene alguno de los roles indicados. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser()
  if (!roles.includes(user.role)) {
    throw new LabAuthError("No tenés permisos para realizar esta acción.")
  }
  return user
}
