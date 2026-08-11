import { relations } from "drizzle-orm"
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

/**
 * Los enums viven en la base y no solo en TypeScript: si un valor inválido
 * llega por cualquier vía (script, consola de Supabase, otro cliente), Postgres
 * lo rechaza. TypeScript solo protege el código que compilamos nosotros.
 */
export const roleEnum = pgEnum("role", ["admin", "docente", "alumno"])

export const equipmentCategoryEnum = pgEnum("equipment_category", [
  "Llaves",
  "Hardware",
  "Componentes",
  "Periféricos",
  "Herramientas",
])

export const equipmentStatusEnum = pgEnum("equipment_status", [
  "Operativo",
  "En Mantenimiento",
  "Fuera de Servicio",
  "En Reparación",
  "En Uso Activo",
])

/**
 * "Pendiente" es una persona que se registró sola desde /registro y todavía no
 * fue aprobada por preceptoría. Tiene cuenta de Supabase Auth y fila acá, pero
 * `getSessionUser` le niega el acceso hasta que un admin le asigne rol real y
 * la pase a "Activo". El rol que lleva mientras tanto es provisorio y no se usa.
 */
export const personStatusEnum = pgEnum("person_status", [
  "Activo",
  "Inactivo",
  "Pendiente",
])

export const loanStatusEnum = pgEnum("loan_status", ["Activo", "Devuelto"])

export const ticketStatusEnum = pgEnum("ticket_status", [
  "pendiente",
  "proceso",
  "solucionado",
])

export const sanctionLevelEnum = pgEnum("sanction_level", ["amarilla", "roja"])

/**
 * Personas del laboratorio (preceptor, docentes, alumnos).
 *
 * El id es texto legible ("A-01", "P-03") porque la UI lo muestra y el colegio
 * ya trabaja con esos códigos. `authUserId` enlaza con auth.users de Supabase:
 * es null mientras la persona no tenga login habilitado.
 */
export const people = pgTable(
  "people",
  {
    id: text("id").primaryKey(),
    authUserId: uuid("auth_user_id").unique(),
    nombre: text("nombre").notNull(),
    role: roleEnum("role").notNull(),
    legajo: text("legajo").notNull().unique(),
    email: text("email"),
    curso: text("curso"),
    division: text("division"),
    orientacion: text("orientacion"),
    supervisor: text("supervisor"),
    estado: personStatusEnum("estado").notNull().default("Activo"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("people_email_idx").on(t.email)],
)

/**
 * Inventario. `disponible` es stock libre y `total` es stock físico.
 * La invariante 0 <= disponible <= total se refuerza con CHECK constraints
 * en la migración SQL, no solo acá.
 */
export const equipment = pgTable("equipment", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  categoria: equipmentCategoryEnum("categoria").notNull(),
  total: integer("total").notNull(),
  disponible: integer("disponible").notNull(),
  estado: equipmentStatusEnum("estado").notNull().default("Operativo"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

/**
 * Préstamos. Cada fila es una unidad entregada; el descuento de stock ocurre
 * en la misma transacción que inserta el préstamo.
 */
export const loans = pgTable("loans", {
  id: text("id").primaryKey(),
  equipoId: text("equipo_id")
    .notNull()
    .references(() => equipment.id, { onDelete: "restrict" }),
  // Se guarda el nombre además del FK: es un dato histórico. Si mañana renombran
  // el artículo, el comprobante del préstamo tiene que seguir diciendo lo que se
  // entregó ese día.
  equipo: text("equipo").notNull(),
  alumno: text("alumno").notNull(),
  docente: text("docente").notNull(),
  fechaSalida: date("fecha_salida").notNull(),
  fechaDevolucionPrevista: date("fecha_devolucion_prevista").notNull(),
  fechaDevolucion: date("fecha_devolucion"),
  estado: loanStatusEnum("estado").notNull().default("Activo"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

/** Reservas de módulos horarios del laboratorio. */
export const bookings = pgTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    dia: text("dia").notNull(),
    moduloId: text("modulo_id").notNull(),
    division: text("division").notNull(),
    docente: text("docente"),
    actividad: text("actividad"),
    fecha: date("fecha"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  // Un módulo de un día no se puede reservar dos veces. Antes esto se
  // "controlaba" en el cliente, o sea que no se controlaba.
  (t) => [uniqueIndex("bookings_slot_idx").on(t.dia, t.moduloId, t.fecha)],
)

/** Tickets de mantenimiento sobre artículos del inventario. */
export const tickets = pgTable("tickets", {
  id: text("id").primaryKey(),
  equipoId: text("equipo_id")
    .notNull()
    .references(() => equipment.id, { onDelete: "restrict" }),
  equipo: text("equipo").notNull(),
  problema: text("problema").notNull(),
  reporta: text("reporta").notNull(),
  tecnico: text("tecnico").notNull().default("Sin asignar"),
  fecha: date("fecha").notNull(),
  estado: ticketStatusEnum("estado").notNull().default("pendiente"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

/** Sanciones a alumnos. */
export const sanctions = pgTable("sanctions", {
  id: text("id").primaryKey(),
  alumno: text("alumno").notNull(),
  legajo: text("legajo").notNull(),
  nivel: sanctionLevelEnum("nivel").notNull(),
  motivo: text("motivo").notNull(),
  dias: integer("dias").notNull(),
  fecha: date("fecha").notNull(),
  activa: boolean("activa").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

/**
 * Registro de auditoría: append-only. La migración le revoca UPDATE y DELETE
 * a todos los roles de aplicación — un log que se puede editar no es un log.
 */
export const audit = pgTable("audit", {
  id: text("id").primaryKey(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull().defaultNow(),
  usuario: text("usuario").notNull(),
  rol: roleEnum("rol").notNull(),
  accion: text("accion").notNull(),
  anterior: text("anterior").notNull(),
  siguiente: text("siguiente").notNull(),
})

/**
 * Contadores para los IDs legibles (LL-01, P-2001, T-001).
 * Se incrementan dentro de la transacción, así dos usuarios simultáneos nunca
 * generan el mismo ID. El `equipment.filter(...).length + 1` del store viejo
 * repetía IDs apenas se borraba una fila.
 */
export const idCounters = pgTable("id_counters", {
  prefix: text("prefix").primaryKey(),
  value: integer("value").notNull().default(0),
})

export const equipmentRelations = relations(equipment, ({ many }) => ({
  loans: many(loans),
  tickets: many(tickets),
}))

export const loansRelations = relations(loans, ({ one }) => ({
  equipo: one(equipment, {
    fields: [loans.equipoId],
    references: [equipment.id],
  }),
}))

export const ticketsRelations = relations(tickets, ({ one }) => ({
  equipo: one(equipment, {
    fields: [tickets.equipoId],
    references: [equipment.id],
  }),
}))

export type PersonRow = typeof people.$inferSelect
export type EquipmentRow = typeof equipment.$inferSelect
export type LoanRow = typeof loans.$inferSelect
export type BookingRow = typeof bookings.$inferSelect
export type TicketRow = typeof tickets.$inferSelect
export type SanctionRow = typeof sanctions.$inferSelect
export type AuditRow = typeof audit.$inferSelect
