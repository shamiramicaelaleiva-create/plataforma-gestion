/**
 * Error de autenticación/autorización.
 *
 * Tiene clase propia para que el envoltorio de las Server Actions sepa que su
 * mensaje es seguro de mostrarle al usuario ("No tenés permisos…"), mientras
 * que cualquier otro error se reemplaza por un texto genérico. Sin esta
 * distinción, o filtramos errores internos de Postgres a la pantalla, o le
 * decimos "error inesperado" a alguien que en realidad no tiene permisos.
 */
export class LabAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LabAuthError"
  }
}
