import "server-only"

import {
  AUDIT,
  BOOKINGS,
  EQUIPMENT,
  LOANS,
  PEOPLE,
  SANCTIONS,
  TICKETS,
  type Persona,
  type Role,
} from "@/lib/lab-data"

/**
 * Datos de demostración para trabajar sin base.
 *
 * Salen de `lib/lab-data.ts`, que ya tiene el padrón y el inventario con los
 * mismos tipos que devuelven los mappers de Drizzle, así que la UI no distingue
 * un snapshot mockeado de uno real.
 *
 * Se copian las colecciones (`[...]`) en cada llamada porque las constantes de
 * `lab-data` son arrays compartidos a nivel de módulo: si un componente los
 * mutara, la mutación quedaría pegada para todos los requests siguientes del
 * mismo proceso.
 */

export function mockSnapshot(role: Role) {
  return {
    equipment: [...EQUIPMENT],
    people: [...PEOPLE].filter((p) => p.estado !== "Pendiente"),
    solicitudes:
      role === "admin" ? [...PEOPLE].filter((p) => p.estado === "Pendiente") : [],
    loans: [...LOANS],
    bookings: [...BOOKINGS],
    tickets: [...TICKETS],
    sanctions: [...SANCTIONS],
    audit: [...AUDIT],
  }
}

/** El admin del padrón mock. Es el actor cuando no hay base a la que preguntar. */
export function mockAdmin(): Persona | null {
  return (
    PEOPLE.find((p) => p.role === "admin" && p.estado === "Activo") ?? null
  )
}

/**
 * `true` para los fallos que significan "no hay base del otro lado" — red caída,
 * host inalcanzable, DNS, timeout de conexión, credenciales.
 *
 * Se acota a esos códigos a propósito: un error de SQL (columna que no existe,
 * constraint violada) es un bug del código y tiene que explotar a la vista, no
 * quedar tapado por datos de demo que hacen parecer que todo anda.
 */
const CODIGOS_SIN_CONEXION = new Set([
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ECONNREFUSED",
  "ENOTFOUND",
  "ETIMEDOUT",
  "ECONNRESET",
  "EAI_AGAIN",
  "CONNECT_TIMEOUT",
  "CONNECTION_ENDED",
  "28P01", // password authentication failed
  "3D000", // database does not exist
])

export function esErrorDeConexion(error: unknown): boolean {
  let actual: unknown = error
  // postgres.js envuelve el error de socket en `cause`.
  for (let i = 0; i < 5 && actual; i++) {
    const code = (actual as { code?: string }).code
    if (code && CODIGOS_SIN_CONEXION.has(code)) return true
    actual = (actual as { cause?: unknown }).cause
  }
  return false
}

/** Prende el modo mock sin intentar conectarse siquiera. */
export function mockForzado() {
  return process.env.USE_MOCK_DATA === "1"
}
