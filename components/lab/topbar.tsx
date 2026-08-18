"use client"

import { LogOut, Menu, ShieldCheck, TriangleAlert } from "lucide-react"

import { useLab } from "@/lib/lab-store"
import { ROLE_LABELS, type Role } from "@/lib/lab-data"

const ROLES_DEMO: Role[] = ["admin", "docente", "alumno"]

/**
 * Antes acá había un "Simulador de Usuario" que dejaba elegir el rol desde un
 * desplegable. Servía para maquetar, pero al conectar la app a una base real se
 * convertía en escalada de privilegios: cualquier alumno se hacía admin con dos
 * clics. Por eso el rol pasó a venir de la sesión del servidor y solo se muestra.
 *
 * El selector volvió, pero SOLO mientras dure el modo demo (ver lib/demo.ts), y
 * con una diferencia de fondo: no toca ningún estado del cliente. Escribe una
 * cookie httpOnly a través de una Server Action y el rol se vuelve a leer en el
 * servidor, donde `requireRole` sigue mandando. Elegir "alumno" recorta de
 * verdad lo que la app deja hacer, no solo lo que dibuja.
 *
 * Con DEMO_MODE en false esta barra queda exactamente como estaba: sin selector,
 * sin aviso y con el botón de cerrar sesión.
 */
export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { session, role, pending, demoMode, setDemoRole } = useLab()

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

        {/* Ámbar y no un token semántico a propósito: no hay token de
            advertencia en el tema, y este aviso tiene que cantar. Se va junto
            con el modo demo. */}
        {demoMode && (
          <div
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-amber-600 dark:text-amber-400"
            role="status"
          >
            <TriangleAlert className="size-4 shrink-0" />
            <span className="text-xs font-semibold whitespace-nowrap">
              Modo demo
              <span className="hidden md:inline"> · sin login</span>
            </span>
          </div>
        )}

        {pending && (
          <span
            className="mr-2 text-xs font-medium text-muted-foreground"
            role="status"
          >
            Guardando…
          </span>
        )}

        {demoMode ? (
          <label className="ml-auto flex items-center gap-2 rounded-xl border border-primary/30 bg-accent px-3 py-1.5 sm:ml-0">
            <ShieldCheck className="size-4 shrink-0 text-primary" />
            <span className="sr-only">Ver la app como</span>
            <select
              value={role}
              onChange={(e) => setDemoRole(e.target.value as Role)}
              disabled={pending}
              className="cursor-pointer bg-transparent text-sm font-semibold text-accent-foreground outline-none disabled:cursor-wait disabled:opacity-60"
              title="Ver la app como otro rol"
            >
              {ROLES_DEMO.map((r) => (
                <option key={r} value={r} className="bg-card text-foreground">
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="ml-auto flex items-center gap-2 rounded-xl border border-primary/30 bg-accent px-3 py-1.5 sm:ml-0">
            <ShieldCheck className="size-4 text-primary" />
            <span className="max-w-[11rem] truncate text-sm font-semibold text-accent-foreground">
              {ROLE_LABELS[role]}
            </span>
          </div>
        )}

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

          {/* En modo demo no hay sesión que cerrar: el signout iría a Supabase,
              no encontraría nada y rebotaría contra el middleware. Se esconde el
              botón, no se borra la ruta.

              Formulario y no enlace: cerrar sesión modifica estado, y un GET
              permitiría desloguear a alguien con solo hacerle abrir una imagen. */}
          {!demoMode && (
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
          )}
        </div>
      </div>
    </div>
  )
}
