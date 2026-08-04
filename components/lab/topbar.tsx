"use client"

import { ChevronDown, Menu, ShieldCheck, UserCog } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useLab } from "@/lib/lab-store"
import { PEOPLE, ROLE_LABELS, type Role } from "@/lib/lab-data"

const ROLE_ORDER: Role[] = ["admin", "docente", "alumno"]


const ROLE_DESC: Record<Role, string> = {
  admin: "Acceso total de lectura y escritura a todo el sistema.",
  docente: "Ver componentes, hacer reportes y solicitar préstamos.",
  alumno: "Ver perfil propio, historial y realizar solicitudes de préstamo.",
}

const ROLE_DEFAULT_USER: Record<Role, string> = {
  admin: "ADM-01",
  docente: "P01",
  alumno: "A01",
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { role, setRole, currentUserId, setCurrentUserId } = useLab()
  const [open, setOpen] = useState(false)
  
  const person = PEOPLE.find((p) => p.id === currentUserId) || {
    nombre: role === "admin" ? "Administrador General" : role === "docente" ? "Profesor Laboratorio" : "Alumno Técnico"
  }

  function pickRole(r: Role) {
    setRole(r)
    setCurrentUserId(ROLE_DEFAULT_USER[r])
    setOpen(false)
  }

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 lg:px-6">
        <button
          onClick={onMenu}
          className="rounded-lg border border-border p-2 text-muted-foreground lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </button>

        <div className="mr-auto hidden sm:block">
          <p className="text-sm font-semibold text-foreground">
            Sistema Institucional de Gestión de Laboratorio
          </p>
          <p className="text-xs text-muted-foreground">
            Escuela Técnica · Panel de control
          </p>
        </div>

        {/* Role simulator */}
        <div className="relative ml-auto sm:ml-0">
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-accent px-2 py-1.5">
            <span className="hidden items-center gap-1.5 pl-1 text-xs font-medium text-accent-foreground md:flex">
              <UserCog className="size-4" />
              Simulador de Usuario
            </span>
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg bg-card px-3 py-1.5 text-sm font-semibold text-foreground shadow-sm ring-1 ring-border transition hover:ring-ring"
              aria-haspopup="listbox"
              aria-expanded={open}
            >
              <ShieldCheck className="size-4 text-primary" />
              <span className="max-w-[9rem] truncate">{ROLE_LABELS[role]}</span>
              <ChevronDown
                className={cn("size-4 text-muted-foreground transition", open && "rotate-180")}
              />
            </button>
          </div>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div
                role="listbox"
                className="absolute right-0 z-20 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-xl"
              >
                <div className="border-b border-border px-4 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Cambiar rol de sesión
                  </p>
                </div>
                {ROLE_ORDER.map((r) => (
                  <button
                    key={r}
                    onClick={() => pickRole(r)}
                    className={cn(
                      "flex w-full flex-col gap-0.5 px-4 py-3 text-left transition hover:bg-accent",
                      role === r && "bg-accent/60",
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      {ROLE_LABELS[r]}
                      {role === r && (
                        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                          Activo
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">{ROLE_DESC[r]}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="hidden items-center gap-3 border-l border-border pl-4 md:flex">
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{person?.nombre}</p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {person?.nombre
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
        </div>
      </div>
    </div>
  )
}
