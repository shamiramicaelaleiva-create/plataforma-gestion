"use client"

import { ArrowRight } from "lucide-react"
import { useLab } from "@/lib/lab-store"
import { ROLE_LABELS } from "@/lib/lab-data"
import { Badge, Card, SectionHeader } from "../primitives"

export function AuditModule() {
  const { audit } = useLab()

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Registro de Seguridad (Audit Log)"
        description="Trazabilidad de todos los cambios del sistema con estado anterior y siguiente."
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="bg-secondary/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Fecha / Hora</th>
                <th className="px-4 py-3">Usuario + Rol</th>
                <th className="px-4 py-3">Acción realizada</th>
                <th className="px-4 py-3">Estado Anterior → Siguiente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {audit.map((a) => (
                <tr key={a.id} className="transition hover:bg-secondary/40">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                    {a.fecha}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{a.usuario}</p>
                    <Badge tone="indigo">{ROLE_LABELS[a.rol]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground">{a.accion}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded bg-secondary px-2 py-1 text-muted-foreground">
                        {a.anterior}
                      </span>
                      <ArrowRight className="size-3.5 text-muted-foreground" />
                      <span className="rounded bg-accent px-2 py-1 font-medium text-accent-foreground">
                        {a.siguiente}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
