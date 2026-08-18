"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

import { fail, guard, ok, type ActionResult } from "@/lib/action-result"
import { DEMO_MODE, DEMO_ROLE_COOKIE } from "@/lib/demo"
import type { Role } from "@/lib/lab-data"

const ROLES_VALIDOS: readonly Role[] = ["admin", "docente", "alumno"]

/**
 * Cambia el rol con el que se está mostrando la demo.
 *
 * La única forma de tocar la cookie `demo_role` es esta action, y lo primero
 * que hace es chequear el flag: con `DEMO_MODE` apagado no escribe nada y
 * devuelve un fail. Si el auth vuelve a funcionar y alguien deja el selector
 * colgado en la UI, no queda una puerta abierta para cambiarse de rol —
 * escribir la cookie no serviría de nada porque getSessionUser tampoco la mira,
 * pero mejor que ni se escriba.
 *
 * No lleva writeAudit: no muta estado del dominio, solo cambia con qué lentes
 * se mira la app en la máquina de quien presenta. Auditar cada click del
 * selector llenaría el log justo el día que se muestra el log.
 */
export async function setDemoRoleAction(role: Role): Promise<ActionResult> {
  return guard("setDemoRole", async () => {
    if (!DEMO_MODE) {
      return fail("El modo demo no está activo.")
    }

    // El rol llega del cliente, así que se valida contra la lista blanca en vez
    // de confiar en el tipo: TypeScript no existe del otro lado del request.
    if (!ROLES_VALIDOS.includes(role)) {
      return fail("El rol indicado no es válido.")
    }

    const cookieStore = await cookies()
    cookieStore.set(DEMO_ROLE_COOKIE, role, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })

    // El dashboard se arma del snapshot que lee la página raíz; sin esto, la
    // UI seguiría mostrando lo que ve el rol anterior.
    revalidatePath("/")

    return ok(`Modo demo: ahora estás viendo la app como ${role}.`)
  })
}
