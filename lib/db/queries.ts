import "server-only"

import { desc, eq } from "drizzle-orm"

import { db } from "./client"
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

export async function getPeople() {
  const rows = await db.select().from(s.people).orderBy(s.people.id)
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

/** Snapshot completo para hidratar el store en el primer render. */
export async function getLabSnapshot() {
  const [equipment, people, loans, bookings, tickets, sanctions, audit] =
    await Promise.all([
      getEquipment(),
      getPeople(),
      getLoans(),
      getBookings(),
      getTickets(),
      getSanctions(),
      getAudit(),
    ])

  return { equipment, people, loans, bookings, tickets, sanctions, audit }
}

export type LabSnapshot = Awaited<ReturnType<typeof getLabSnapshot>>
