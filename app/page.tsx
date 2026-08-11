import { redirect } from "next/navigation"

import { CuentaNoHabilitada } from "@/components/lab/cuenta-no-habilitada"
import { LabShell } from "@/components/lab/lab-shell"
import { getAccountState } from "@/lib/auth"
import { getLabSnapshot } from "@/lib/db/queries"
import { LabProvider } from "@/lib/lab-store"

/**
 * Los datos se leen en el servidor y bajan como props. El middleware ya bloquea
 * a los no autenticados, pero la comprobación se repite acá: el middleware
 * protege rutas, no datos, y esta página lee la base. Que una sola capa decida
 * quién ve el inventario es un punto único de falla.
 *
 * Los tres estados que no habilitan no se pueden resolver mandando a /login:
 * el usuario ya tiene sesión, así que el middleware lo devolvería acá y quedaría
 * rebotando. Cada uno tiene su pantalla, con salida.
 */
export default async function Page() {
  const estado = await getAccountState()

  if (estado.kind === "sin-sesion") redirect("/login")
  if (estado.kind === "pendiente") {
    return <CuentaNoHabilitada variante="pendiente" nombre={estado.nombre} />
  }
  if (estado.kind === "inactivo") {
    return <CuentaNoHabilitada variante="inactivo" />
  }
  if (estado.kind === "huerfano") {
    return <CuentaNoHabilitada variante="huerfano" />
  }

  const { user } = estado
  const snapshot = await getLabSnapshot(user.role)

  return (
    <LabProvider
      session={{
        id: user.id,
        nombre: user.nombre,
        role: user.role,
        legajo: user.legajo,
      }}
      snapshot={snapshot}
    >
      <LabShell />
    </LabProvider>
  )
}
