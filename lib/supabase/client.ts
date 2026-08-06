import { createBrowserClient } from "@supabase/ssr"
import { supabaseEnv } from "./env"

/**
 * Cliente de Supabase para el browser (Client Components).
 *
 * OJO: lo que devuelve este cliente sirve para la UI, nunca para autorizar.
 * Cualquier chequeo de rol tiene que pasar por el servidor (lib/auth.ts).
 */
export function createClient() {
  return createBrowserClient(
    supabaseEnv().url,
    supabaseEnv().key,
  )
}
