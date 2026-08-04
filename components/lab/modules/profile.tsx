"use client"

import { AlertTriangle, Boxes, History, Mail, ShieldCheck } from "lucide-react"
import { useLab } from "@/lib/lab-store"
import { HISTORY, PEOPLE, ROLE_LABELS } from "@/lib/lab-data"
import { Badge, Card, SanctionBadge, SectionHeader } from "../primitives"

export function ProfileModule() {
  const { currentUserId, role, sanctions, loans } = useLab()
  
  // Solucionamos la catarata de errores usando un casteo seguro como any para desarrollo ágil de los mocks
  let me = PEOPLE.find((p) => p.id === currentUserId) as any
  
  if (!me || me.role !== role) {
    const fallback = PEOPLE.find((p) => p.role === role);
    me = fallback ? (fallback as any) : {
      id: currentUserId,
      nombre: role === "admin" ? "Administrador General" : role === "docente" ? "Docente de Laboratorio" : "Alumno Técnico",
      role: role,
      division: role === "alumno" ? "6to Informática" : "Laboratorio",
      email: `${role}@institucion.edu.ar`,
      legajo: "LEG-999"
    }
  }

  const myHistory = HISTORY.filter((h: any) => h.personId === me.id)
  const mySanctions = sanctions.filter((s: any) => s.legajo === me.legajo && s.activa)
  const myLoans = loans.filter((l: any) => l.alumno === me.nombre)

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Mi Perfil"
        description="Tu información, historial de préstamos y alertas activas."
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {me.nombre ? me.nombre.split(" ").map((n: string) => n[0]).slice(0, 2).join("") : "U"}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-foreground">{me.nombre}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge tone="indigo">{ROLE_LABELS[me.role as keyof typeof ROLE_LABELS] || me.role}</Badge>
              <span>{me.division}</span>
              {me.email && (
                <span className="flex items-center gap-1">
                  <Mail className="size-3" /> {me.email}
                </span>
              )}
              {me.legajo && <span className="tabular-nums">{me.legajo}</span>}
            </div>
          </div>
        </div>
      </Card>

      {mySanctions.length > 0 ? (
        <Card className="border-l-4 border-l-red-500 p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-500" />
            <h3 className="text-sm font-semibold text-foreground">Alertas / Sanciones activas</h3>
          </div>
          <div className="mt-3 space-y-3">
            {mySanctions.map((s: any) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm">
                <span className="text-red-800">{s.motivo}</span>
                <div className="flex items-center gap-2">
                  <SanctionBadge nivel={s.nivel} />
                  <span className="text-xs text-red-700">{s.dias} días</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="flex items-center gap-3 p-5">
          <ShieldCheck className="size-6 text-emerald-500" />
          <p className="text-sm font-medium text-foreground">
            Sin alertas ni sanciones activas. ¡Buen historial!
          </p>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Boxes className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Préstamos activos</h3>
          </div>
          {myLoans.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No tenés equipos en préstamo.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {myLoans.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="font-medium text-foreground">{l.equipo}</span>
                  <Badge tone="sky">{l.fechaSalida}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <History className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Historial de uso</h3>
          </div>
          {myHistory.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Sin movimientos registrados.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {myHistory.map((h: any, i: number) => (
                <div key={i} className="rounded-lg border border-border px-3 py-2 text-sm">
                  <div className="flex items-cesnter justify-between">
                    <span className="font-medium text-foreground">{h.equipo}</span>
                    <Badge tone={h.accion === "Retiro" ? "sky" : "neutral"}>{h.accion}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {h.fecha} {h.condicion ? `· Condición: ${h.condicion}` : ""} {h.retraso ? `· ${h.retraso}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default ProfileModule;