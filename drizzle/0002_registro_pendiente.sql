-- =============================================================================
-- 0002 — Autorregistro con aprobación
-- =============================================================================
--
-- Agrega el estado "Pendiente" a person_status. Una persona pendiente es la que
-- se dio de alta sola desde /registro: ya tiene cuenta en auth.users y fila en
-- people, pero no puede entrar hasta que preceptoría la apruebe.
--
-- Se aplica con psql contra la conexión DIRECTA (puerto 5432), igual que 0001:
--   psql "$DIRECT_URL" -f drizzle/0002_registro_pendiente.sql
--
-- Es idempotente: se puede correr dos veces sin romper nada.
-- =============================================================================

-- ALTER TYPE ... ADD VALUE no admite IF NOT EXISTS en todas las versiones que
-- nos importan, así que se consulta el catálogo antes.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'person_status' AND e.enumlabel = 'Pendiente'
  ) THEN
    ALTER TYPE person_status ADD VALUE 'Pendiente';
  END IF;
END
$$;

-- La bandeja de solicitudes filtra por estado en cada carga de la home.
-- Índice parcial: solo indexa las filas pendientes, que son pocas y volátiles.
CREATE INDEX IF NOT EXISTS people_pendientes_idx
  ON people (created_at)
  WHERE estado = 'Pendiente';
