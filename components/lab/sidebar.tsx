"use client"

import { FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLab } from "@/lib/lab-store"
import { ROLE_LABELS } from "@/lib/lab-data"
import { NAV_ITEMS, type ModuleKey } from "./nav"

export function Sidebar({
  active,
  onNavigate,
}: {
  active: ModuleKey
  onNavigate: (k: ModuleKey) => void
}) {
  const { role } = useLab()
  const items = NAV_ITEMS.filter((i) => i.roles.includes(role))

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
   <div className="flex items-center gap-3 px-6 py-5">
  {/* Espacio para el logo del colegio */}
  <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
    {/* Podés dejar un icono temporal de colegio o meter una etiqueta <img src="/logo-colegio.png" /> */}
    <span className="text-lg font-bold">🏫</span> 
  </div>
  
  {/* Nombre del Colegio y especialidad */}
  <div className="min-w-0">
    <h2 className="truncate text-sm font-bold tracking-tight text-foreground uppercase">
      E.E.S.T. N° 1
    </h2>
    <p className="text-xs font-medium text-muted-foreground">
      Informatica
    </p>
  </div>
</div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          Módulos
        </p>
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              <span className="truncate text-left">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="rounded-lg bg-sidebar-accent px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wider text-sidebar-foreground/50">
            Rol activo
          </p>
          <p className="mt-0.5 text-sm font-semibold text-sidebar-accent-foreground">
            {ROLE_LABELS[role]}
          </p>
        </div>
      </div>
    </aside>
  )
}
