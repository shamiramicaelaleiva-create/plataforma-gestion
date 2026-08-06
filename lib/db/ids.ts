import "server-only"

import { sql } from "drizzle-orm"

import type { Db } from "./client"

/**
 * Genera el siguiente ID legible para un prefijo ("HW", "P", "T"...).
 *
 * Por qué no se calcula en el código: el store viejo hacía
 * `equipment.filter(e => e.id.startsWith(prefix)).length + 1`. Eso rompe de dos
 * formas — si se borra una fila el contador retrocede y repite un ID, y si dos
 * usuarios crean algo al mismo tiempo ambos leen el mismo largo y generan el
 * mismo ID.
 *
 * Acá el contador vive en la base y se incrementa con UPDATE ... RETURNING, que
 * es atómico: Postgres serializa los dos updates y cada uno recibe un número
 * distinto. Tiene que llamarse SIEMPRE dentro de la transacción de la operación,
 * así si la operación falla el contador también revierte.
 */
export async function nextId(
  tx: Db | Parameters<Parameters<Db["transaction"]>[0]>[0],
  prefix: string,
  pad = 2,
): Promise<string> {
  const rows = await tx.execute<{ value: number }>(sql`
    INSERT INTO id_counters (prefix, value)
    VALUES (${prefix}, 1)
    ON CONFLICT (prefix) DO UPDATE SET value = id_counters.value + 1
    RETURNING value
  `)

  const value = Number((rows as unknown as { value: number }[])[0]?.value ?? 1)
  return `${prefix}-${value.toString().padStart(pad, "0")}`
}

/** Fecha de hoy en formato YYYY-MM-DD, que es como la guarda una columna `date`. */
export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Fecha dentro de N días, mismo formato. */
export function inDays(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}
