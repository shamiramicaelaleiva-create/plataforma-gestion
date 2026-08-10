/**
 * Lectura única de la configuración pública de Supabase.
 *
 * Acepta los dos nombres de la clave porque Supabase renombró `anon key` a
 * `publishable key`: los proyectos nuevos muestran `sb_publishable_...` y los
 * viejos siguen con `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Aceptar ambos evita el
 * clásico "en local anda y en Vercel no" por haber cargado la variable con el
 * otro nombre.
 *
 * Las referencias a `process.env.NEXT_PUBLIC_*` están escritas literales a
 * propósito: Next las reemplaza por su valor en tiempo de build solo si las ve
 * escritas así. Un acceso dinámico (`process.env[nombre]`) llega al browser
 * como `undefined`.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function supabaseEnv() {
  if (!url || !key) {
    throw new Error(
      "Faltan las variables de Supabase. Definí NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ver .env.example).",
    )
  }
  return { url, key }
}
