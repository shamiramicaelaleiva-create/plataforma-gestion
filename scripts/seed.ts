/**
 * Semilla de la base.
 *
 * Puebla `equipment` y `people` con los datos que hoy viven hardcodeados en
 * lib/lab-data.ts, y deja `id_counters` apuntando al último ID realmente usado
 * por cada prefijo.
 *
 * Solo datos de catálogo. `loans`, `tickets`, `bookings`, `sanctions` y `audit`
 * arrancan vacíos a propósito: son datos transaccionales, no semilla. Inventarlos
 * ensucia la auditoría y el historial de préstamos desde el día uno.
 *
 * Correr con:
 *   node --env-file=.env.local --import tsx scripts/seed.ts
 *
 * Por qué no importa lib/db/client.ts: ese módulo tiene `import "server-only"`,
 * que revienta fuera del runtime de Next. El seed arma su propia conexión.
 *
 * Por qué DIRECT_URL y no DATABASE_URL: el pooler de Supabase (6543, modo
 * transaction) es para la app. Un script one-shot va derecho al 5432.
 */

import { sql as drizzleSql } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { PEOPLE, initialComponents } from "../lib/lab-data"
import * as schema from "../lib/db/schema"

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (!connectionString) {
  console.error(
    "Falta DIRECT_URL (o DATABASE_URL) en el entorno.\n" +
      "Completá .env.local y corré:\n" +
      "  node --env-file=.env.local --import tsx scripts/seed.ts",
  )
  process.exit(1)
}

// max: 1 y prepare: false — un script secuencial no necesita pool, y sin
// prepared statements el script funciona igual si alguien le pasa la URL del
// pooler por error.
const client = postgres(connectionString, {
  max: 1,
  prepare: false,
  connect_timeout: 15,
})

const db = drizzle(client, { schema })

/**
 * Prefijos que maneja el generador de IDs. Se siembran en 0 en
 * drizzle/0001_constraints_rls.sql y acá se los sube al máximo real.
 */
const PREFIJOS = [
  "LL",
  "HW",
  "MC",
  "PE",
  "TL",
  "ADM",
  "P",
  "A",
  "B",
  "T",
  "S",
  "AUD",
] as const

/**
 * Parte un ID legible en prefijo + número.
 *
 * Los IDs del proyecto no son uniformes: el inventario usa guion ("HW-07"),
 * las personas a veces no ("P01", "A03") y a veces sí ("ADM-01"). El guion es
 * opcional en el regex por eso.
 *
 * Devuelve null si el ID no tiene esa forma, para no ensuciar los contadores
 * con basura.
 */
function parseId(id: string): { prefijo: string; numero: number } | null {
  const match = /^([A-Za-z]+)-?(\d+)$/.exec(id.trim())
  if (!match) return null
  return { prefijo: match[1].toUpperCase(), numero: Number(match[2]) }
}

async function main() {
  console.log("Sembrando la base…\n")

  // --- equipment ------------------------------------------------------------
  // onConflictDoNothing: correr el seed dos veces no debe explotar ni pisar
  // stock real. Si el artículo ya existe, la fila de la app manda.
  const equipoInsertado = await db
    .insert(schema.equipment)
    .values(
      initialComponents.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        categoria: c.categoria,
        total: c.total,
        disponible: c.disponible,
        estado: c.estado,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: schema.equipment.id })

  console.log(
    `  equipment : ${equipoInsertado.length} filas nuevas (de ${initialComponents.length} en el catálogo)`,
  )

  // --- people ---------------------------------------------------------------
  // legajo es NOT NULL y único en la base; en lib/lab-data.ts es opcional en el
  // tipo. Si alguna persona no lo trae, derivamos uno de su id en vez de
  // insertar null y que la transacción se caiga entera.
  const personasInsertadas = await db
    .insert(schema.people)
    .values(
      PEOPLE.map((p) => ({
        id: p.id,
        nombre: p.nombre,
        role: p.role,
        legajo: p.legajo ?? `LEG-${p.id}`,
        email: p.email ?? null,
        curso: p.curso ?? null,
        division: p.division ?? null,
        orientacion: p.orientacion ?? null,
        supervisor: p.supervisor ?? null,
        estado: p.estado ?? ("Activo" as const),
      })),
    )
    .onConflictDoNothing()
    .returning({ id: schema.people.id })

  console.log(
    `  people    : ${personasInsertadas.length} filas nuevas (de ${PEOPLE.length} en el catálogo)`,
  )

  // --- id_counters ----------------------------------------------------------
  // Se calcula sobre lo que hay en la BASE, no sobre los arrays de semilla: si
  // la app ya generó HW-09 después de un seed previo, el contador tiene que
  // quedar en 9 y no volver a 7.
  const idsEnBase = [
    ...(await db.select({ id: schema.equipment.id }).from(schema.equipment)),
    ...(await db.select({ id: schema.people.id }).from(schema.people)),
  ].map((r) => r.id)

  const maximos = new Map<string, number>(PREFIJOS.map((p) => [p, 0]))

  for (const id of idsEnBase) {
    const parsed = parseId(id)
    if (!parsed) continue
    const actual = maximos.get(parsed.prefijo)
    if (actual === undefined) {
      // Prefijo que no está en la lista conocida: lo avisamos en vez de
      // tragárnoslo, porque significa que alguien agregó una familia de IDs
      // sin registrar su contador.
      console.warn(
        `  aviso: el id "${id}" usa el prefijo "${parsed.prefijo}", que no está en id_counters.`,
      )
      continue
    }
    if (parsed.numero > actual) maximos.set(parsed.prefijo, parsed.numero)
  }

  // Los prefijos transaccionales (B, T, S, AUD) no tienen filas todavía y
  // quedan en 0, que es exactamente lo correcto.
  let contadoresActualizados = 0

  for (const [prefijo, valor] of maximos) {
    await db
      .insert(schema.idCounters)
      .values({ prefix: prefijo, value: valor })
      .onConflictDoUpdate({
        target: schema.idCounters.prefix,
        // GREATEST: el seed nunca hace retroceder un contador. Un contador que
        // baja repite IDs ya emitidos, y ese es el bug que esta tabla existe
        // para evitar.
        set: {
          value: drizzleSql`GREATEST(${schema.idCounters.value}, EXCLUDED."value")`,
        },
      })
    contadoresActualizados += 1
  }

  console.log(`  id_counters: ${contadoresActualizados} prefijos sincronizados`)
  console.log(
    "\n  Contadores:",
    [...maximos.entries()]
      .map(([p, v]) => `${p}=${v}`)
      .join("  "),
  )

  console.log("\nListo. loans, tickets, bookings, sanctions y audit quedan vacíos a propósito.")
}

main()
  .then(async () => {
    await client.end()
    process.exit(0)
  })
  .catch(async (error) => {
    console.error("\nEl seed falló:", error)
    await client.end({ timeout: 5 }).catch(() => {})
    process.exit(1)
  })
