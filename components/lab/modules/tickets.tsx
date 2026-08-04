"use client"

import { Wrench, WrenchIcon } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useLab } from "@/lib/lab-store"
import type { TicketStatus } from "@/lib/lab-data"
import {
  Card,
  Field,
  Input,
  Modal,
  SectionHeader,
  Select,
  TicketBadge,
} from "../primitives"

const STEPS: { key: TicketStatus; label: string }[] = [
  { key: "pendiente", label: "Pendiente" },
  { key: "proceso", label: "En Proceso" },
  { key: "solucionado", label: "Solucionado" },
]

const FILTERS: { key: TicketStatus | "todos"; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "pendiente", label: "Pendientes" },
  { key: "proceso", label: "En proceso" },
  { key: "solucionado", label: "Solucionados" },
]

export function TicketsModule() {
  const { role, tickets, equipment, people, createTicket, updateTicketStatus } =
    useLab()
  const isAdmin = role === "admin"

  const [filter, setFilter] = useState<TicketStatus | "todos">("todos")
  const [createOpen, setCreateOpen] = useState(false)
  const [equipoId, setEquipoId] = useState("")
  const [problema, setProblema] = useState("")
  const [tecnico, setTecnico] = useState("")

  const docentes = people.filter((p) => p.role === "docente")

  const visible =
    filter === "todos" ? tickets : tickets.filter((t) => t.estado === filter)

  // Un artículo con ticket abierto no puede recibir otro hasta que se resuelva.
  const conTicketAbierto = new Set(
    tickets.filter((t) => t.estado !== "solucionado").map((t) => t.equipoId),
  )
  const disponiblesParaReporte = equipment.filter(
    (e) => !conTicketAbierto.has(e.id),
  )

  function handleCreate() {
    if (!equipoId) return
    if (!problema.trim()) return
    createTicket({ equipoId, problema: problema.trim(), tecnico })
    setCreateOpen(false)
    setEquipoId("")
    setProblema("")
    setTecnico("")
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Tickets de Mantenimiento Técnico"
        description={
          isAdmin
            ? "Flujo de reparaciones. Al pasar un ticket a En Proceso el equipo queda En Reparación; al solucionarlo vuelve a Operativo."
            : "Reportá desperfectos de los equipos del laboratorio. El preceptor gestiona la reparación."
        }
        action={
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            <Wrench className="size-4" /> Reportar desperfecto
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-inset transition",
              filter === f.key
                ? "bg-primary text-primary-foreground ring-primary"
                : "bg-card text-muted-foreground ring-border hover:bg-secondary",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <WrenchIcon className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            No hay tickets para mostrar
          </p>
          <p className="text-sm text-muted-foreground">
            Usá “Reportar desperfecto” para abrir el primero.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {visible.map((t) => {
            const eq = equipment.find((e) => e.id === t.equipoId)
            return (
              <Card
                key={t.id}
                className={cn("p-5", t.estado === "solucionado" && "opacity-75")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                      <TicketBadge estado={t.estado} />
                    </div>
                    <p className="mt-1 font-semibold text-foreground">
                      {t.equipo}{" "}
                      <span className="font-mono text-xs font-normal text-muted-foreground">
                        {t.equipoId}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">{t.problema}</p>
                    {eq && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Estado actual del equipo:{" "}
                        <span className="font-medium text-foreground">{eq.estado}</span>{" "}
                        · Stock {eq.disponible}/{eq.total} u.
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>Reporta: <span className="text-foreground">{t.reporta}</span></p>
                    <p>Técnico: <span className="text-foreground">{t.tecnico}</span></p>
                    <p>Fecha: {t.fecha}</p>
                  </div>
                </div>

                {isAdmin ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Actualizar estado:
                    </span>
                    {STEPS.map((s) => (
                      <button
                        key={s.key}
                        onClick={() => updateTicketStatus(t.id, s.key)}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition",
                          t.estado === s.key
                            ? "bg-primary text-primary-foreground ring-primary"
                            : "bg-card text-muted-foreground ring-border hover:bg-secondary",
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Solo el preceptor o administrador puede cambiar el estado del ticket.
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Reportar Desperfecto"
        description="Se abre un ticket de mantenimiento asociado al artículo del inventario."
      >
        <div className="space-y-4">
          <Field
            label="Artículo afectado *"
            hint="No se listan los artículos que ya tienen un ticket abierto."
          >
            <Select value={equipoId} onChange={(e) => setEquipoId(e.target.value)}>
              <option value="">Seleccionar artículo…</option>
              {disponiblesParaReporte.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.id} · {e.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Descripción del problema *">
            <Input
              value={problema}
              onChange={(e) => setProblema(e.target.value)}
              placeholder="Ej: No enciende / puerto HDMI dañado"
            />
          </Field>

          <Field label="Técnico asignado" hint="Podés dejarlo sin asignar y completarlo después.">
            <Select value={tecnico} onChange={(e) => setTecnico(e.target.value)}>
              <option value="">Sin asignar</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.nombre}>{d.nombre}</option>
              ))}
            </Select>
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={!equipoId || !problema.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Abrir ticket
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
