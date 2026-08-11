import { NextResponse, type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

/** Rutas accesibles sin sesión. */
function esRutaPublica(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/registro" ||
    pathname.startsWith("/auth")
  )
}

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Sin sesión y pidiendo algo protegido -> a /login.
  if (!user && !esRutaPublica(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    return copiarCookies(supabaseResponse, NextResponse.redirect(url))
  }

  // Con sesión y pidiendo /login o /registro -> al inicio. Quien ya tiene
  // cuenta no vuelve a pedirla; si está pendiente de aprobación, el inicio le
  // muestra esa pantalla.
  if (user && (pathname === "/login" || pathname === "/registro")) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    url.search = ""
    return copiarCookies(supabaseResponse, NextResponse.redirect(url))
  }

  return supabaseResponse
}

/**
 * El middleware de Supabase escribió las cookies de sesión refrescadas en
 * `origen`. Si devolvemos un redirect nuevo sin copiarlas, el token refrescado
 * se pierde y el usuario entra en un loop de login.
 */
function copiarCookies(origen: NextResponse, destino: NextResponse) {
  for (const cookie of origen.cookies.getAll()) {
    destino.cookies.set(cookie)
  }
  return destino
}

export const config = {
  matcher: [
    /*
     * Todas las rutas menos:
     * - _next/static, _next/image (assets del build)
     * - favicon e íconos
     * - archivos de imagen
     */
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
}
