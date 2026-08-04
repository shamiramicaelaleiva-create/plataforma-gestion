"use client"

import { Calendar, Clock, Plus, ShieldAlert } from "lucide-react"
import { useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { useLab } from "@/lib/lab-store"
import { DIAS, DIVISIONES, MODULOS } from "@/lib/lab-data"
import { Card, Field, Input, Modal, SectionHeader, Select } from "../primitives"

const DIVISION_COLOR: Record<string, string> = {
  "1°A": "bg-blue-50 text-blue-700 border-blue-200",
  "1°B": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "2°A": "bg-amber-50 text-amber-700 border-amber-200",
  "2°B": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "3°A": "bg-orange-50 text-orange-700 border-orange-200",
  "3°B": "bg-teal-50 text-teal-700 border-teal-200",
}

export function CalendarModule() {
  const { role, people, bookings, registerBooking, notify } = useLab()
  const isAdmin = role === "admin"

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDia, setSelectedDia] = useState("")
  const [selectedModulo, setSelectedModulo] = useState("")
  
  const [docente, setDocente] = useState("")
  const [division, setDivision] = useState("")
  const [actividad, setActividad] = useState("")

  const docentes = people.filter((p) => p.role === "docente")

  const scheduleMap = useMemo(() => {
    const map: Record<string, typeof bookings[0]> = {}
    bookings.forEach((b) => {
      map[`${b.dia}-${b.moduloId}`] = b
    })
    return map
  }, [bookings])

  function handleCellClick(dia: string, moduloId: string) {
    if (!isAdmin) {
      return notify("Solo los Preceptores o Administradores pueden asignar turnos fijos en el calendario.")
    }
    const ocupado = scheduleMap[`${dia}-${moduloId}`]
    if (ocupado) {
      return notify(`El bloque ya está reservado por: ${ocupado.docente}`)
    }
    setSelectedDia(dia)
    setSelectedModulo(moduloId)
    setModalOpen(true)
  }

  function handleSave() {
    if (!docente || !division || !actividad) {
      return notify("Por favor, completá todos los campos requeridos.")
    }
    registerBooking({
      dia: selectedDia,
      moduloId: selectedModulo,
      docente,
      division,
      actividad,
    })
    notify("Clase/Módulo agendado correctamente en el calendario.")
    setModalOpen(false)
    setDocente("")
    setDivision("")
    setActividad("")
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Distribución Semanal y Uso del Laboratorio"
        description="Grilla horaria por módulos de 40 minutos. Los preceptores pueden fijar las reservas permanentes o temporales de las divisiones."
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-sm">
            <thead>
             <tr>
  <th className="p-3 text-center font-semibold border-l border-border/60">
    Módulo
  </th>

  {DIAS.map((d) => (
    <th
      key={d}
      className="p-3 text-center font-semibold border-l border-border/60"
    >
      {d}
    </th>
  ))}
</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MODULOS.map((m) => (
                <tr key={m.id} className="transition hover:bg-secondary/20">
                  <td className="p-3 font-medium text-foreground bg-secondary/10">
                    <div className="flex items-center gap-2">
                      <Clock className="size-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-semibold">{m.label}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">{m.rango}</p>
                      </div>
                    </div>
                  </td>
                  {DIAS.map((d) => {
                    const slotKey = `${d}-${m.id}`
                    const slot = scheduleMap[slotKey]
                    const colorClass = slot ? DIVISION_COLOR[slot.division] || "bg-primary/10 text-primary" : ""

                    return (
                      <td
                        key={slotKey}
                        onClick={() => handleCellClick(d, m.id)}
                        className={cn(
                          "p-2 border-l border-border/60 text-center transition relative min-h-[64px] h-16 vertical-middle group",
                          slot ? "cursor-not-allowed" : isAdmin ? "cursor-pointer hover:bg-primary/5" : "cursor-default"
                        )}
                      >
                        {slot ? (
                          <div className={cn("rounded-lg p-2 text-xs border text-left h-full flex flex-col justify-between shadow-xs", colorClass)}>
                            <p className="font-bold truncate line-clamp-1">{slot.division}</p>
                            <p className="text-[10px] opacity-90 truncate">{slot.docente}</p>
                          </div>
                        ) : isAdmin ? (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                              <Plus className="size-4" />
                            </span>
                          </div>
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {!isAdmin && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50/60 p-4 border border-amber-100 text-xs text-amber-800">
          <ShieldAlert className="size-4 shrink-0 text-amber-600" />
          <p>Como <strong>Docente</strong> o <strong>Alumno</strong>, la grilla es de solo lectura. Para reservar un módulo fijo del calendario, solicitáselo al preceptor de turno.</p>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Asignar Turno de Laboratorio">
        <div className="space-y-4 pt-2">
          <div className="rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground space-y-1">
            <p><strong>Día asignado:</strong> {selectedDia}</p>
            <p><strong>Bloque:</strong> {MODULOS.find(m => m.id === selectedModulo)?.label} ({MODULOS.find(m => m.id === selectedModulo)?.rango})</p>
          </div>

          <Field label="Docente a cargo *">
            <Select value={docente} onChange={(e) => setDocente(e.target.value)}>
              <option value="">Seleccionar docente…</option>
              {docentes.map((d) => (
                <option key={d.id} value={d.nombre}>{d.nombre}</option>
              ))}
            </Select>
          </Field>

          <Field label="Curso / División *">
            <Select value={division} onChange={(e) => setDivision(e.target.value)}>
              <option value="">Seleccionar división…</option>
              {DIVISIONES.map((div) => (
                <option key={div} value={div}>{div}</option>
              ))}
            </Select>
          </Field>

          <Field label="Proyecto o Práctica de Laboratorio">
            <Input
              value={actividad}
              onChange={(e) => setActividad(e.target.value)}
              placeholder="Ej: Armado de fuentes ATX / Prácticas ESP32"
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Confirmar Reserva
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}