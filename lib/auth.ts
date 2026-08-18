import "server-only"

import { and, eq } from "drizzle-orm"
import { cache } from "react"

import { db } from "@/lib/db/client"
import { LabAuthError } from "@/lib/errors"
import { esErrorDeConexion, mockAdmin, mockForzado } from "@/lib/db/mock"
import { people } from "@/lib/db/schema"
import type { Role } from "@/lib/lab-data"

export type SessionUser = {
  /** id de people, ej "ADM-01" */
  id: string
  nombre: string
  role: Role
  legajo: string
  email: string | null
}

/**
 * La aplicación no pide login: no hay sesión de la que leer al usuario, así que
 * el actor sale directo de `people`.
 *
 * Se elige un admin Activo y no una fila cualquiera porque toda la app pasa por
 * requireRole("admin") para las operaciones de escritura; con otro rol la mitad
 * de las pantallas quedaría inutilizable.
 *
 * Consecuencia a tener presente: sin sesión no hay identidad por persona. Todo
 * lo que la app audita — quién prestó, quién sancionó — queda registrado a
 * nombre de este admin, sea quien sea el que está frente a la pantalla.
 *
 * Se cachea por request con `cache()` de React: en un render se llama desde la
 * página y desde varios Server Components, y sería una consulta por cada uno.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (mockForzado()) return adminDeDemo()

  try {
    const [persona] = await db
      .select({
        id: people.id,
        nombre: people.nombre,
        role: people.role,
        legajo: people.legajo,
        email: people.email,
      })
      .from(people)
      .where(and(eq(people.role, "admin"), eq(people.estado, "Activo")))
      .limit(1)

    return persona ?? null
  } catch (error) {
    // Mismo criterio que getLabSnapshot: solo la caída de conexión habilita el
    // actor de demo. Un error de SQL tiene que explotar.
    if (!esErrorDeConexion(error)) throw error
    return adminDeDemo()
  }
})

function adminDeDemo(): SessionUser | null {
  const persona = mockAdmin()
  if (!persona) return null
  return {
    id: persona.id,
    nombre: persona.nombre,
    role: persona.role,
    legajo: persona.legajo ?? "",
    email: persona.email ?? null,
  }
}

/**
 * Sin login los únicos dos estados posibles son "hay un admin en la base" y "no
 * hay ninguno". El segundo no es un problema de permisos sino de datos: la base
 * está vacía o sin sembrar.
 */
export type AccountState =
  | { kind: "activo"; user: SessionUser }
  | { kind: "sin-admin" }

export const getAccountState = cache(async (): Promise<AccountState> => {
  const user = await getSessionUser()
  return user ? { kind: "activo", user } : { kind: "sin-admin" }
})

/** Devuelve el actor, o tira Error si no hay ninguno usable. Para Server Actions. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) {
    throw new LabAuthError(
      "No hay ningún usuario administrador activo en la base de datos.",
    )
  }
  return user
}

/** Tira Error si el actor no tiene alguno de los roles indicados. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser()
  if (!roles.includes(user.role)) {
    throw new LabAuthError("No tenés permisos para realizar esta acción.")
  }
  return user
}
