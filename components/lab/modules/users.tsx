"use client"

import { History, Mail, UserPlus } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useLab } from "@/lib/lab-store"
import {
  DIVISIONES,
  HISTORY,
  ORIENTACIONES,
  ROLE_LABELS,
  schoolCourses,
  type Person,
  type Role,
} from "@/lib/lab-data"
import { Badge, Card, Field, Input, Modal, SectionHeader, Select } from "../primitives"

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
  const { role, sanctions, people: allPeople, addPerson, notify } = useLab()
  const isAdmin = role === "admin"

  const [filter, setFilter] = useState<Role | "all">("all")
  const [detail, setDetail] = useState<Person | null>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [nombre, setNombre] = useState("")
  const [newRole, setNewRole] = useState<Role>("alumno")
  const [email, setEmail] = useState("")
  const [curso, setCurso] = useState("")
  const [division, setDivision] = useState("")
  const [orientacion, setOrientacion] = useState("")
  const [supervisor, setSupervisor] = useState("")

  const docentes = allPeople.filter((p) => p.role === "docente")

  const people =
    filter === "all" ? allPeople : allPeople.filter((p) => p.role === filter)

  const history = detail ? HISTORY.filter((h) => h.personId === detail.id) : []
  const personSanctions = detail
    ? sanctions.filter((s) => s.legajo === detail.legajo)
    : []

  function resetForm() {
    setNombre("")
    setNewRole("alumno")
    setEmail("")
    setCurso("")
    setDivision("")
    setOrientacion("")
    setSupervisor("")
  }

  function handleCreate() {
    if (!nombre.trim()) {
      return notify("Ingresá el nombre completo del usuario.")
    }
    if (newRole === "alumno" && (!curso || !division)) {
      return notify("Para un alumno el curso y la división son obligatorios.")
    }
    if (newRole === "docente" && !orientacion) {
      return notify("Para un docente la orientación es obligatoria.")
    }
    addPerson({
      nombre: nombre.trim(),
      role: newRole,
      email: email.trim() || undefined,
      curso: newRole === "alumno" ? curso : undefined,
      division: newRole === "alumno" ? division : orientacion || undefined,
      orientacion: newRole === "docente" ? orientacion : undefined,
      supervisor: newRole === "alumno" ? supervisor || undefined : undefined,
    })
    setCreateOpen(false)
    resetForm()
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Gestión de Usuarios"
        description="Roles, perfiles y trazabilidad completa del uso del laboratorio."
        action={
          isAdmin ? (
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <UserPlus className="size-4" /> Nuevo usuario
            </button>
          ) : null
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

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Alta de Usuario"
        description="El legajo y el ID se generan automáticamente según el rol."
      >
        <div className="space-y-4">
          <Field label="Nombre completo *">
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Camila Sosa"
            />
          </Field>

          <Field label="Rol *">
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
            >
              <option value="alumno">Alumno</option>
              <option value="docente">Docente</option>
              <option value="admin">Administrador / Preceptor</option>
            </Select>
          </Field>

          <Field
            label="Email institucional"
            hint="Si lo dejás vacío se genera a partir del ID."
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre.apellido@escuela.edu.ar"
            />
          </Field>

          {newRole === "alumno" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Curso *">
                  <Select value={curso} onChange={(e) => setCurso(e.target.value)}>
                    <option value="">Seleccionar curso…</option>
                    {schoolCourses.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="División *">
                  <Select
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                  >
                    <option value="">Seleccionar división…</option>
                    {DIVISIONES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Docente supervisor">
                <Select
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {docentes.map((d) => (
                    <option key={d.id} value={d.nombre}>{d.nombre}</option>
                  ))}
                </Select>
              </Field>
            </>
          )}

          {newRole === "docente" && (
            <Field label="Orientación *">
              <Select
                value={orientacion}
                onChange={(e) => setOrientacion(e.target.value)}
              >
                <option value="">Seleccionar orientación…</option>
                {ORIENTACIONES.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
                <option value="Ciclo básico">Ciclo básico</option>
              </Select>
            </Field>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Crear usuario
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
