"use client"

import { LogOut, Menu, ShieldCheck } from "lucide-react"

import { useLab } from "@/lib/lab-store"
import { ROLE_LABELS } from "@/lib/lab-data"

/**
 * Antes acá había un "Simulador de Usuario" que dejaba elegir el rol desde un
 * desplegable. Servía para maquetar, pero al conectar la app a una base real se
 * convertía en escalada de privilegios: cualquier alumno se hacía admin con dos
 * clics. Ahora el rol viene de la sesión del servidor y solo se muestra.
 */
export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { session, role, pending } = useLab()

  const iniciales = session.nombre
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")

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

        {pending && (
          <span
            className="mr-2 text-xs font-medium text-muted-foreground"
            role="status"
          >
            Guardando…
          </span>
        )}

        <div className="ml-auto flex items-center gap-2 rounded-xl border border-primary/30 bg-accent px-3 py-1.5 sm:ml-0">
          <ShieldCheck className="size-4 text-primary" />
          <span className="max-w-[11rem] truncate text-sm font-semibold text-accent-foreground">
            {ROLE_LABELS[role]}
          </span>
        </div>

        <div className="flex items-center gap-3 border-l border-border pl-4">
          <div className="hidden text-right md:block">
            <p className="text-sm font-medium text-foreground">
              {session.nombre}
            </p>
            <p className="font-mono text-xs text-muted-foreground">
              {session.legajo}
            </p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {iniciales}
          </div>

          {/* Formulario y no enlace: cerrar sesión modifica estado, y un GET
              permitiría desloguear a alguien con solo hacerle abrir una imagen. */}
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
