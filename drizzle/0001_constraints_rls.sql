-- =============================================================================
-- 0001_constraints_rls.sql
--
-- Reglas de negocio, índices y cierre de seguridad.
--
-- Esta migración se escribe a mano: drizzle-kit genera estructura (tablas,
-- tipos, FKs) pero no expresa invariantes de negocio, índices parciales,
-- triggers ni RLS. Todo eso vive acá.
--
-- Idempotente: se puede correr dos veces sin romper nada.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- (a) CHECK constraints — las invariantes viven en la base, no solo en el código
--
-- Un chequeo que solo existe en TypeScript protege únicamente al código que
-- compilamos nosotros. Un INSERT desde la consola de Supabase, un script de
-- migración o un bug en una Server Action lo esquivan sin esfuerzo. Estas
-- constraints son el último borde: si la fila viola la invariante, Postgres la
-- rechaza y la transacción se cae.
-- -----------------------------------------------------------------------------

-- equipment: el stock nunca es negativo y lo disponible nunca supera el total.
ALTER TABLE "equipment" DROP CONSTRAINT IF EXISTS "equipment_stock_valido";
ALTER TABLE "equipment"
  ADD CONSTRAINT "equipment_stock_valido"
  CHECK ("total" >= 0 AND "disponible" >= 0 AND "disponible" <= "total");

-- sanctions: una sanción de días negativos no significa nada.
ALTER TABLE "sanctions" DROP CONSTRAINT IF EXISTS "sanctions_dias_no_negativo";
ALTER TABLE "sanctions"
  ADD CONSTRAINT "sanctions_dias_no_negativo"
  CHECK ("dias" >= 0);

-- loans: no se puede prever la devolución antes de la salida.
ALTER TABLE "loans" DROP CONSTRAINT IF EXISTS "loans_fechas_coherentes";
ALTER TABLE "loans"
  ADD CONSTRAINT "loans_fechas_coherentes"
  CHECK ("fecha_devolucion_prevista" >= "fecha_salida");

-- loans: el estado y la fecha de devolución no pueden contradecirse.
--   'Devuelto' exige fecha_devolucion; 'Activo' exige que no la haya.
-- Esto impide el estado imposible "devuelto pero no sabemos cuándo" y su
-- espejo "activo pero ya tiene fecha de devolución".
ALTER TABLE "loans" DROP CONSTRAINT IF EXISTS "loans_estado_devolucion_coherente";
ALTER TABLE "loans"
  ADD CONSTRAINT "loans_estado_devolucion_coherente"
  CHECK (
    ("estado" = 'Devuelto' AND "fecha_devolucion" IS NOT NULL)
    OR
    ("estado" = 'Activo' AND "fecha_devolucion" IS NULL)
  );

-- loans: si hay devolución, no puede ser anterior a la salida.
ALTER TABLE "loans" DROP CONSTRAINT IF EXISTS "loans_devolucion_posterior_a_salida";
ALTER TABLE "loans"
  ADD CONSTRAINT "loans_devolucion_posterior_a_salida"
  CHECK ("fecha_devolucion" IS NULL OR "fecha_devolucion" >= "fecha_salida");


-- -----------------------------------------------------------------------------
-- (b) Índices para las consultas reales de la app
--
-- Uno por cada filtro/orden que la UI hace de verdad: préstamos activos,
-- préstamos de un artículo, tickets por estado, tickets de un artículo,
-- auditoría más reciente primero, y el listado de personas por rol.
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS "loans_estado_idx"    ON "loans"    ("estado");
CREATE INDEX IF NOT EXISTS "loans_equipo_id_idx" ON "loans"    ("equipo_id");
CREATE INDEX IF NOT EXISTS "tickets_estado_idx"  ON "tickets"  ("estado");
CREATE INDEX IF NOT EXISTS "tickets_equipo_id_idx" ON "tickets" ("equipo_id");
CREATE INDEX IF NOT EXISTS "audit_fecha_idx"     ON "audit"    ("fecha" DESC);
CREATE INDEX IF NOT EXISTS "people_role_idx"     ON "people"   ("role");


