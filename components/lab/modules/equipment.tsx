"use client"

import { useLab } from "@/lib/lab-store"
import { Card, Progress, SectionHeader, StatusBadge, Badge } from "../primitives"
import { useState } from "react"

export function EquipmentModule() {
  const { equipment, setEquipment, notify } = useLab() as any

  const handleStockChange = (id: string, value: number, total: number) => {
    if (value < 0 || value > total) return
    const updated = equipment.map((e: any) => e.id === id ? { ...e, disponible: value } : e)
    setEquipment(updated)
    notify({ id: Date.now().toString(), msg: `Stock actualizado con éxito` })
  }

  const handleEstadoChange = (id: string, nuevoEstado: string) => {
    const updated = equipment.map((e: any) => e.id === id ? { ...e, estado: nuevoEstado } : e)
    setEquipment(updated)
    notify({ id: Date.now().toString(), msg: `Estado técnico actualizado` })
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Estado Avanzado de Equipos y Control de Stock"
        description="Recuento en tiempo real del stock disponible y estado técnico operativo de cada bien institucional."
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="bg-secondary/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Componente / Recurso</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3 w-56">Control de Stock (Disp. / Total)</th>
                <th className="px-4 py-3">Estado Técnico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {equipment.map((e: any) => {
                const pct = (e.disponible / e.total) * 100
                return (
                  <tr key={e.id} className="transition hover:bg-secondary/40">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {e.id}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{e.nombre}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                        {e.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={e.disponible}
                          onChange={(opt) => handleStockChange(e.id, parseInt(opt.target.value) || 0, e.total)}
                          className="w-16 rounded-md border border-input bg-background px-2 py-1 text-center font-semibold text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <span className="text-muted-foreground">/ {e.total} u.</span>
                      </div>
                      <Progress
                        value={pct}
                        className="mt-1.5"
                        barClassName={
                          pct === 0
                            ? "bg-red-500"
                            : pct < 40
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }
                      />
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={e.estado}
                        onChange={(opt) => handleEstadoChange(e.id, opt.target.value)}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="Operativo">🟢 Operativo</option>
                        <option value="Mantenimiento">🟡 Mantenimiento</option>
                        <option value="Reparacion">🔴 En Reparación</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-emerald-500" />
          <span>Operativo (Apto para Préstamo)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-amber-500" />
          <span>En Mantenimiento</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-500" />
          <span>Fuera de Servicio / En Reparación</span>
        </div>
      </div>
    </div>
  )
}