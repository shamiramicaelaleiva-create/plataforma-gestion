import type {
  AuditEntry,
  Booking,
  Equipment,
  Loan,
  Persona,
  Sanction,
  Ticket,
} from "@/lib/lab-data"

import type {
  AuditRow,
  BookingRow,
  EquipmentRow,
  LoanRow,
  PersonRow,
  SanctionRow,
  TicketRow,
} from "./schema"

/**
 * Traductores fila-de-base → tipo de la app.
 *
 * Existen para que la migración a Postgres no obligue a reescribir los diez
 * módulos de UI. La base usa snake_case y admite NULL; los componentes esperan
 * los tipos de lib/lab-data.ts, con campos opcionales en vez de null. Toda esa
 * fricción se resuelve acá y en un solo lugar.
 */

export function toEquipment(r: EquipmentRow): Equipment {
  return {
    id: r.id,
    nombre: r.nombre,
    categoria: r.categoria,
    total: r.total,
    disponible: r.disponible,
    estado: r.estado,
  }
}

export function toPersona(r: PersonRow): Persona {
  return {
    id: r.id,
    nombre: r.nombre,
    role: r.role,
    legajo: r.legajo,
    email: r.email ?? undefined,
    curso: r.curso ?? undefined,
    division: r.division ?? undefined,
    orientacion: r.orientacion ?? undefined,
    supervisor: r.supervisor ?? undefined,
    estado: r.estado,
  }
}

export function toLoan(r: LoanRow): Loan {
  return {
    id: r.id,
    equipo: r.equipo,
    equipoId: r.equipoId,
    alumno: r.alumno,
    docente: r.docente,
    fechaSalida: r.fechaSalida,
    fechaDevolucionPrevista: r.fechaDevolucionPrevista,
    fechaDevolucion: r.fechaDevolucion ?? undefined,
    estado: r.estado,
  }
}

export function toBooking(r: BookingRow): Booking {
  return {
    id: r.id,
    dia: r.dia,
    moduloId: r.moduloId,
    division: r.division,
    docente: r.docente ?? undefined,
    actividad: r.actividad ?? undefined,
    fecha: r.fecha ?? undefined,
  }
}

export function toTicket(r: TicketRow): Ticket {
  return {
    id: r.id,
    equipoId: r.equipoId,
    equipo: r.equipo,
    problema: r.problema,
    reporta: r.reporta,
    tecnico: r.tecnico,
    fecha: r.fecha,
    estado: r.estado,
  }
}

export function toSanction(r: SanctionRow): Sanction {
  return {
    id: r.id,
    alumno: r.alumno,
    legajo: r.legajo,
    nivel: r.nivel,
    motivo: r.motivo,
    dias: r.dias,
    fecha: r.fecha,
    activa: r.activa,
  }
}

export function toAuditEntry(r: AuditRow): AuditEntry {
  const d = r.fecha
  return {
    id: r.id,
    // La UI muestra "YYYY-MM-DD HH:MM"; la base guarda timestamptz.
    fecha: `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`,
    usuario: r.usuario,
    rol: r.rol,
    accion: r.accion,
    anterior: r.anterior,
    siguiente: r.siguiente,
  }
}