-- -----------------------------------------------------------------------------
-- (c) Un solo ticket abierto por artículo
--
-- Hoy este chequeo vive en el cliente ("ya existe un ticket abierto para este
-- equipo"), o sea que es una sugerencia: dos usuarios simultáneos, un reload a
-- destiempo o cualquier llamada directa lo esquivan. Como índice único parcial,
-- Postgres lo hace cumplir siempre: puede haber N tickets 'solucionado' sobre
-- el mismo artículo, pero como máximo uno en 'pendiente' o 'proceso'.
-- -----------------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS "tickets_un_abierto_por_equipo"
  ON "tickets" ("equipo_id")
  WHERE "estado" <> 'solucionado';


-- -----------------------------------------------------------------------------
-- (d) audit es append-only
--
-- Un log que se puede editar no es un log. La tabla acepta INSERT y SELECT;
-- cualquier UPDATE o DELETE aborta con excepción. Se implementa con trigger y
-- no solo con REVOKE porque el rol `postgres` que usan las Server Actions es
-- dueño de la tabla y los GRANTs no lo frenan — el trigger sí.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION "audit_solo_append"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION
    'La tabla audit es de solo agregado: no se permite % sobre el registro de auditoría.',
    TG_OP
    USING ERRCODE = 'restrict_violation',
          HINT = 'Para corregir un asiento equivocado, insertá un nuevo registro que lo compense. Los asientos existentes no se modifican ni se borran.';
END;
$$;

DROP TRIGGER IF EXISTS "audit_no_update" ON "audit";
CREATE TRIGGER "audit_no_update"
  BEFORE UPDATE ON "audit"
  FOR EACH ROW EXECUTE FUNCTION "audit_solo_append"();

DROP TRIGGER IF EXISTS "audit_no_delete" ON "audit";
CREATE TRIGGER "audit_no_delete"
  BEFORE DELETE ON "audit"
  FOR EACH ROW EXECUTE FUNCTION "audit_solo_append"();

-- Cinturón y tiradores: también por permisos, para que ningún rol de aplicación
-- pueda siquiera intentarlo.
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "audit" FROM PUBLIC;


-- -----------------------------------------------------------------------------
-- (e) RLS de cierre total — sin policies, a propósito
--
-- Por qué no escribimos policies:
--
-- Esta app NO lee datos con la publishable/anon key. Absolutamente todo el
-- acceso pasa por Server Actions que corren en el servidor, verifican la sesión
-- y usan una conexión Postgres con el rol `postgres`. El enforcement de
-- permisos ("un alumno no ve las sanciones de otro", "solo el admin borra
-- inventario") vive ahí, en un solo lugar, con el contexto completo de la
-- operación.
--
-- Escribir policies para anon/authenticated significaría exponer estas tablas
-- vía PostgREST y duplicar ese mismo modelo de permisos en un segundo lenguaje,
-- con un segundo conjunto de bugs posibles. Sería más superficie de ataque sin
-- ningún beneficio: nadie consume esa API.
--
-- Entonces: RLS habilitado y CERO policies. En Postgres eso significa denegar
-- todo para cualquier rol que no tenga BYPASSRLS. El rol `postgres` sí lo tiene,
-- así que las Server Actions siguen funcionando; anon y authenticated no ven
-- absolutamente nada, ni siquiera la existencia de las filas.
--
-- Además revocamos los GRANTs: si mañana alguien agrega una policy por error,
-- sin privilegio de tabla igual no puede leer.
-- -----------------------------------------------------------------------------

ALTER TABLE "people"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "equipment"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "loans"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tickets"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sanctions"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "id_counters" ENABLE ROW LEVEL SECURITY;

-- Ninguna policy. RLS activo sin policies = deniega todo por defecto.

REVOKE ALL ON ALL TABLES    IN SCHEMA "public" FROM "anon", "authenticated";
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM "anon", "authenticated";
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "public" FROM "anon", "authenticated";
REVOKE USAGE ON SCHEMA "public" FROM "anon", "authenticated";

-- Las tablas futuras también nacen cerradas. Sin esto, la próxima migración
-- crearía una tabla con los GRANTs por defecto de Supabase y volvería a abrir
-- el agujero en silencio.
ALTER DEFAULT PRIVILEGES IN SCHEMA "public"
  REVOKE ALL ON TABLES FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES IN SCHEMA "public"
  REVOKE ALL ON SEQUENCES FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES IN SCHEMA "public"
  REVOKE ALL ON FUNCTIONS FROM "anon", "authenticated";

-- Supabase define default privileges para el rol `postgres` (dueño de las
-- migraciones); las repetimos explícitamente para ese rol por si la migración
-- se aplica desde otra sesión.
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  REVOKE ALL ON TABLES FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  REVOKE ALL ON SEQUENCES FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
  REVOKE ALL ON FUNCTIONS FROM "anon", "authenticated";


-- -----------------------------------------------------------------------------
-- (f) Semilla de id_counters
--
-- Los IDs legibles (LL-01, HW-07, T-003) se generan incrementando estos
-- contadores DENTRO de la transacción que inserta la fila. Así dos usuarios
-- simultáneos nunca obtienen el mismo ID — a diferencia del
-- `filter(...).length + 1` del store viejo, que repetía IDs apenas se borraba
-- una fila.
--
-- Arrancan en 0. `scripts/seed.ts` los ajusta al máximo realmente usado después
-- de insertar el inventario y las personas.
--
-- Prefijos:
--   LL  llaves            HW  hardware          MC  componentes/microcontroladores
--   PE  periféricos       TL  herramientas      ADM administradores (preceptoría)
--   P   docentes          A   alumnos           B   reservas (bookings)
--   T   tickets           S   sanciones         AUD registros de auditoría
-- -----------------------------------------------------------------------------

INSERT INTO "id_counters" ("prefix", "value") VALUES
  ('LL',  0),
  ('HW',  0),
  ('MC',  0),
  ('PE',  0),
  ('TL',  0),
  ('ADM', 0),
  ('P',   0),
  ('A',   0),
  ('B',   0),
  ('T',   0),
  ('S',   0),
  ('AUD', 0)
ON CONFLICT ("prefix") DO NOTHING;
