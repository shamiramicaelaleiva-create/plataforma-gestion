"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  AUDIT,
  BOOKINGS,
  canLoan,
  CATEGORIA_PREFIX,
  EQUIPMENT,
  LOANS,
  PEOPLE,
  SANCTIONS,
  TICKETS,
  type AuditEntry,
  type Booking,
  type Equipment,
  type Loan,
  type Persona,
  type Role,
  type Sanction,
  type Ticket,
  type TicketStatus,
} from "./lab-data"

interface Toast {
  id: number
  msg: string
}

interface LabContextValue {
  role: Role
  setRole: (r: Role) => void
  currentUserId: string
  setCurrentUserId: (id: string) => void
  equipment: Equipment[]
  setEquipment: React.Dispatch<React.SetStateAction<Equipment[]>> // <-- CORREGIDO: Agregado el tipado correcto
  addEquipment: (input: {
    nombre: string
    categoria: Equipment["categoria"]
    total: number
    estado: Equipment["estado"]
  }) => void
  people: Persona[]
  addPerson: (input: {
    nombre: string
    role: Role
    email?: string
    curso?: string
    division?: string
    orientacion?: string
    supervisor?: string
  }) => void
  bookings: Booking[]
  loans: Loan[]
  sanctions: Sanction[]
  tickets: Ticket[]
  audit: AuditEntry[]
  toasts: Toast[]
  notify: (msg: string) => void
  registerLoan: (input: { equipoId: string; alumno: string; docente: string }) => void
  returnLoan: (loanId: string) => void
  registerBooking: (b: Omit<Booking, "id">) => void
  updateStock: (id: string, disponible: number) => void
  updateEquipmentStatus: (id: string, estado: Equipment["estado"]) => void
  createTicket: (input: {
    equipoId: string
    problema: string
    tecnico: string
  }) => void
  updateTicketStatus: (id: string, estado: TicketStatus) => void
  liftSanction: (id: string) => void
}

const LabContext = createContext<LabContextValue | null>(null)

let toastSeq = 0
let auditSeq = 9100

