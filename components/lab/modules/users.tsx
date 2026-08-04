"use client"

import { History, Mail } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useLab } from "@/lib/lab-store"
import {
  HISTORY,
  PEOPLE,
  ROLE_LABELS,
  type Person,
  type Role,
} from "@/lib/lab-data"
import { Badge, Card, Modal, SectionHeader } from "../primitives"

const ROLE_TONE: Record<Role, "indigo" | "sky" | "amber" | "neutral"> = {
  admin: "indigo",
  docente: "sky",
  alumno: "neutral",
}

const FILTERS: { key: Role | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "admin", label: "Administrador / Preceptor" },
  { key: "docente", label: "Docente" },
  { key: "alumno", label: "Alumno" },
]

export function UsersModule() {
  const { sanctions } = useLab()
  const [filter, setFilter] = useState<Role | "all">("all")
  const [detail, setDetail] = useState<Person | null>(null)

  const people =
    filter === "all" ? PEOPLE : PEOPLE.filter((p) => p.role === filter)

  const history = detail ? HISTORY.filter((h) => h.personId === detail.id) : []
  const personSanctions = detail
    ? sanctions.filter((s) => s.legajo === detail.legajo)
    : []

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Gestión de Usuarios"
        description="Roles, perfiles y trazabilidad completa del uso del laboratorio."
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

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-secondary/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Nombre Completo</th>
                <th className="px-4 py-3">Legajo / ID</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Curso / División</th>
                <th className="px-4 py-3 text-right">Trazabilidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {people.map((p) => (
                <tr key={p.id} className="transition hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{p.nombre}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="size-3" /> {p.email}
                    </p>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {p.legajo}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={ROLE_TONE[p.role]}>{ROLE_LABELS[p.role]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.division}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDetail(p)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-secondary"
                    >
                      <History className="size-3.5" /> Ver Historial Completo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `Trazabilidad · ${detail.nombre}` : ""}
        description={detail ? `${ROLE_LABELS[detail.role]} · ${detail.division}` : ""}
      >
        {detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-secondary/50 p-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Legajo</p>
                <p className="font-medium text-foreground">{detail.legajo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="truncate font-medium text-foreground">{detail.email}</p>
              </div>
            </div>

            {personSanctions.some((s) => s.activa) && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                Este usuario tiene sanciones activas registradas.
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">
                Historial de uso del laboratorio
              </p>
              {history.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                  Sin movimientos registrados para este usuario.
                </p>
              ) : (
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{h.equipo}</span>
                        <Badge tone={h.accion === "Retiro" ? "sky" : "neutral"}>
                          {h.accion}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Fecha: {h.fecha}</span>
                        <span>
                          Condición:{" "}
                          <span
                            className={
                              h.condicion === "Dañado"
                                ? "font-medium text-red-600"
                                : "text-emerald-600"
                            }
                          >
                            {h.condicion}
                          </span>
                        </span>
                        <span>
                          Retraso:{" "}
                          <span
                            className={
                              h.retraso === "Sin retraso"
                                ? "text-emerald-600"
                                : "font-medium text-amber-600"
                            }
                          >
                            {h.retraso}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
