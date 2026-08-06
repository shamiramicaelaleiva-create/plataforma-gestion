/**
 * Resultado uniforme de toda Server Action.
 *
 * Las actions nunca lanzan hacia la UI: devuelven este objeto. Un throw en una
 * Server Action de producción llega al cliente como "An error occurred in the
 * Server Components render" y el usuario no se entera de nada. Con esto, el
 * store recibe un mensaje en español y lo muestra como toast.
 */
export type ActionResult = { ok: boolean; message: string }

export const ok = (message: string): ActionResult => ({ ok: true, message })
export const fail = (message: string): ActionResult => ({
  ok: false,
  message,
})

/**
 * Envuelve el cuerpo de una action. Los errores esperados se comunican con
 * `fail`; este catch es la red para los inesperados — se loguea el detalle en
 * el servidor y al usuario le llega un mensaje genérico, sin filtrar nada de la
 * base de datos.
 */
export async function guard(
  label: string,
  fn: () => Promise<ActionResult>,
): Promise<ActionResult> {
  try {
    return await fn()
  } catch (error) {
    console.error(`[action:${label}]`, error)
    if (error instanceof Error && error.name === "LabAuthError") {
      return fail(error.message)
    }
    return fail("No se pudo completar la operación. Intentá de nuevo.")
  }
}
