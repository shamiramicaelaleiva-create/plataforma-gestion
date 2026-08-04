"use client"

export function LoansModule() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold">
          Préstamos
        </h1>

        <p className="text-muted-foreground">
          Registro de préstamos y devoluciones de componentes.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="py-3 text-left">Estado</th>

              <th className="py-3 text-left">Componente</th>

              <th className="py-3 text-left">Usuario</th>

              <th className="py-3 text-left">Supervisor</th>

              <th className="py-3 text-left">Retiro</th>

              <th className="py-3 text-left">Devolución</th>

            </tr>

          </thead>

          <tbody>

            <tr>

              <td className="py-4">🟢 Activo</td>

              <td>Notebook HP</td>

              <td>Camila Sosa</td>

              <td>Prof. García</td>

              <td>14/07/2026</td>

              <td>16/07/2026</td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>
  )
}

export default LoansModule;