import "server-only"

import { and, asc, eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { cache } from "react"

import { db } from "@/lib/db/client"
import { DEMO_MODE, DEMO_ROLE_COOKIE } from "@/lib/demo"
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

const ROLES_DEMO: readonly Role[] = ["admin", "docente", "alumno"]

/**
 * Usuario ficticio del modo demo, armado a partir de una fila REAL de `people`.
 *
 * POR QUÉ UNA FILA REAL Y NO UN ID INVENTADO: `audit.actor_id`, `loans` y
 * `sanctions` referencian `people.id` por foreign key. Con un id que no existe,
 * el primer INSERT de cualquier mutación revienta y la demo se cae justo
 * cuando se está mostrando. Por eso el id (y solo el id) sale de la base.
 *
 * El ROL, en cambio, sale de la cookie que escribe el selector, no de la fila:
 * lo que se está demostrando es cómo cambia la app según el rol, y requireRole
 * sigue colgando de acá, así que elegir "alumno" realmente recorta lo que se
 * puede hacer.
 *
 * Cacheado por request igual que getSessionUser: se llama desde el layout, la
 * página y varios Server Components en un mismo render.
 */
const getDemoUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies()
  const pedido = cookieStore.get(DEMO_ROLE_COOKIE)?.value

  // Default admin: sin cookie (primera visita) o con un valor manipulado a
  // mano, la demo abre con el rol que muestra la app completa.
  const role: Role = ROLES_DEMO.includes(pedido as Role)
    ? (pedido as Role)
    : "admin"

  const columnas = {
    id: people.id,
    authUserId: people.authUserId,
    nombre: people.nombre,
    legajo: people.legajo,
    email: people.email,
  }

  // Se ordena por id para que la persona elegida sea siempre la misma entre
  // requests: si cambiara, la auditoría de la demo quedaría a nombre de gente
  // distinta en cada click.
  const [persona] = await db
    .select(columnas)
    .from(people)
    .where(and(eq(people.role, role), eq(people.estado, "Activo")))
    .orderBy(asc(people.id))
    .limit(1)

  if (persona) return { ...persona, authUserId: persona.authUserId ?? "", role }

  // FALLBACK: no hay ninguna persona activa con el rol pedido (una base recién
  // migrada puede no tener docentes, por ejemplo). Antes que devolver null y
  // dejar la app inaccesible en plena demo, se toma cualquier persona activa
  // para prestarle el id, conservando el rol elegido en el selector. Si la
  // tabla está vacía sí devuelve null: sin fila no hay id válido para las FK y
  // cualquier mutación fallaría igual, mejor que se vea el estado sin sesión.
  const [cualquiera] = await db
    .select(columnas)
    .from(people)
    .where(eq(people.estado, "Activo"))
    .orderBy(asc(people.id))
    .limit(1)

  if (!cualquiera) return null

  return { ...cualquiera, authUserId: cualquiera.authUserId ?? "", role }
})

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
  // El bypass de la demo va antes de todo: no se toca Supabase Auth siquiera.
  if (DEMO_MODE) return getDemoUser()

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

  // Solo "Activo" habilita. Se compara contra la lista blanca y no contra
  // "Inactivo": si mañana se agrega otro estado (suspendido, egresado), el
  // default seguro es negar, no conceder por omisión. "Pendiente" — el que deja
  // el autorregistro — cae acá y no entra hasta que un admin lo apruebe.
  if (persona.estado !== "Activo") return null

  return {
    id: persona.id,
    authUserId: persona.authUserId,
    nombre: persona.nombre,
    role: persona.role,
    legajo: persona.legajo,
    email: persona.email,
  }
})

/**
 * Por qué esto existe además de getSessionUser:
 *
 * getSessionUser devuelve null para tres situaciones distintas — sin sesión,
 * sin fila en `people`, y con fila pero no habilitada. La página de inicio no
 * puede tratarlas igual: mandar a /login a alguien que YA está logueado lo deja
 * en un rebote infinito, porque el middleware lo devuelve al inicio apenas pisa
 * /login. Necesita saber cuál de los tres casos es para mostrar la pantalla que
 * corresponde.
 *
 * "huerfano" es una cuenta de Auth sin fila en people. No debería pasar, pero
 * puede: si el registro creó el usuario en Supabase y falló el INSERT posterior.
 * Se lo trata como pendiente en la UI, con un mensaje que pide contactar a
 * preceptoría, en vez de dejarlo colgado.
 */
export type AccountState =
  | { kind: "sin-sesion" }
  | { kind: "activo"; user: SessionUser }
  | { kind: "pendiente"; nombre: string; email: string | null }
  | { kind: "inactivo" }
  | { kind: "huerfano"; email: string | null }

export const getAccountState = cache(async (): Promise<AccountState> => {
  // En demo no existen los estados intermedios: no hay cuenta de Auth que
  // pueda quedar pendiente de aprobación ni huérfana. O hay alguien activo en
  // `people` y se entra, o la tabla está vacía y cae en sin-sesión. Ojo con
  // ese último caso: la página de inicio manda a /login y el middleware de
  // demo lo devuelve al inicio, así que con `people` vacía se rebota. Es la
  // señal de que falta correr el seed, no un bug del bypass.
  if (DEMO_MODE) {
    const user = await getDemoUser()
    return user ? { kind: "activo", user } : { kind: "sin-sesion" }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return { kind: "sin-sesion" }

  const [persona] = await db
    .select()
    .from(people)
    .where(eq(people.authUserId, user.id))
    .limit(1)

  if (!persona) return { kind: "huerfano", email: user.email ?? null }
  if (persona.estado === "Pendiente") {
    return { kind: "pendiente", nombre: persona.nombre, email: persona.email }
  }
  if (persona.estado === "Inactivo") return { kind: "inactivo" }

  return {
    kind: "activo",
    user: {
      id: persona.id,
      // El NOT NULL lo garantiza el WHERE: se filtró por authUserId.
      authUserId: persona.authUserId!,
      nombre: persona.nombre,
      role: persona.role,
      legajo: persona.legajo,
      email: persona.email,
    },
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
