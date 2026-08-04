"use client"

import { Activity, AlertOctagon, TrendingUp } from "lucide-react"
import { DIVISIONES } from "@/lib/lab-data"
import { Card, Progress, SectionHeader } from "../primitives"

const USAGE: { division: string; uso: number }[] = [
  { division: "6to Informática", uso: 86 },
  { division: "5to Electrónica", uso: 64 },
  { division: "6to Electromecánica", uso: 48 },
  { division: "5to Informática", uso: 37 },
]

const DAMAGE: { categoria: string; tasa: number }[] = [
  { categoria: "Electrónica", tasa: 18 },
  { categoria: "Robótica", tasa: 12 },
  { categoria: "Informática", tasa: 7 },
  { categoria: "Redes", tasa: 4 },
]

export function ReportsModule() {
  return (
    <div className="space-y-5">
      <SectionHeader
        title="Reportes Avanzados"
        description="Frecuencia de uso del laboratorio por curso y tasas de daño de equipos."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="size-4" />
            <span className="text-xs">Ocupación semanal</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground">72%</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="size-4" />
            <span className="text-xs">Préstamos del mes</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground">143</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertOctagon className="size-4" />
            <span className="text-xs">Tasa de daño global</span>
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground">9.2%</p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground">
            Frecuencia de uso por Curso / División
          </h3>
          <div className="mt-4 space-y-4">
            {USAGE.map((u) => (
              <div key={u.division}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-foreground">{u.division}</span>
                  <span className="tabular-nums font-medium text-muted-foreground">
                    {u.uso}%
                  </span>
                </div>
                <Progress value={u.uso} barClassName="bg-primary" />
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Divisiones registradas: {DIVISIONES.length}
          </p>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground">
            Tasa de daño por categoría de equipo
          </h3>
          <div className="mt-4 space-y-4">
            {DAMAGE.map((d) => (
              <div key={d.categoria}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-foreground">{d.categoria}</span>
                  <span className="tabular-nums font-medium text-muted-foreground">
                    {d.tasa}%
                  </span>
                </div>
                <Progress
                  value={d.tasa * 3}
                  barClassName={d.tasa >= 15 ? "bg-red-500" : d.tasa >= 8 ? "bg-amber-500" : "bg-emerald-500"}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
