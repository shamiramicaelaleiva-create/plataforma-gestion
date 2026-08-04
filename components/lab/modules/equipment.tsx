"use client"

import { PackagePlus } from "lucide-react"
import { useState } from "react"
import { useLab } from "@/lib/lab-store"
import {
  CATEGORIAS,
  ESTADOS_EQUIPO,
  type Equipment,
} from "@/lib/lab-data"
import {
  Card,
  Field,
  Input,
  Modal,
  Progress,
  SectionHeader,
  Select,
} from "../primitives"

export function EquipmentModule() {
  const {
    role,
    equipment,
    addEquipment,
    updateStock,
    updateEquipmentStatus,
    notify,
  } = useLab()
  const isAdmin = role === "admin"

  const [createOpen, setCreateOpen] = useState(false)
  const [nombre, setNombre] = useState("")
  const [categoria, setCategoria] = useState<Equipment["categoria"]>("Hardware")
  const [total, setTotal] = useState("1")
  const [estado, setEstado] = useState<Equipment["estado"]>("Operativo")


  function handleCreate() {
    const cantidad = parseInt(total, 10)
    if (!nombre.trim()) {
      return notify("Ingresá el nombre del artículo.")
    }
    if (!Number.isFinite(cantidad) || cantidad < 1) {
      return notify("La cantidad total debe ser un número mayor a cero.")
    }
    addEquipment({ nombre: nombre.trim(), categoria, total: cantidad, estado })
    setCreateOpen(false)
    setNombre("")
    setCategoria("Hardware")
    setTotal("1")
    setEstado("Operativo")
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Estado Avanzado de Equipos y Control de Stock"
        description="Recuento en tiempo real del stock disponible y estado técnico operativo de cada bien institucional."
        action={
          isAdmin ? (
            <button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              <PackagePlus className="size-4" /> Nuevo artículo
            </button>
          ) : null
        }
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
              {equipment.map((e) => {
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
                          disabled={!isAdmin}
                          onChange={(opt) => updateStock(e.id, parseInt(opt.target.value) || 0)}
                          className="w-16 rounded-md border border-input bg-background px-2 py-1 text-center font-semibold text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
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
                        disabled={!isAdmin}
                        onChange={(opt) =>
                          updateEquipmentStatus(
                            e.id,
                            opt.target.value as Equipment["estado"],
                          )
                        }
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {ESTADOS_EQUIPO.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
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

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Alta de Artículo de Inventario"
        description="El ID se genera automáticamente según la categoría elegida."
      >
        <div className="space-y-4">
          <Field label="Nombre del artículo *">
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Osciloscopio digital 100 MHz"
            />
          </Field>

          <Field label="Categoría *">
            <Select
              value={categoria}
              onChange={(e) =>
                setCategoria(e.target.value as Equipment["categoria"])
              }
            >
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cantidad total *" hint="El stock disponible arranca igual al total.">
              <Input
                type="number"
                min={1}
                value={total}
                onChange={(e) => setTotal(e.target.value)}
              />
            </Field>

            <Field label="Estado técnico *">
              <Select
                value={estado}
                onChange={(e) =>
                  setEstado(e.target.value as Equipment["estado"])
                }
              >
                {ESTADOS_EQUIPO.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>

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
              Agregar al inventario
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
