"use server"

import { db } from "@/lib/db/client"
import { nextId } from "@/lib/db/ids"
import * as s from "@/lib/db/schema"
import { createClient } from "@/lib/supabase/server"

export type RegisterState = {
  error: string | null
  done: boolean
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** Mínimo de Supabase son 6; se pide más porque son cuentas de una escuela. */
const MIN_PASSWORD = 8

/**
 * Autorregistro con aprobación posterior.
 *
 * Crea la cuenta en Supabase Auth y una fila en `people` en estado "Pendiente".
 * Pendiente no habilita nada: getSessionUser solo deja pasar "Activo". Recién
 * cuando un admin aprueba la solicitud desde Gestión de Usuarios se le asigna
 * un rol real y la persona puede operar.
 *
 * SOBRE EL ROL PROVISORIO: la columna `role` es NOT NULL, así que hay que poner
 * algo. Se guarda "alumno", que es el rol de menor privilegio. Da igual cuál
 * sea mientras el estado siga en "Pendiente" — no se consulta —, pero si algún
 * día un bug dejara pasar a un pendiente, el que entra es un alumno y no un
 * administrador. Nunca poner acá un rol que el propio usuario elija.
 *
 * SOBRE LA ENUMERACIÓN DE EMAILS: si el email ya está registrado, Supabase
 * devuelve un usuario falso con `identities: []` en vez de un error, justamente
 * para no revelar quién tiene cuenta. Se respeta ese diseño: en ese caso no se
 * inserta nada y se devuelve la misma pantalla de éxito. Un desconocido que
 * pruebe emails no puede distinguir un alta nueva de una repetida.
 */
export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const nombre = String(formData.get("nombre") ?? "").trim()
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")
  const password2 = String(formData.get("password2") ?? "")

  if (!nombre || !email || !password) {
    return { error: "Completá todos los campos.", done: false }
  }
  if (nombre.length < 3) {
    return { error: "Ingresá tu nombre y apellido completos.", done: false }
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "El email no tiene un formato válido.", done: false }
  }
  if (password.length < MIN_PASSWORD) {
    return {
      error: `La contraseña tiene que tener al menos ${MIN_PASSWORD} caracteres.`,
      done: false,
    }
  }
  if (password !== password2) {
    return { error: "Las contraseñas no coinciden.", done: false }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    // Los errores reales de Supabase acá son rate limit y contraseña débil.
    // Ninguno revela si el email existe, pero igual se responde en genérico.
    console.error("[action:register] signUp", error)
    return {
      error: "No se pudo crear la cuenta. Probá de nuevo en unos minutos.",
      done: false,
    }
  }

  const authUserId = data.user?.id
  const yaExistia = (data.user?.identities?.length ?? 0) === 0

  if (authUserId && !yaExistia) {
    try {
      await db.transaction(async (tx) => {
        const id = await nextId(tx, "SOL")
        await tx.insert(s.people).values({
          id,
          authUserId,
          nombre,
          role: "alumno",
          legajo: `${id}`,
          email,
          estado: "Pendiente",
        })
      })
    } catch (e) {
      // La cuenta de Auth quedó creada pero la solicitud no. Sin fila en
      // people la persona no aparece en la bandeja del admin, así que hay que
      // decírselo en vez de mandarla a esperar una aprobación que nadie va a ver.
      console.error("[action:register] insert people", e)
      return {
        error:
          "Tu cuenta se creó pero no pudimos registrar la solicitud. Avisale a preceptoría.",
        done: false,
      }
    }
  }

  return { error: null, done: true }
}
