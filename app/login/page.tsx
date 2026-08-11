"use client"

import { FlaskConical, LoaderCircle, LockKeyhole } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useActionState } from "react"

import { Card, Field, Input, PasswordInput } from "@/components/lab/primitives"
import { login, type LoginState } from "./actions"

const estadoInicial: LoginState = { error: null }

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, estadoInicial)
  const searchParams = useSearchParams()

  // El único error que llega por URL es el del callback de magic link.
  const errorEnlace =
    searchParams.get("error") === "enlace_invalido"
      ? "El enlace de acceso no es válido o ya venció. Ingresá con tu email y contraseña."
      : null

  const error = state.error ?? errorEnlace

  return (
    <>
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <FlaskConical className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            IPESMIgest
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Gestión de Laboratorio Técnico
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-foreground">
            Iniciar sesión
          </h2>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            Usá tu cuenta institucional. Si no tenés, podés solicitar acceso.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <Field label="Email">
            <Input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="nombre@escuela.edu.ar"
              required
              disabled={pending}
            />
          </Field>

          <Field label="Contraseña">
            <PasswordInput
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
              disabled={pending}
            />
          </Field>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Ingresando…
              </>
            ) : (
              "Ingresar"
            )}
          </button>
        </form>

        <div className="mt-5 border-t border-border pt-4 text-center text-sm">
          <span className="text-muted-foreground">¿No tenés cuenta? </span>
          <Link
            href="/registro"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Solicitar acceso
          </Link>
        </div>
      </Card>

      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <LockKeyhole className="size-3.5" />
        ¿Problemas para entrar? Consultá con preceptoría.
      </p>
    </>
  )
}
