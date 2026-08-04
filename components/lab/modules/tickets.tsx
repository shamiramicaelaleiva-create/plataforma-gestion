"use client"

import { cn } from "@/lib/utils"
import { useLab } from "@/lib/lab-store"
import type { TicketStatus } from "@/lib/lab-data"
import { Card, SectionHeader, TicketBadge } from "../primitives"

const STEPS: { key: TicketStatus; label: string }[] = [
  { key: "pendiente", label: "Pendiente" },
  { key: "proceso", label: "En Proceso" },
  { key: "solucionado", label: "Solucionado" },
]

export function TicketsModule() {
  const { tickets, updateTicketStatus } = useLab()

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Tickets de Mantenimiento Técnico"
        description="Flujo de trabajo de reparaciones. Cambiá el estado con un clic."
      />

      <div className="space-y-4">
        {tickets.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                  <TicketBadge estado={t.estado} />
                </div>
                <p className="mt-1 font-semibold text-foreground">{t.equipo}</p>
                <p className="text-sm text-muted-foreground">{t.problema}</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Reporta: <span className="text-foreground">{t.reporta}</span></p>
                <p>Técnico: <span className="text-foreground">{t.tecnico}</span></p>
                <p>Fecha: {t.fecha}</p>
              </div>
            </div>

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
          </Card>
        ))}
      </div>
    </div>
  )
}
