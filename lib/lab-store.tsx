"use client"

import { useRouter } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react"

import { registerBookingAction } from "@/app/actions/bookings"
import {
  addEquipmentAction,
  updateEquipmentStatusAction,
  updateStockAction,
} from "@/app/actions/inventory"
import { registerLoanAction, returnLoanAction } from "@/app/actions/loans"
import { addPersonAction } from "@/app/actions/people"
import {
  createSanctionAction,
  liftSanctionAction,
} from "@/app/actions/sanctions"
import {
  createTicketAction,
  updateTicketStatusAction,
} from "@/app/actions/tickets"
import type { ActionResult } from "@/lib/action-result"
import type { LabSnapshot } from "@/lib/db/queries"
import type {
  AuditEntry,
  Booking,
  Equipment,
  Loan,
  Persona,
  Role,
  Sanction,
  SanctionLevel,
  Ticket,
  TicketStatus,
} from "@/lib/lab-data"

interface Toast {
  id: number
  msg: string
  tone: "ok" | "error"
}

export interface SessionInfo {
  id: string
  nombre: string
  role: Role
  legajo: string
}

interface LabContextValue {
  /** Rol real de la sesión, leído del servidor. Ya no es un estado del cliente. */
  role: Role
  currentUserId: string
  session: SessionInfo

  equipment: Equipment[]
  people: Persona[]
  bookings: Booking[]
  loans: Loan[]
  sanctions: Sanction[]
  tickets: Ticket[]
  audit: AuditEntry[]

  /** true mientras una mutación está en vuelo; sirve para deshabilitar botones. */
  pending: boolean
  toasts: Toast[]
  notify: (msg: string, tone?: "ok" | "error") => void

  addEquipment: (input: {
    nombre: string
    categoria: Equipment["categoria"]
    total: number
    estado: Equipment["estado"]
  }) => void
  addPerson: (input: {
    nombre: string
    role: Role
    email?: string
    curso?: string
    division?: string
    orientacion?: string
    supervisor?: string
  }) => void
  registerLoan: (input: {
    equipoId: string
    alumno: string
    docente: string
  }) => void
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
  createSanction: (input: {
    personId: string
    nivel: SanctionLevel
    motivo: string
    dias: number
  }) => void
  liftSanction: (id: string) => void
}

const LabContext = createContext<LabContextValue | null>(null)

let toastSeq = 0

/**
 * Store de la aplicación.
 *
 * Cambio de fondo respecto de la versión anterior: acá ya NO vive el estado del
 * negocio. Los datos llegan como props desde un Server Component que los lee de
 * Postgres, y las mutaciones son Server Actions. Antes cada `setEquipment` era
 * la única copia del dato que existía: refrescar la página borraba todo, y dos
 * personas usando el sistema veían inventarios distintos.
 *
 * Después de cada mutación se llama a `router.refresh()`, que vuelve a ejecutar
 * el Server Component y baja los datos frescos. Por eso no hace falta duplicar
 * el estado en el cliente: no hay dos copias que se puedan desincronizar.
 *
 * La API pública (`useLab()`) se mantuvo con los mismos nombres a propósito,
 * para que los diez módulos de UI no tuvieran que reescribirse.
 */
export function LabProvider({
  session,
  snapshot,
  children,
}: {
  session: SessionInfo
  snapshot: LabSnapshot
  children: ReactNode
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((msg: string, tone: "ok" | "error" = "ok") => {
    const id = ++toastSeq
    setToasts((t) => [...t, { id, msg, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800)
  }, [])

  /**
   * Envoltorio común de toda mutación: ejecuta la action, muestra el mensaje
   * que devolvió y recarga los datos del servidor si salió bien.
   *
   * Recargar solo en el caso exitoso es deliberado: si la action rechazó la
   * operación (sin stock, sin permisos), no hay nada nuevo que traer.
   */
  const run = useCallback(
    (action: () => Promise<ActionResult>) => {
      startTransition(async () => {
        const result = await action()
        if (result.message) notify(result.message, result.ok ? "ok" : "error")
        if (result.ok) router.refresh()
      })
    },
    [notify, router],
  )

  const value = useMemo<LabContextValue>(
    () => ({
      role: session.role,
      currentUserId: session.id,
      session,

      equipment: snapshot.equipment,
      people: snapshot.people,
      bookings: snapshot.bookings,
      loans: snapshot.loans,
      sanctions: snapshot.sanctions,
      tickets: snapshot.tickets,
      audit: snapshot.audit,

      pending,
      toasts,
      notify,

      addEquipment: (input) => run(() => addEquipmentAction(input)),
      addPerson: (input) => run(() => addPersonAction(input)),
      registerLoan: (input) => run(() => registerLoanAction(input)),
      returnLoan: (loanId) => run(() => returnLoanAction(loanId)),
      registerBooking: (b) =>
        run(() =>
          registerBookingAction({
            dia: b.dia,
            moduloId: b.moduloId,
            division: b.division,
            docente: b.docente,
            actividad: b.actividad,
            fecha: b.fecha,
          }),
        ),
      updateStock: (id, disponible) =>
        run(() => updateStockAction(id, disponible)),
      updateEquipmentStatus: (id, estado) =>
        run(() => updateEquipmentStatusAction(id, estado)),
      createTicket: (input) => run(() => createTicketAction(input)),
      updateTicketStatus: (id, estado) =>
        run(() => updateTicketStatusAction(id, estado)),
      createSanction: (input) => run(() => createSanctionAction(input)),
      liftSanction: (id) => run(() => liftSanctionAction(id)),
    }),
    [session, snapshot, pending, toasts, notify, run],
  )

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>
}

export function useLab() {
  const ctx = useContext(LabContext)
  if (!ctx) throw new Error("useLab must be used within LabProvider")
  return ctx
}
