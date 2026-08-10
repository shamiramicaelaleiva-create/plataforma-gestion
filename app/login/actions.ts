"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type LoginState = {
  error: string | null
}

/**
 * Server Action de login. Pensada para useActionState.
 *
 * Nunca devuelve el error crudo de Supabase: "Invalid login credentials",
 * "Email not confirmed" o un rate limit le dicen a un atacante si el email
 * existe. Un solo mensaje genérico para todos los fallos de credenciales.
 */
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Completá el email y la contraseña." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: "Email o contraseña incorrectos." }
  }

  revalidatePath("/", "layout")
  redirect("/")
}
