import { redirect } from "next/navigation"

import { LabShell } from "@/components/lab/lab-shell"
import { getSessionUser } from "@/lib/auth"
import { getLabSnapshot } from "@/lib/db/queries"
import { LabProvider } from "@/lib/lab-store"

/**
 * Los datos se leen en el servidor y bajan como props. El middleware ya bloquea
 * a los no autenticados, pero la comprobación se repite acá: el middleware
 * protege rutas, no datos, y esta página lee la base. Que una sola capa decida
 * quién ve el inventario es un punto único de falla.
 */
export default async function Page() {
  const user = await getSessionUser()
  if (!user) redirect("/login")

  const snapshot = await getLabSnapshot()

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
