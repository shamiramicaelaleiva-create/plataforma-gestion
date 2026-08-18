import "server-only"

import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

/**
 * Conexión a Postgres (Supabase).
 *
 * Por qué un singleton en globalThis: en dev, Next recarga los módulos en cada
 * cambio. Sin esto, cada recarga abriría un pool nuevo y en pocos minutos se
 * agota el límite de conexiones de Supabase.
 *
 * En producción sobre Vercel, cada invocación serverless es un proceso corto,
 * por eso `max: 1` y `prepare: false`: el pooler de Supabase en modo transaction
 * NO soporta prepared statements, y dejarlo en true da errores intermitentes
 * del tipo "prepared statement s1 already exists".
 */
const connectionString = process.env.DATABASE_URL

// Con USE_MOCK_DATA=1 nunca se abre el socket, así que exigir la cadena de
// conexión solo impediría levantar la app sin base — justo el caso que el modo
// mock existe para cubrir.
if (!connectionString && process.env.USE_MOCK_DATA !== "1") {
  throw new Error(
    "Falta DATABASE_URL. Copiá .env.example a .env.local y completala con la cadena del pooler de Supabase.",
  )
}

const globalForDb = globalThis as unknown as {
  __labSql?: ReturnType<typeof postgres>
}

const sql =
  globalForDb.__labSql ??
  postgres(connectionString ?? "postgres://localhost:5432/inexistente", {
    max: process.env.NODE_ENV === "production" ? 1 : 5,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.__labSql = sql
}

export const db = drizzle(sql, { schema })
export { sql, schema }
export type Db = typeof db
