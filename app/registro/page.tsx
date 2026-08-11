"use client"

import { CheckCircle2, FlaskConical, LoaderCircle } from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"

import { registerAction, type RegisterState } from "@/app/actions/register"
import { Card, Field, Input, PasswordInput } from "@/components/lab/primitives"

const estadoInicial: RegisterState = { error: null, done: false }

export default function RegistroPage() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    estadoInicial,
  )

  return (
    <main className="flex min-h-dvh items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-sm">
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

        {state.done ? <Enviado /> : <Formulario />}
      </div>
    </main>
  )

  function Formulario() {
    return (
      <>
        <Card className="p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-foreground">
              Solicitar acceso
            </h2>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              Creás la cuenta acá y preceptoría la habilita. Hasta que la
              aprueben no vas a poder ingresar.
            </p>
          </div>

          <form action={formAction} className="flex flex-col gap-4">
            <Field label="Nombre y apellido">
              <Input
                name="nombre"
                autoComplete="name"
                placeholder="Camila Sosa"
                required
                minLength={3}
                disabled={pending}
              />
            </Field>

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

            <Field label="Contraseña" hint="Mínimo 8 caracteres.">
              <PasswordInput
                name="password"
                autoComplete="new-password"
                placeholder="••••••••"
                required
                minLength={8}
                disabled={pending}
              />
            </Field>

            <Field label="Repetir contraseña">
              <PasswordInput
                name="password2"
                autoComplete="new-password"
                placeholder="••••••••"
                required
                minLength={8}
                disabled={pending}
              />
            </Field>

            {state.error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/20"
              >
                {state.error}
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
                  Enviando…
                </>
              ) : (
                "Solicitar acceso"
              )}
            </button>
          </form>

          <div className="mt-5 border-t border-border pt-4 text-center text-sm">
            <span className="text-muted-foreground">¿Ya tenés cuenta? </span>
            <Link
              href="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Ingresar
            </Link>
          </div>
        </Card>
      </>
    )
  }
}

/**
 * Se muestra siempre igual, haya sido un alta nueva o un email ya registrado.
 * La action no distingue los dos casos a propósito, para que nadie pueda
 * averiguar quién tiene cuenta probando emails.
 */
function Enviado() {
  return (
    <Card className="p-6 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="size-6" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-foreground">
        Solicitud enviada
      </h2>
      <p className="mt-2 text-sm text-muted-foreground text-pretty">
        Preceptoría tiene que aprobarla antes de que puedas ingresar. Cuando lo
        haga, entrás con el email y la contraseña que acabás de elegir.
      </p>
      <Link
        href="/login"
        className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
      >
        Volver al inicio
      </Link>
    </Card>
  )
}
