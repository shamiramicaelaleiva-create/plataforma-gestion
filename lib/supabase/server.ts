import "server-only"
import { supabaseEnv } from "./env"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 *
 * En Next 16 `cookies()` es async, por eso hay que await antes de armar el
 * adaptador. Se crea uno nuevo por request: el store de cookies está atado al
 * request en curso y cachear el cliente entre requests filtraría la sesión de
 * un usuario a otro.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    supabaseEnv().url,
    supabaseEnv().key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Desde un Server Component no se pueden escribir cookies. Es
            // esperable: el middleware ya refrescó la sesión antes de llegar
            // acá, así que ignorar el error es seguro.
          }
        },
      },
    },
  )
}
