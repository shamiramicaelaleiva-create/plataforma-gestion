"use client"

import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  PackageCheck,
  Search,
  Users,
  Zap,
  Lock,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useLab } from "@/lib/lab-store"
import { canLoan, DIAS, MODULOS, type Equipment } from "@/lib/lab-data"
import { Badge, Card, Field, Input, Select, StatusBadge } from "../primitives"

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Boxes
  label: string
  value: string
  tone: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-lg ${tone}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  )
}

export function DashboardModule() {
  const { role, equipment, people, loans, sanctions, registerLoan, notify } = useLab()
  const isAdmin = role === "admin"

  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Equipment | null>(null)
  const [alumno, setAlumno] = useState("")
  const [docente, setDocente] = useState("")
  const [dia, setDia] = useState("")
  const [modulo, setModulo] = useState("")

  const alumnos = people.filter((p) => p.role === "alumno")
  const docentes = people.filter((p) => p.role === "docente")

  const suggestions = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return equipment
      .filter((e) => e.id.toLowerCase().includes(q) || e.nombre.toLowerCase().includes(q))
      .slice(0, 5)
  }, [query, equipment])

  const activos = equipment.reduce((a, e) => a + e.total, 0)
  const disponibles = equipment.reduce((a, e) => a + e.disponible, 0)
  const alertasActivas = sanctions.filter((s) => s.activa).length

  function pick(e: Equipment) {
    setSelected(e)
    setQuery(`${e.id} — ${e.nombre}`)
  }

  function submit() {
    if (!selected) return notify("Seleccioná un equipo válido")
    if (!docente) return notify("Debés seleccionar el docente responsable")
    if (!dia) return notify("Debés especificar el día del préstamo")
    if (!modulo) return notify("Debés seleccionar el módulo horario")
    if (!canLoan(selected.estado, selected.disponible))
      return notify("El equipo no cuenta con stock disponible en este momento")

    registerLoan({ 
      equipoId: selected.id, 
      alumno: alumno || "No aplica (Solo Docente)", 
      docente
    })

    notify(isAdmin ? "Préstamo registrado correctamente" : "Solicitud de préstamo enviada. Esperando aprobación del Administrador.")

    setSelected(null)
    setQuery("")
    setAlumno("")
    setDocente("")
    setDia("")
    setModulo("")
  }

  const loanReady = selected && canLoan(selected.estado, selected.disponible)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Boxes} label="Activos totales" value={String(activos)} tone="bg-indigo-50 text-indigo-600" />
        <Stat icon={PackageCheck} label="Disponibles" value={String(disponibles)} tone="bg-emerald-50 text-emerald-600" />
        <Stat icon={AlertTriangle} label="Sanciones activas" value={String(alertasActivas)} tone="bg-red-50 text-red-600" />
        <Stat icon={Users} label="Préstamos activos" value={String(loans.filter((l) => l.estado.toLowerCase() === "activo").length)} tone="bg-sky-50 text-sky-600" />
      </div>

      <Card className="overflow-visible">
        <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/10 to-transparent px-5 py-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {isAdmin ? "Registrar Salida Directa de Equipos" : "Formulario de Solicitud de Préstamo"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAdmin 
                ? "Panel administrativo para asentar préstamos al instante y descontar del stock." 
                : "Completá los datos requeridos. Tu solicitud quedará sujeta a la aprobación del Administrador."}
            </p>
          </div>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2">
          <div className="space-y-4">
            <div className="relative">
              <Field label="Componente o Accesorio (ID o nombre)" hint="Ej: LL-01, Notebook, Proyector...">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setSelected(null)
                    }}
                    placeholder="Escribí el nombre del componente…"
                    className="pl-9"
                  />
                </div>
              </Field>
              {suggestions.length > 0 && !selected && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                  {suggestions.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => pick(e)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-accent"
                    >
                      <span className="font-medium text-foreground">
                        <span className="text-muted-foreground">{e.id}</span> · {e.nombre}
                      </span>
                      <Badge tone={e.disponible > 0 ? "green" : "red"}>
                        {e.disponible}/{e.total}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Día">
                <Select value={dia} onChange={(e) => setDia(e.target.value)}>
                  <option value="">Seleccionar día…</option>
                  {DIAS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Módulo Horario">
                <Select value={modulo} onChange={(e) => setModulo(e.target.value)}>
                  <option value="">Seleccionar bloque…</option>
                  {MODULOS.map((m) => (
                    <option key={m.id} value={`${m.label} (${m.rango})`}>
                      {m.label} ({m.rango})
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Docente Responsable *" hint="Obligatorio para cualquier préstamo">
              <Select value={docente} onChange={(e) => setDocente(e.target.value)}>
                <option value="">Seleccionar docente…</option>
                {docentes.map((d) => (
                  <option key={d.id} value={d.nombre}>
                    {d.nombre} · {d.division || "Taller"}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Alumno Solicitante (Opcional)" hint="Dejar en blanco si retira el docente solo">
              <Select value={alumno} onChange={(e) => setAlumno(e.target.value)}>
                <option value="">Ninguno / Retira el docente</option>
                {alumnos.map((a) => (
                  <option key={a.id} value={a.nombre}>
                    {a.nombre} · {a.division}
                  </option>
                ))}
              </Select>
            </Field>

            <button
              onClick={submit}
              disabled={!loanReady || !docente || !dia || !modulo}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PackageCheck className="size-4" />
              {isAdmin ? "Registrar salida inmediata" : "Enviar Solicitud de Préstamo"}
            </button>
          </div>

          <div className="rounded-xl border border-dashed border-border bg-secondary/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estado de disponibilidad en tiempo real
            </p>
            {selected ? (
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Componente</span>
                  <span className="font-medium text-foreground text-right max-w-[70%]">{selected.nombre}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Categoría</span>
                  <span className="font-medium text-foreground">{selected.categoria}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stock Físico</span>
                  <Badge tone={selected.disponible > 0 ? "green" : "red"}>
                    {selected.disponible} de {selected.total} unidades disponibles
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Estado Técnico</span>
                  <StatusBadge status={selected.estado} />
                </div>
                <div
                  className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                    loanReady ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {loanReady ? (
                    <>
                      <CheckCircle2 className="size-4" /> Stock listo para asignación.
                    </>
                  ) : (
                    <>
                      <Lock className="size-4" /> Sin unidades disponibles o en reparación.
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center gap-2 text-center text-muted-foreground">
                <Search className="size-6" />
                <p className="text-sm">
                  Buscá un accesorio, herramienta o llave para comprobar stock de inmediato.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-foreground">Registro Reciente de Salidas / Préstamos Activos</h3>
        {loans.filter((l) => l.estado.toLowerCase() === "activo").length === 0 && (
          <p className="mt-3 rounded-lg border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
            No hay préstamos activos. Las salidas que registres aparecen acá.
          </p>
        )}
        <div className="mt-3 divide-y divide-border">
          {loans
            .filter((l) => l.estado.toLowerCase() === "activo")
            .map((l) => (
              <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-foreground">
                    {l.equipo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Responsable: {l.docente} {l.alumno && l.alumno !== "No aplica (Solo Docente)" ? `— Alumno: ${l.alumno}` : ""}
                  </p>
                </div>
                <Badge tone="sky">Asignado</Badge>
              </div>
            ))}
        </div>
      </Card>
    </div>
  )
}