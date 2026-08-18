"use client"

import { Eye, EyeOff, X } from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { EquipmentStatus, SanctionLevel, TicketStatus } from "@/lib/lab-data"
import { STATUS_LABELS } from "@/lib/lab-data"

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  )
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground text-balance">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}

const STATUS_STYLES: Record<EquipmentStatus, string> = {
  "Operativo": "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  "En Mantenimiento": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "Fuera de Servicio": "bg-red-50 text-red-700 ring-red-600/20",
  "En Reparación": "bg-orange-50 text-orange-700 ring-orange-600/20",
  "En Uso Activo": "bg-sky-50 text-sky-700 ring-sky-600/20",
}

export function StatusBadge({ status }: { status: EquipmentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLES[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status]}
    </span>
  )
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode
  tone?: "neutral" | "indigo" | "green" | "amber" | "red" | "sky"
  className?: string
}) {
  const tones = {
    neutral: "bg-secondary text-secondary-foreground ring-border",
    indigo: "bg-accent text-accent-foreground ring-primary/20",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
    red: "bg-red-50 text-red-700 ring-red-600/20",
    sky: "bg-sky-50 text-sky-700 ring-sky-600/20",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const TICKET_TONE: Record<TicketStatus, "amber" | "sky" | "green"> = {
  pendiente: "amber",
  proceso: "sky",
  solucionado: "green",
}
const TICKET_LABEL: Record<TicketStatus, string> = {
  pendiente: "Pendiente",
  proceso: "En Proceso",
  solucionado: "Solucionado",
}
export function TicketBadge({ estado }: { estado: TicketStatus }) {
  return <Badge tone={TICKET_TONE[estado]}>{TICKET_LABEL[estado]}</Badge>
}

export function SanctionBadge({ nivel }: { nivel: SanctionLevel }) {
  return (
    <Badge tone={nivel === "roja" ? "red" : "amber"}>
      {nivel === "roja" ? "Alerta Roja" : "Alerta Amarilla"}
    </Badge>
  )
}

export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number
  className?: string
  barClassName?: string
}) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div
        className={cn("h-full rounded-full bg-primary transition-all", barClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

const inputBase =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50"

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />
}

/**
 * Campo de contraseña con botón de ver/ocultar.
 *
 * El botón alterna el `type` del input entre "password" y "text". No hay nada
 * más: el valor siempre estuvo en el DOM, mostrarlo no lo expone a nadie que no
 * lo tuviera ya. Lo que evita es el caso real de todos los días — escribir mal
 * la contraseña a ciegas y no poder distinguir eso de una cuenta que no anda.
 *
 * `tabIndex={-1}` saca al botón del recorrido del tabulador: quien navega con
 * teclado va del campo al submit, no a un control decorativo en el medio.
 */
export function PasswordInput(
  props: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">,
) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(inputBase, "pr-10", props.className)}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition hover:text-foreground disabled:opacity-50"
        disabled={props.disabled}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(inputBase, "appearance-none", props.className)}>
      {props.children}
    </select>
  )
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border bg-secondary/40 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
