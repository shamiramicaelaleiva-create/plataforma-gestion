"use client"

import { PackageCheck, Undo2 } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useLab } from "@/lib/lab-store"
import { estaVencido, type Loan } from "@/lib/lab-data"
import { Badge, Card, SectionHeader } from "../primitives"

const FILTERS: { key: "activos" | "devueltos" | "todos"; label: string }[] = [
  { key: "activos", label: "Activos" },
  { key: "devueltos", label: "Devueltos" },
  { key: "todos", label: "Todos" },
]

export function LoansModule() {
  const { role, loans, equipment, returnLoan } = useLab()
  const isAdmin = role === "admin"
  const [filter, setFilter] = useState<"activos" | "devueltos" | "todos">("activos")

  const visible = loans.filter((l) =>
    filter === "todos"
      ? true
      : filter === "activos"
        ? l.estado === "Activo"
        : l.estado === "Devuelto",
  )

  function stockLabel(l: Loan) {
    const eq = equipment.find((e) => e.id === l.equipoId)
    return eq ? `${eq.disponible}/${eq.total} u.` : "—"
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Préstamos y Devoluciones"
        description="Cada entrega descuenta una unidad del stock disponible. El stock se repone al registrar la devolución."
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
          <PackageCheck className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            No hay préstamos para mostrar
          </p>
          <p className="text-sm text-muted-foreground">
            Registrá una salida desde el panel principal para verla acá.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="bg-secondary/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Componente</th>
                  <th className="px-4 py-3">Alumno</th>
                  <th className="px-4 py-3">Docente responsable</th>
                  <th className="px-4 py-3">Retiro</th>
                  <th className="px-4 py-3">Devolución</th>
                  <th className="px-4 py-3">Stock actual</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((l) => {
                  const vencido = estaVencido(l)
                  return (
                    <tr
                      key={l.id}
                      className={cn(
                        "transition hover:bg-secondary/40",
                        l.estado === "Devuelto" && "opacity-70",
                      )}
                    >
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            l.estado === "Devuelto"
                              ? "neutral"
                              : vencido
                                ? "red"
                                : "green"
                          }
                        >
                          {l.estado === "Devuelto"
                            ? "Devuelto"
                            : vencido
                              ? "Vencido"
                              : "Activo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{l.equipo}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {l.id} · {l.equipoId}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{l.alumno}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.docente}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {l.fechaSalida}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {l.estado === "Devuelto" ? (
                          l.fechaDevolucion ?? "—"
                        ) : (
                          <span className={vencido ? "font-medium text-red-600" : ""}>
                            Prevista: {l.fechaDevolucionPrevista}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {stockLabel(l)}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          {l.estado === "Activo" ? (
                            <button
                              onClick={() => returnLoan(l.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
                            >
                              <Undo2 className="size-3.5" /> Registrar devolución
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Stock repuesto
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

export default LoansModule;