export function LabProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("admin")
  const [currentUserId, setCurrentUserId] = useState("ADM-01")
  const [equipment, setEquipment] = useState<Equipment[]>(EQUIPMENT)
  const [people, setPeople] = useState<Persona[]>(PEOPLE)
  const [bookings, setBookings] = useState<Booking[]>(BOOKINGS)
  const [loans, setLoans] = useState<Loan[]>(LOANS)
  const [sanctions, setSanctions] = useState<Sanction[]>(SANCTIONS)
  const [tickets, setTickets] = useState<Ticket[]>(TICKETS)
  const [audit, setAudit] = useState<AuditEntry[]>(AUDIT)
  const [toasts, setToasts] = useState<Toast[]>([])

  function notify(msg: string) {
    const id = ++toastSeq
    setToasts((t) => [...t, { id, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }

  function pushAudit(accion: string, anterior: string, siguiente: string) {
    const person = people.find((p) => p.id === currentUserId)
    const now = new Date()
    const stamp = `${now.toISOString().slice(0, 10)} ${now
      .toTimeString()
      .slice(0, 5)}`
    setAudit((a) => [
      {
        id: `A-${++auditSeq}`,
        fecha: stamp,
        usuario: person?.nombre ?? "Sistema",
        rol: role,
        accion,
        anterior,
        siguiente,
      },
      ...a,
    ])
  }

  const ROLE_PREFIX: Record<Role, string> = {
    admin: "ADM",
    docente: "P",
    alumno: "A",
  }

  function addPerson(input: {
    nombre: string
    role: Role
    email?: string
    curso?: string
    division?: string
    orientacion?: string
    supervisor?: string
  }) {
    const prefix = ROLE_PREFIX[input.role]
    const seq = people.filter((p) => p.role === input.role).length + 1
    const id = `${prefix}-${seq.toString().padStart(2, "0")}`
    const persona: Persona = {
      id,
      legajo: `LEG-${id}`,
      nombre: input.nombre,
      role: input.role,
      email:
        input.email?.trim() ||
        `${id.toLowerCase()}@escuela.edu.ar`,
      curso: input.curso,
      division: input.division,
      orientacion: input.orientacion,
      supervisor: input.supervisor,
      estado: "Activo",
    }
    setPeople((list) => [...list, persona])
    pushAudit(`Dio de alta al usuario ${id}`, "—", `${persona.nombre} (${input.role})`)
    notify(`Usuario ${persona.nombre} creado con legajo ${persona.legajo}`)
  }

  function addEquipment(input: {
    nombre: string
    categoria: Equipment["categoria"]
    total: number
    estado: Equipment["estado"]
  }) {
    const prefix = CATEGORIA_PREFIX[input.categoria]
    const seq =
      equipment.filter((e) => e.id.startsWith(`${prefix}-`)).length + 1
    const id = `${prefix}-${seq.toString().padStart(2, "0")}`
    const item: Equipment = {
      id,
      nombre: input.nombre,
      categoria: input.categoria,
      total: input.total,
      disponible: input.total,
      estado: input.estado,
    }
    setEquipment((list) => [...list, item])
    pushAudit(
      `Dio de alta el artículo ${id}`,
      "—",
      `${item.nombre} · ${item.total} u.`,
    )
    notify(`Artículo ${id} agregado al inventario (${item.total} u.)`)
  }

  function registerLoan(input: {
    equipoId: string
    alumno: string
    docente: string
  }) {
    const eq = equipment.find((e) => e.id === input.equipoId)
    if (!eq) return
    if (!canLoan(eq.estado, eq.disponible)) {
      return notify(
        `Sin stock disponible de "${eq.nombre}" o el equipo no está apto para préstamo.`,
      )
    }
    const prev = eq.disponible
    // Se descuenta una unidad del stock disponible hasta que se registre la devolución.
    setEquipment((list) =>
      list.map((e) =>
        e.id === input.equipoId
          ? {
              ...e,
              disponible: e.disponible - 1,
              estado: e.disponible - 1 <= 0 ? "En Uso Activo" : e.estado,
            }
          : e,
      ),
    )
    const id = `P-${2000 + loans.length + 1}`

    setLoans((l) => [
      {
        id,
        equipo: eq.nombre,
        equipoId: eq.id,
        alumno: input.alumno,
        docente: input.docente,
        fechaSalida: new Date().toISOString().slice(0, 10),
        fechaDevolucionPrevista: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .slice(0, 10),
        estado: "Activo", // <-- Guardado con "A" mayúscula
      },
      ...l,
    ])
    pushAudit(
      `Registró préstamo ${id} (${eq.nombre})`,
      `Disponible: ${prev}`,
      `Disponible: ${Math.max(0, prev - 1)}`,
    )
    notify(
      `Préstamo ${id} registrado. Stock de "${eq.nombre}": ${prev - 1}/${eq.total}`,
    )
  }

  /** Devuelve el equipo al inventario: repone la unidad y cierra el préstamo. */
  function returnLoan(loanId: string) {
    const loan = loans.find((l) => l.id === loanId)
    if (!loan) return
    if (loan.estado === "Devuelto") {
      return notify(`El préstamo ${loanId} ya figura como devuelto.`)
    }

    const eq = equipment.find((e) => e.id === loan.equipoId)
    const prev = eq?.disponible ?? 0

    setEquipment((list) =>
      list.map((e) =>
        e.id === loan.equipoId
          ? {
              ...e,
              // Nunca reponer por encima del total físico del inventario.
              disponible: Math.min(e.total, e.disponible + 1),
              // Si estaba marcado "En Uso Activo" solo por falta de stock, vuelve a Operativo.
              estado:
                e.estado === "En Uso Activo" && e.disponible + 1 > 0
                  ? "Operativo"
                  : e.estado,
            }
          : e,
      ),
    )

    setLoans((list) =>
      list.map((l) =>
        l.id === loanId
          ? {
              ...l,
              estado: "Devuelto",
              fechaDevolucion: new Date().toISOString().slice(0, 10),
            }
          : l,
      ),
    )

    pushAudit(
      `Registró devolución del préstamo ${loanId} (${loan.equipo})`,
      `Disponible: ${prev}`,
      `Disponible: ${eq ? Math.min(eq.total, prev + 1) : prev + 1}`,
    )
    notify(`Devolución de "${loan.equipo}" registrada. Stock repuesto.`)
  }

  function registerBooking(b: Omit<Booking, "id">) {
    const id = `B-${(bookings.length + 1).toString().padStart(2, "0")}`
    setBookings((list) => [...list, { ...b, id }])
    pushAudit(`Reservó módulo ${id}`, "—", `${b.dia} ${b.moduloId}`)
    notify(`Reserva ${id} creada para ${b.division}`)
  }

  /** Ajuste manual del stock disponible desde el módulo de inventario. */
  function updateStock(id: string, disponible: number) {
    const eq = equipment.find((e) => e.id === id)
    if (!eq) return
    if (disponible < 0 || disponible > eq.total) {
      return notify(
        `El stock disponible debe estar entre 0 y ${eq.total} unidades.`,
      )
    }
    if (disponible === eq.disponible) return

    setEquipment((list) =>
      list.map((e) => (e.id === id ? { ...e, disponible } : e)),
    )
    pushAudit(
      `Ajustó el stock de ${eq.nombre} (${id})`,
      `Disponible: ${eq.disponible}`,
      `Disponible: ${disponible}`,
    )
    notify(`Stock de "${eq.nombre}" actualizado a ${disponible}/${eq.total}`)
  }

  /** Cambio manual del estado técnico de un artículo. */
  function updateEquipmentStatus(id: string, estado: Equipment["estado"]) {
    const eq = equipment.find((e) => e.id === id)
    if (!eq || eq.estado === estado) return

    setEquipment((list) =>
      list.map((e) => (e.id === id ? { ...e, estado } : e)),
    )
    pushAudit(
      `Cambió el estado técnico de ${eq.nombre} (${id})`,
      eq.estado,
      estado,
    )
    notify(`"${eq.nombre}" pasó a estado "${estado}"`)
  }

  function createTicket(input: {
    equipoId: string
    problema: string
    tecnico: string
  }) {
    const eq = equipment.find((e) => e.id === input.equipoId)
    if (!eq) return
    const abiertoPrevio = tickets.find(
      (t) => t.equipoId === input.equipoId && t.estado !== "solucionado",
    )
    if (abiertoPrevio) {
      return notify(
        `"${eq.nombre}" ya tiene el ticket ${abiertoPrevio.id} abierto.`,
      )
    }

    const reporta =
      people.find((p) => p.id === currentUserId)?.nombre ?? "Sistema"
    const id = `T-${(tickets.length + 1).toString().padStart(3, "0")}`
    const ticket: Ticket = {
      id,
      equipoId: eq.id,
      equipo: eq.nombre,
      problema: input.problema,
      reporta,
      tecnico: input.tecnico || "Sin asignar",
      fecha: new Date().toISOString().slice(0, 10),
      estado: "pendiente",
    }
    setTickets((list) => [ticket, ...list])
    pushAudit(
      `Abrió el ticket ${id} sobre ${eq.nombre} (${eq.id})`,
      "Sin ticket",
      `Pendiente · ${input.problema}`,
    )
    notify(`Ticket ${id} creado para "${eq.nombre}"`)
  }

  function updateTicketStatus(id: string, estado: TicketStatus) {
    const ticket = tickets.find((t) => t.id === id)
    if (!ticket || ticket.estado === estado) return

    setTickets((list) =>
      list.map((t) => (t.id === id ? { ...t, estado } : t)),
    )
    pushAudit(`Cambió estado del ticket ${id}`, ticket.estado, estado)

    // El ticket manda sobre el estado técnico del artículo asociado.
    const eq = equipment.find((e) => e.id === ticket.equipoId)
    if (eq) {
      const nuevoEstado: Equipment["estado"] | null =
        estado === "proceso"
          ? "En Reparación"
          : estado === "solucionado"
            ? "Operativo"
            : null
      if (nuevoEstado && nuevoEstado !== eq.estado) {
        setEquipment((list) =>
          list.map((e) =>
            e.id === eq.id ? { ...e, estado: nuevoEstado } : e,
          ),
        )
        pushAudit(
          `Ticket ${id}: actualizó el estado de ${eq.nombre} (${eq.id})`,
          eq.estado,
          nuevoEstado,
        )
      }
    }

    notify(`Ticket ${id} actualizado a "${estado}"`)
  }

  function liftSanction(id: string) {
    let alumno = ""
    setSanctions((list) =>
      list.map((s) => {
        if (s.id === id) {
          alumno = s.alumno
          return { ...s, activa: false }
        }
        return s
      }),
    )
    pushAudit(`Levantó sanción ${id}`, "Activa", "Levantada")
    notify(`Sanción de ${alumno} levantada`)
  }

  const value = useMemo<LabContextValue>(
    () => ({
      role,
      setRole,
      currentUserId,
      setCurrentUserId,
      equipment,
      setEquipment, // <-- CORREGIDO: Exportado en el provider
      addEquipment,
      people,
      addPerson,
      bookings,
      loans,
      sanctions,
      tickets,
      audit,
      toasts,
      notify,
      registerLoan,
      returnLoan,
      registerBooking,
      updateStock,
      updateEquipmentStatus,
      createTicket,
      updateTicketStatus,
      liftSanction,
    }),
    [role, currentUserId, equipment, people, bookings, loans, sanctions, tickets, audit, toasts], // <-- CORREGIDO: Cambiado setRole por equipment
  )

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>
}

export function useLab() {
  const ctx = useContext(LabContext)
  if (!ctx) throw new Error("useLab must be used within LabProvider")
  return ctx
}

const ROLE_DEFAULT_USER: Record<Role, string> = {
  admin: "U-001",
  docente: "U-002",
  alumno: "U-003",
}