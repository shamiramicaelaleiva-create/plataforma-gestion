import "server-only"

import { desc, eq, ne } from "drizzle-orm"

import type { Role } from "@/lib/lab-data"

import { db } from "./client"
import { esErrorDeConexion, mockForzado, mockSnapshot } from "./mock"
import {
  toAuditEntry,
  toBooking,
  toEquipment,
  toLoan,
  toPersona,
  toSanction,
  toTicket,
} from "./mappers"
import * as s from "./schema"

/**
 * Capa de lectura. Devuelve siempre tipos de la app, nunca filas crudas, para
 * que ningún componente termine dependiendo de los nombres de columna.
 */

export async function getEquipment() {
  const rows = await db.select().from(s.equipment).orderBy(s.equipment.id)
  return rows.map(toEquipment)
}

/**
 * Personas del padrón. Excluye las pendientes de aprobación a propósito: si
 * aparecieran acá se colarían en el listado de usuarios y, peor, en los combos
 * que eligen alumno y docente para un préstamo. Alguien que todavía no fue
 * aceptado no puede figurar como responsable de un equipo.
 */
export async function getPeople() {
  const rows = await db
    .select()
    .from(s.people)
    .where(ne(s.people.estado, "Pendiente"))
    .orderBy(s.people.id)
  return rows.map(toPersona)
}

/** Bandeja de solicitudes de autorregistro. Las más viejas primero: son las que llevan más tiempo esperando. */
export async function getPendingPeople() {
  const rows = await db
    .select()
    .from(s.people)
    .where(eq(s.people.estado, "Pendiente"))
    .orderBy(s.people.createdAt)
  return rows.map(toPersona)
}

export async function getLoans() {
  const rows = await db.select().from(s.loans).orderBy(desc(s.loans.createdAt))
  return rows.map(toLoan)
}

export async function getBookings() {
  const rows = await db.select().from(s.bookings).orderBy(s.bookings.id)
  return rows.map(toBooking)
}

export async function getTickets() {
  const rows = await db
    .select()
    .from(s.tickets)
    .orderBy(desc(s.tickets.createdAt))
  return rows.map(toTicket)
}

export async function getSanctions() {
  const rows = await db
    .select()
    .from(s.sanctions)
    .orderBy(desc(s.sanctions.createdAt))
  return rows.map(toSanction)
}

/**
 * El log de auditoría crece indefinidamente, así que se lee acotado.
 * Sin el límite, el día que haya 50.000 entradas la home tarda en cargar.
 */
export async function getAudit(limit = 200) {
  const rows = await db
    .select()
    .from(s.audit)
    .orderBy(desc(s.audit.fecha))
    .limit(limit)
  return rows.map(toAuditEntry)
}

export async function getPersonByAuthUserId(authUserId: string) {
  const [row] = await db
    .select()
    .from(s.people)
    .where(eq(s.people.authUserId, authUserId))
    .limit(1)
  return row ? toPersona(row) : null
}

/**
 * Snapshot completo para hidratar el store en el primer render.
 *
 * Recibe el rol porque no todo se le manda a todos. Las solicitudes de acceso
 * llevan nombre y email de gente que todavía no fue aceptada; si viajaran en el
 * snapshot de cualquier alumno estarían en el HTML de su navegador, aunque la
 * pantalla que las muestra esté oculta. Esconder un módulo en el cliente no es
 * ocultar el dato: lo que no se manda es lo único que no se puede leer.
 */
export async function getLabSnapshot(role: Role) {
  if (mockForzado()) return mockSnapshot(role)

  try {
    return await leerSnapshot(role)
  } catch (error) {
    // Sin base no se puede mostrar nada, y una pantalla de error deja la app
    // inservible para trabajar en la UI. Se cae a los datos de demo, pero
    // ruidosamente: en el log queda claro que lo que se ve no es la base.
    if (!esErrorDeConexion(error)) throw error
    console.warn(
      "[lab] Sin conexión a Postgres. Sirviendo datos de demostración.",
      error,
    )
    return mockSnapshot(role)
  }
}

async function leerSnapshot(role: Role) {
  const [
    equipment,
    people,
    solicitudes,
    loans,
    bookings,
    tickets,
    sanctions,
    audit,
  ] = await Promise.all([
    getEquipment(),
    getPeople(),
    role === "admin" ? getPendingPeople() : Promise.resolve([]),
    getLoans(),
    getBookings(),
    getTickets(),
    getSanctions(),
    getAudit(),
  ])

  return {
    equipment,
    people,
    solicitudes,
    loans,
    bookings,
    tickets,
    sanctions,
    audit,
  }
}

export type LabSnapshot = Awaited<ReturnType<typeof getLabSnapshot>>
