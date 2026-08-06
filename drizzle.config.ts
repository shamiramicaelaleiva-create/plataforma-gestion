import { defineConfig } from "drizzle-kit"

/**
 * Las migraciones usan DIRECT_URL (puerto 5432, conexión directa) y no
 * DATABASE_URL (pooler, 6543). El pooler en modo transaction no soporta
 * los comandos DDL con sesión que necesita drizzle-kit.
 */
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  verbose: true,
  strict: true,
})
