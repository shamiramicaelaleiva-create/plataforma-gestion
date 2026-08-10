import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { supabaseEnv } from "./env"

/**
 * Refresca el token de sesión y devuelve la respuesta con las cookies puestas.
 *
 * Regla crítica del patrón oficial de @supabase/ssr: hay que devolver EXACTAMENTE
 * la misma NextResponse a la que se le escribieron las cookies. Si se arma una
 * NextResponse nueva después de refrescar, se pierden las cookies actualizadas y
 * el usuario queda deslogueado de forma intermitente y muy difícil de reproducir.
 *
 * Si se necesita redirigir, hay que copiar las cookies de `supabaseResponse` a la
 * respuesta de redirect (es lo que hace el middleware de la raíz).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseEnv().url,
    supabaseEnv().key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          supabaseResponse = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // No meter código entre createServerClient y getUser(): getUser() es lo que
  // revalida el token contra Supabase. getSession() en middleware no sirve,
  // porque lee la cookie sin verificar la firma.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
