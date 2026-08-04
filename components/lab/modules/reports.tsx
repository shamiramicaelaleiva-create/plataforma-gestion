"use client"

import { Activity, AlertOctagon, TrendingUp } from "lucide-react"
import { useMemo } from "react"
import { useLab } from "@/lib/lab-store"
import { CATEGORIAS, DIAS, MODULOS } from "@/lib/lab-data"
import { Card, Progress, SectionHeader } from "../primitives"

/** Estados que sacan un equipo de circulación (cuentan como incidencia técnica). */
const ESTADOS_FUERA_DE_USO = ["Fuera de Servicio", "En Reparación", "En Mantenimiento"]

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
      {children}
    </p>
  )
}

export function ReportsModule() {
  const { bookings, loans, equipment } = useLab()

  // Ocupación = bloques reservados sobre el total de bloques de la grilla semanal.
  const bloquesTotales = DIAS.length * MODULOS.length
  const ocupacion = bloquesTotales
    ? Math.round((bookings.length / bloquesTotales) * 100)
    : 0

  const prestamosActivos = loans.filter((l) => l.estado === "Activo").length

  // Incidencias = unidades en estado no operativo sobre el total del inventario.
  const unidadesTotales = equipment.reduce((a, e) => a + e.total, 0)
  const unidadesFueraDeUso = equipment
    .filter((e) => ESTADOS_FUERA_DE_USO.includes(e.estado))
    .reduce((a, e) => a + e.total, 0)
  const tasaIncidencias = unidadesTotales
    ? Math.round((unidadesFueraDeUso / unidadesTotales) * 1000) / 10
    : 0

  // Uso por división: bloques reservados por cada división en la grilla semanal.
  const usoPorDivision = useMemo(() => {
    const conteo = new Map<string, number>()
    bookings.forEach((b) => {
      conteo.set(b.division, (conteo.get(b.division) ?? 0) + 1)
    })
    const max = Math.max(1, ...conteo.values())
    return [...conteo.entries()]
      .map(([division, bloques]) => ({
        division,
        bloques,
        pct: Math.round((bloques / max) * 100),
      }))
      .sort((a, b) => b.bloques - a.bloques)
  }, [bookings])

  // Incidencias técnicas por categoría de equipo.
  const incidenciasPorCategoria = useMemo(() => {
    return CATEGORIAS.map((categoria) => {
      const items = equipment.filter((e) => e.categoria === categoria)
      const total = items.reduce((a, e) => a + e.total, 0)
      const afectadas = items
        .filter((e) => ESTADOS_FUERA_DE_USO.includes(e.estado))
        .reduce((a, e) => a + e.total, 0)
      return {
        categoria,
        total,
        afectadas,
        tasa: total ? Math.round((afectadas / total) * 100) : 0,
      }
    }).filter((c) => c.total > 0)
  }, [equipment])

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Reportes Avanzados"
        description="Métricas calculadas en vivo sobre las reservas, los préstamos y el estado del inventario."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="size-4" />
            <span className="text-xs">Ocupación semanal</span>
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {ocupacion}%
          </p>
          <p className="text-xs text-muted-foreground">
            {bookings.length} de {bloquesTotales} bloques reservados
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="size-4" />
            <span className="text-xs">Préstamos activos</span>
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {prestamosActivos}
          </p>
          <p className="text-xs text-muted-foreground">
            {loans.length} registrados en total
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertOctagon className="size-4" />
            <span className="text-xs">Unidades fuera de servicio</span>
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {tasaIncidencias}%
          </p>
          <p className="text-xs text-muted-foreground">
            {unidadesFueraDeUso} de {unidadesTotales} unidades
          </p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground">
            Frecuencia de uso por Curso / División
          </h3>
          <div className="mt-4 space-y-4">
            {usoPorDivision.length === 0 ? (
              <EmptyRow>
                Todavía no hay reservas cargadas en el calendario semanal.
              </EmptyRow>
            ) : (
              usoPorDivision.map((u) => (
                <div key={u.division}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-foreground">{u.division}</span>
                    <span className="tabular-nums font-medium text-muted-foreground">
                      {u.bloques} {u.bloques === 1 ? "bloque" : "bloques"}
                    </span>
                  </div>
                  <Progress value={u.pct} barClassName="bg-primary" />
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground">
            Incidencias técnicas por categoría de equipo
          </h3>
          <div className="mt-4 space-y-4">
            {incidenciasPorCategoria.length === 0 ? (
              <EmptyRow>No hay artículos cargados en el inventario.</EmptyRow>
            ) : (
              incidenciasPorCategoria.map((d) => (
                <div key={d.categoria}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-foreground">{d.categoria}</span>
                    <span className="tabular-nums font-medium text-muted-foreground">
                      {d.afectadas}/{d.total} u. · {d.tasa}%
                    </span>
                  </div>
                  <Progress
                    value={d.tasa}
                    barClassName={
                      d.tasa >= 15
                        ? "bg-red-500"
                        : d.tasa >= 8
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }
                  />
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
