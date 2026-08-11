import { Clock, ShieldOff } from "lucide-react"

import { Card } from "@/components/lab/primitives"

/**
 * Pantalla para el usuario que tiene sesión válida pero no acceso.
 *
 * Existe para no dejarlo en un rebote infinito. Si la home lo mandara a /login,
 * el middleware lo devolvería al inicio en el acto — está autenticado — y de
 * ahí otra vez a /login. El botón de cerrar sesión es la salida: sin él queda
 * atrapado en una página que no puede abandonar.
 */
export function CuentaNoHabilitada({
  variante,
  nombre,
}: {
  variante: "pendiente" | "inactivo" | "huerfano"
  nombre?: string
}) {
  const contenido = {
    pendiente: {
      icon: Clock,
      tono: "bg-amber-50 text-amber-600",
      titulo: "Tu solicitud está en revisión",
      texto:
        "Preceptoría todavía no aprobó tu acceso. Cuando lo haga vas a poder entrar con este mismo email y contraseña, sin volver a registrarte.",
    },
    inactivo: {
      icon: ShieldOff,
      tono: "bg-red-50 text-red-600",
      titulo: "Tu cuenta no está habilitada",
      texto:
        "El acceso de esta cuenta fue dado de baja. Si creés que es un error, hablá con preceptoría.",
    },
    huerfano: {
      icon: ShieldOff,
      tono: "bg-red-50 text-red-600",
      titulo: "Tu cuenta no está vinculada",
      texto:
        "Existe la cuenta pero no la ficha en el sistema, así que no podemos saber quién sos. Avisale a preceptoría para que la vincule.",
    },
  }[variante]

  const Icon = contenido.icon

  return (
    <main className="flex min-h-dvh items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <Card className="p-6 text-center">
          <span
            className={`mx-auto flex size-12 items-center justify-center rounded-full ${contenido.tono}`}
          >
            <Icon className="size-6" />
          </span>

          <h1 className="mt-4 text-lg font-semibold text-foreground">
            {contenido.titulo}
          </h1>

          {nombre && (
            <p className="mt-1 text-sm font-medium text-foreground">{nombre}</p>
          )}

          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            {contenido.texto}
          </p>

          {/* POST y no un link: con GET, cualquier <img src="/auth/signout">
              en una página de terceros desloguearía al usuario. */}
          <form action="/auth/signout" method="post" className="mt-5">
            <button
              type="submit"
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
            >
              Cerrar sesión
            </button>
          </form>
        </Card>
      </div>
    </main>
  )
}
