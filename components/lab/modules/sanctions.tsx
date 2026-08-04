"use client"

import { ShieldAlert, ShieldCheck, Unlock } from "lucide-react"
import { useLab } from "@/lib/lab-store"
import { PEOPLE } from "@/lib/lab-data"
import { Card, SanctionBadge, SectionHeader } from "../primitives"

export function SanctionsModule() {
  const { role, sanctions, currentUserId, liftSanction } = useLab()
  const isAdmin = role === "admin"
  const me = PEOPLE.find((p) => p.id === currentUserId)

  // Alumno only sees own sanctions
  const visible =
    role === "alumno"
      ? sanctions.filter((s) => s.legajo === me?.legajo)
      : sanctions

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Sistema de Sanciones y Alertas Institucionales"
        description={
          isAdmin
            ? "Bloqueos institucionales activos. Podés levantar sanciones."
            : "Tus bloqueos y alertas activas registradas por la institución."
        }
      />

      {visible.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <ShieldCheck className="size-8 text-emerald-500" />
          <p className="text-sm font-medium text-foreground">
            Sin sanciones activas
          </p>
          <p className="text-sm text-muted-foreground">
            No hay bloqueos institucionales para mostrar.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((s) => (
            <Card
              key={s.id}
              className={`overflow-hidden border-l-4 p-0 ${
                s.nivel === "roja" ? "border-l-red-500" : "border-l-amber-500"
              } ${!s.activa ? "opacity-60" : ""}`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldAlert
                      className={`size-5 ${
                        s.nivel === "roja" ? "text-red-500" : "text-amber-500"
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-foreground">{s.alumno}</p>
                      <p className="text-xs text-muted-foreground">{s.legajo}</p>
                    </div>
                  </div>
                  <SanctionBadge nivel={s.nivel} />
                </div>

                <p className="mt-3 text-sm text-foreground">{s.motivo}</p>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>Bloqueo: {s.dias} días</span>
                  <span>Desde: {s.fecha}</span>
                  <span
                    className={
                      s.activa ? "font-medium text-red-600" : "text-emerald-600"
                    }
                  >
                    {s.activa ? "Activa" : "Levantada"}
                  </span>
                </div>

                {isAdmin && s.activa && (
                  <button
                    onClick={() => liftSanction(s.id)}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                  >
                    <Unlock className="size-4" /> Levantar Sanción
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
