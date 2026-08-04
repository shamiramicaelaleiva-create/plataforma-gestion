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
  EQUIPMENT,
  LOANS,
  PEOPLE,
  SANCTIONS,
  TICKETS,
  type AuditEntry,
  type Booking,
  type Equipment,
  type Loan,
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
  bookings: Booking[]
  loans: Loan[]
  sanctions: Sanction[]
  tickets: Ticket[]
  audit: AuditEntry[]
  toasts: Toast[]
  notify: (msg: string) => void
  registerLoan: (input: { equipoId: string; alumno: string; docente: string }) => void
  addBooking: (b: Omit<Booking, "id">) => void
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
    const person = PEOPLE.find((p) => p.id === currentUserId)
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

  function registerLoan(input: {
    equipoId: string
    alumno: string
    docente: string
  }) {
    const eq = equipment.find((e) => e.id === input.equipoId)
    if (!eq) return
    const prev = eq.disponible
    setEquipment((list) =>
      list.map((e) =>
        e.id === input.equipoId
          ? {
              ...e,
              disponible: Math.max(0, e.disponible - 1),
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
    notify(`Préstamo ${id} registrado correctamente`)
  }

  function addBooking(b: Omit<Booking, "id">) {
    const id = `B-${(bookings.length + 1).toString().padStart(2, "0")}`
    setBookings((list) => [...list, { ...b, id }])
    pushAudit(`Reservó módulo ${id}`, "—", `${b.dia} M${b.modulo}`)
    notify(`Reserva ${id} creada para ${b.division}`)
  }

  function updateTicketStatus(id: string, estado: TicketStatus) {
    let prev = ""
    setTickets((list) =>
      list.map((t) => {
        if (t.id === id) {
          prev = t.estado
          return { ...t, estado }
        }
        return t
      }),
    )
    pushAudit(`Cambió estado ticket ${id}`, prev, estado)
    notify(`Ticket ${id} actualizado a "${estado}"`)
  }

  function liftSanction(id: string) {
    let alumno = ""
    setSanctions((list) =>
      list.map((s) => {
        if (s.id === id) {
          alumno = s.nombre
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
      bookings,
      loans,
      sanctions,
      tickets,
      audit,
      toasts,
      notify,
      registerLoan,
      addBooking,
      updateTicketStatus,
      liftSanction,
    }),
    [role, currentUserId, equipment, bookings, loans, sanctions, tickets, audit, toasts], // <-- CORREGIDO: Cambiado setRole por equipment
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