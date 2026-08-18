import { LabShell } from "@/components/lab/lab-shell"
import { getAccountState } from "@/lib/auth"
import { getLabSnapshot } from "@/lib/db/queries"
import { LabProvider } from "@/lib/lab-store"

/**
 * Los datos se leen en el servidor y bajan como props.
 *
 * La app no tiene login: el actor lo resuelve `getAccountState` tomando un
 * admin de `people`. Si no hay ninguno la base está sin sembrar, y eso se avisa
 * en vez de renderizar un shell vacío que parecería un bug de la UI.
 */
export default async function Page() {
  const estado = await getAccountState()

  if (estado.kind === "sin-admin") {
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-3 px-6">
        <h1 className="text-lg font-semibold">Base de datos sin datos</h1>
        <p className="text-sm text-muted-foreground">
          No hay ninguna persona con rol <code>admin</code> y estado{" "}
          <code>Activo</code> en la tabla <code>people</code>. Sembrá la base con{" "}
          <code>npm run db:seed</code> y recargá.
        </p>
      </main>
    )
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
