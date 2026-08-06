import { revalidatePath } from "next/cache"
import { NextResponse, type NextRequest } from "next/server"

import { createClient } from "@/lib/supabase/server"

/**
 * Cierre de sesión. Solo POST: con GET, cualquier `<img src="/auth/signout">`
 * en otra página desloguearía al usuario sin que lo pida.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  revalidatePath("/", "layout")
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  })
}
