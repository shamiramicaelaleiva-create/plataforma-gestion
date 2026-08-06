import "server-only"

import type { Role } from "@/lib/lab-data"

import type { Db } from "./client"
import { nextId } from "./ids"
import * as s from "./schema"

type Tx = Db | Parameters<Parameters<Db["transaction"]>[0]>[0]

export interface AuditActor {
  nombre: string
  role: Role
}

/**
 * Escribe una entrada de auditoría DENTRO de la transacción que la origina.
 *
 * Este detalle es el punto entero del módulo. Si el log se escribiera aparte,
 * un fallo posterior dejaría registrada una acción que nunca ocurrió, o al
 * revés: un cambio aplicado sin rastro. Al compartir transacción, o se guardan
 * el cambio y su registro, o no se guarda ninguno de los dos.
 */
export async function writeAudit(
  tx: Tx,
  actor: AuditActor,
  entry: { accion: string; anterior: string; siguiente: string },
) {
  const id = await nextId(tx, "AUD", 5)
  await tx.insert(s.audit).values({
    id,
    usuario: actor.nombre,
    rol: actor.role,
    accion: entry.accion,
    anterior: entry.anterior,
    siguiente: entry.siguiente,
  })
}
