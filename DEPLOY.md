# Guía de despliegue — Plataforma de Gestión

Cómo poner esta app en producción sobre **Vercel + Supabase (Postgres)**.
Está escrita para alguien que nunca desplegó este proyecto. Seguí los pasos en orden.

Stack relevante:

- Next.js 16 (App Router, Server Actions)
- Drizzle ORM sobre `postgres.js` (`lib/db/client.ts`)
- Supabase: Postgres + Auth
- Migraciones SQL en `drizzle/`, seed en `scripts/seed.ts`

Proyecto Supabase: `bmcgwmmcfyvoazxfficz` → `https://bmcgwmmcfyvoazxfficz.supabase.co`

---

## 0. Rotar la contraseña de la base — OBLIGATORIO, antes que nada

Si la contraseña de Postgres estuvo alguna vez en un chat, un ticket, una captura o un
archivo versionado, **dala por comprometida y rotala antes de seguir.**

Cualquiera que tenga esa contraseña tiene acceso total a la base: el usuario `postgres`
es superusuario del proyecto y **se saltea el RLS**. No importa que las policies estén
bien cerradas: con la contraseña se lee y se borra todo.

No despliegues, no cargues datos reales y no configures nada en Vercel antes de rotarla.

1. Entrá a [supabase.com/dashboard](https://supabase.com/dashboard) y abrí el proyecto.
2. **Settings → Database → Database password → Reset database password**.
3. Generá una contraseña nueva y guardala en un gestor de contraseñas.
   No la mandes por chat, mail ni la pegues en un issue.
4. Anotala: la vas a necesitar en el paso 1 para armar las dos cadenas de conexión.

> Después de rotar, cualquier `.env.local` viejo que tengas en tu máquina deja de
> funcionar. Es lo esperado: actualizalo con la contraseña nueva.

---

## 1. Obtener las cadenas de conexión

En el dashboard de Supabase, arriba de todo, hay un botón **`Connect`**.
Hacé click. Se abre un panel con varias pestañas. Las que importan:

| Pestaña | Puerto | Usuario | Host | Para qué sirve |
|---|---|---|---|---|
| **Transaction pooler** | 6543 | `postgres.bmcgwmmcfyvoazxfficz` | `aws-0-<region>.pooler.supabase.com` | **La app en runtime.** Una conexión por transacción, se devuelve al pool al terminar. Ideal para serverless. |
| **Session pooler** | 5432 | `postgres.bmcgwmmcfyvoazxfficz` | `aws-0-<region>.pooler.supabase.com` | Conexión pegada a la sesión. Sirve como reemplazo IPv4 de la conexión directa, pero no escala en serverless. No la usamos. |
| **Direct connection** | 5432 | `postgres` | `db.bmcgwmmcfyvoazxfficz.supabase.co` | **Migraciones y seed**, desde tu máquina. Sesión completa, soporta todo el DDL. |

Copiá la URI de **Transaction pooler** y la de **Direct connection**. Vienen con
`[YOUR-PASSWORD]` como placeholder: reemplazalo por la contraseña del paso 0.

Si la contraseña tiene caracteres raros (`@`, `/`, `:`, `#`, `?`), hay que
URL-encodearlos o la cadena se parsea mal. Lo más simple es generar una contraseña
solo alfanumérica.

Armá tu `.env.local` local:

```bash
cp .env.example .env.local
```

Y completá:

```bash
# Runtime de la app — pooler, puerto 6543
DATABASE_URL="postgresql://postgres.bmcgwmmcfyvoazxfficz:TU_PASSWORD@aws-0-<region>.pooler.supabase.com:6543/postgres"

# Migraciones y seed — directa, puerto 5432
DIRECT_URL="postgresql://postgres:TU_PASSWORD@db.bmcgwmmcfyvoazxfficz.supabase.co:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://bmcgwmmcfyvoazxfficz.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_XXXXXXXXXXXXXXXXXXXXXX"
```

`<region>` sale de la cadena que copiaste (`us-east-1`, `sa-east-1`, etc.). No la inventes.

> Alcanza con `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `lib/supabase/env.ts` acepta
> además el nombre viejo `NEXT_PUBLIC_SUPABASE_ANON_KEY` como alternativa, para
> proyectos que todavía lo usan. No hace falta definir las dos.

`.env.local` está en `.gitignore`. No lo commitees nunca.

---

## 2. Por qué el pooler y no la conexión directa en Vercel

Hay dos motivos, y los dos son bloqueantes. No es una optimización.

### a) Se agota el límite de conexiones de Postgres

Vercel corre esta app como funciones serverless. Cada invocación es un proceso
nuevo y **abre su propia conexión a Postgres**. Con tráfico normal podés tener
decenas de invocaciones concurrentes, cada una con su conexión, y las conexiones
sobreviven un rato después de que la función termina.

Un proyecto Supabase chico tolera del orden de 60 conexiones directas. Se agotan
rápido, y cuando pasa, la app entera empieza a tirar `Max client connections reached`.

El pooler (Supavisor) se sienta en el medio: acepta miles de conexiones de cliente
y las multiplexa sobre un puñado de conexiones reales a Postgres. En modo
**transaction**, la conexión real se presta durante una transacción y vuelve al pool.
Es exactamente el patrón de una función serverless.

### b) El host directo es IPv6-only y Vercel no rutea IPv6

En los proyectos Supabase creados desde 2024, `db.<ref>.supabase.co` resuelve
**solo a una dirección IPv6** (registro AAAA, sin registro A). Las funciones
serverless de Vercel no tienen salida IPv6.

El resultado no es un error claro: el TCP handshake nunca completa y la conexión
**queda colgada hasta el timeout** (`connect_timeout: 10` en `lib/db/client.ts`).
Ves requests que tardan 10 segundos y fallan, sin ningún mensaje que mencione IPv6.

El host del pooler (`aws-0-<region>.pooler.supabase.com`) sí tiene IPv4. Por eso
funciona.

### Consecuencia: `prepare: false`

El pooler en modo transaction **no soporta prepared statements**: como la conexión
real cambia entre transacciones, un statement preparado en una conexión no existe en
la siguiente. Da errores intermitentes tipo `prepared statement "s1" already exists`.

Por eso `lib/db/client.ts` ya crea el cliente con `prepare: false`:

```ts
postgres(connectionString, {
  max: process.env.NODE_ENV === "production" ? 1 : 5,
  prepare: false,        // ← obligatorio con el pooler en modo transaction
  idle_timeout: 20,
  connect_timeout: 10,
})
```

**No lo cambies.** Está resuelto; tocarlo rompe producción de forma intermitente.

---

## 3. Aplicar el esquema

Las migraciones van contra `DIRECT_URL` (puerto 5432), **no** contra el pooler:
el modo transaction no soporta el DDL con estado de sesión que necesitan.

Se corren desde tu máquina, una sola vez, en orden.

```bash
# Cargá las variables de .env.local en la shell
set -a && source .env.local && set +a

# 1) Tablas, enums, índices
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f drizzle/0000_init.sql

# 2) Constraints de integridad + RLS y revocación de permisos a anon/authenticated
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f drizzle/0001_constraints_rls.sql

# 3) Estado "Pendiente" para el autorregistro con aprobación
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f drizzle/0002_registro_pendiente.sql
```

`-v ON_ERROR_STOP=1` corta al primer error en vez de seguir y dejar el esquema a medias.

Si no tenés `psql` instalado:

```bash
sudo apt install postgresql-client   # Debian/Ubuntu
```

Alternativa sin `psql`: abrí el **SQL Editor** del dashboard de Supabase y pegá el
contenido de cada `.sql`, uno por vez, en orden.

Verificá que las tablas estén:

```bash
psql "$DIRECT_URL" -c "\dt public.*"
```

Deberías ver `people`, `equipment`, `loans`, `bookings`, `tickets`, `sanctions`,
`audit`, `id_counters`.

### Seed

Carga los datos iniciales (personas, inventario, contadores de ID). También usa
`DIRECT_URL`.

```bash
npm run db:seed
```

El script lee `.env.local` por sí solo (`node --env-file=.env.local`), así que
no necesitás el `source` previo.

Es idempotente en el sentido de que no lo corras dos veces sin mirar: si ya hay
datos, revisá antes de repetirlo.

---

## 4. Configurar las variables en Vercel

Vercel **no** lee tu `.env.local`. Hay que cargarlas a mano.

1. Vercel → tu proyecto → **Settings → Environment Variables**.
2. Por cada variable: pegá nombre y valor, y marcá los tres entornos
   **Production**, **Preview** y **Development**.
3. Si el proyecto ya estaba desplegado, **redeployá**: las variables se inyectan
   en build/runtime, un deploy viejo no las toma. Deployments → el último → `⋯` →
   **Redeploy**.

| Variable | Valor | ¿Secreta? | Entornos |
|---|---|---|---|
| `DATABASE_URL` | pooler, puerto **6543**, usuario `postgres.bmcgwmmcfyvoazxfficz` | **Sí** — contiene la contraseña y saltea RLS | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://bmcgwmmcfyvoazxfficz.supabase.co` | No — va al bundle del navegador | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` | No — va al bundle del navegador | Production, Preview, Development |
| `DIRECT_URL` | directa, puerto **5432** | **Sí** — misma contraseña | **Opcional**, ver abajo |

Notas:

- **Todo lo que empiece con `NEXT_PUBLIC_` termina en el JavaScript que se descarga
  el navegador.** Es el comportamiento de Next.js, no un bug. Nunca pongas un secreto
  con ese prefijo.
- **`DIRECT_URL` no hace falta en Vercel.** La app en runtime no la usa: solo la
  necesitan las migraciones y el seed, que corrés desde tu máquina. Subirla es un
  secreto más expuesto sin motivo. Cargala únicamente si en algún momento corrés
  `drizzle-kit` desde CI.
- Si en el futuro rotás la contraseña otra vez, hay que actualizar `DATABASE_URL` y
  `DIRECT_URL` en Vercel **y** redeployar.

---

## 5. Configurar Supabase Auth

### 5.1 Habilitar el proveedor Email

Supabase → **Authentication → Sign In / Providers**:

- **Email**: habilitado.
- **Confirm email**: **desactivalo**. Con el autorregistro activo (`/registro`)
  ya hay un control humano: preceptoría aprueba cada solicitud antes de que la
  persona pueda entrar. La confirmación por mail agrega una segunda barrera que
  no protege más y sí rompe: el SMTP que trae Supabase por defecto está limitado
  a unos pocos mails por hora, así que si se registra un curso entero la mayoría
  no recibe nada y quedan trabados. Si querés confirmación por mail, primero
  configurá un SMTP propio.
- **Enable sign-ups**: tiene que quedar **habilitado**. Si lo apagás, `/registro`
  deja de funcionar. Apagalo solo si querés desactivar el autorregistro y volver
  a crear todas las cuentas a mano.
- Los proveedores sociales quedan deshabilitados.

> El autorregistro no da acceso por sí solo. Quien se registra queda en estado
> `Pendiente`: tiene cuenta pero el sistema le niega la entrada hasta que un
> administrador le asigna un rol desde **Gestión de Usuarios → Solicitudes de
> acceso pendientes**. El rol nunca lo elige el que se registra.

### 5.2 Site URL y Redirect URLs

Supabase → **Authentication → URL Configuration**:

- **Site URL**: el dominio de producción, sin barra final.

  ```
  https://tu-proyecto.vercel.app
  ```

- **Redirect URLs**: agregá una por línea. Las de preview necesitan comodín porque
  Vercel genera un subdominio distinto por cada deploy:

  ```
  https://tu-proyecto.vercel.app/**
  https://tu-proyecto-*.vercel.app/**
  http://localhost:3000/**
  ```

  El `/**` cubre las rutas de callback (`/auth/callback` y similares). Sin esto,
  el login redirige a la home de Supabase o tira `redirect_to is not allowed`.

Si más adelante usás un dominio propio, agregalo también y actualizá **Site URL**.

### 5.3 Crear el primer usuario admin y enlazarlo a `people`

Autenticarse **no alcanza**. La app resuelve quién sos buscando en la tabla `people`
la fila cuyo `auth_user_id` coincide con el UUID del usuario de Supabase Auth. Si esa
fila no existe o tiene `auth_user_id` en `NULL`, el login "funciona" pero la app te
dice que el usuario no está aprovisionado.

Son dos pasos:

**a) Crear el usuario en Auth**

Supabase → **Authentication → Users → Add user → Create new user**:

- Email: el del preceptor/admin (por ejemplo `preceptor@colegio.edu.ar`).
- Password: una temporal, para cambiar después.
- Marcá **Auto Confirm User** para no depender del mail de confirmación.

Copiá el **UUID** del usuario recién creado (columna `UID` de la lista).

**b) Enlazarlo a la fila de `people`**

La persona ya tiene que existir en `people` (la crea el seed). Enlazá por email:

```sql
UPDATE people
SET auth_user_id = '00000000-0000-0000-0000-000000000000'  -- UUID del paso (a)
WHERE email = 'preceptor@colegio.edu.ar';
```

Desde la terminal:

```bash
psql "$DIRECT_URL" -c "UPDATE people SET auth_user_id = 'PEGÁ-EL-UUID' WHERE email = 'preceptor@colegio.edu.ar';"
```

Verificá que enlazó (tiene que devolver 1 fila):

```bash
psql "$DIRECT_URL" -c "SELECT id, nombre, role, email, auth_user_id FROM people WHERE auth_user_id IS NOT NULL;"
```

Si `UPDATE 0`, el email no coincide con ninguna fila. Buscá la persona y usá su `id`:

```bash
psql "$DIRECT_URL" -c "SELECT id, nombre, role, email FROM people ORDER BY id;"
psql "$DIRECT_URL" -c "UPDATE people SET auth_user_id = 'PEGÁ-EL-UUID' WHERE id = 'P-01';"
```

`auth_user_id` tiene constraint `UNIQUE`: un usuario de Auth se enlaza a una sola
persona. Si te equivocaste, poné `NULL` en la fila incorrecta antes de reasignar.

Repetí a) + b) para cada persona que tenga que loguear.

---

## 6. Checklist de verificación post-deploy

Corré esto contra la URL de producción, en orden. Si alguno falla, andá a la sección 7.

- [ ] **La app carga.** Abrí `https://tu-proyecto.vercel.app`. Si ves un error 500,
      mirá Vercel → Deployments → el deploy → **Runtime Logs**.

- [ ] **El login funciona.** Entrá con el usuario del paso 5.3. Tenés que llegar al
      dashboard con tu nombre y rol correctos.

- [ ] **Un préstamo descuenta stock.** Anotá el `disponible` de un equipo, registrá un
      préstamo y verificá que bajó en 1. Devolvelo y verificá que volvió al valor original.

- [ ] **Los datos persisten.** Recargá la página con F5 y navegá a otra sección y volvé.
      Los datos siguen ahí. Si desaparecen, la app está leyendo del estado en memoria
      y no de Postgres.

- [ ] **Persiste de verdad en la base**, no en una caché:

      ```bash
      psql "$DIRECT_URL" -c "SELECT id, equipo_id, alumno, estado, fecha_devolucion FROM loans ORDER BY created_at DESC LIMIT 5;"
      ```

- [ ] **La publishable key NO puede leer las tablas.** Esta es la verificación de que
      el RLS quedó bien cerrado. Desde tu terminal:

      ```bash
      curl -s "https://bmcgwmmcfyvoazxfficz.supabase.co/rest/v1/people?select=*" \
        -H "apikey: sb_publishable_XXXXXXXXXXXXXXXXXXXXXX" \
        -H "Authorization: Bearer sb_publishable_XXXXXXXXXXXXXXXXXXXXXX"
      ```

      **Resultado esperado:** un array vacío `[]`, o un error de permisos
      (`permission denied for table people` / `permission denied for schema public`,
      típicamente con código `42501` y HTTP 401/403).

      **Si devuelve filas con datos reales, tenés un agujero de seguridad.** Significa
      que `drizzle/0001_constraints_rls.sql` no se aplicó. Volvé al paso 3 y corrélo.
      No dejes la app expuesta así.

      Repetí el mismo curl cambiando `people` por `loans`, `equipment` y `tickets`.

- [ ] **Ningún secreto en el bundle del cliente.** En el navegador, DevTools → Network,
      buscá `postgresql://` en los archivos JS. No tiene que aparecer. Si aparece,
      alguien importó `lib/db/client.ts` desde un Client Component; el `import "server-only"`
      debería haberlo frenado en build.

---

## 7. Troubleshooting

| Error | Causa | Solución |
|---|---|---|
| `Falta DATABASE_URL. Copiá .env.example a .env.local...` | La variable no está definida en el entorno donde corre la app. En Vercel: no la cargaste, o la cargaste después del último deploy. | Verificá Settings → Environment Variables, que esté marcada para el entorno correcto (Production/Preview/Development) y **redeployá**. Local: revisá que `.env.local` exista y tenga la línea. |
| Requests que cuelgan ~10 s y fallan; `Connection terminated due to connection timeout`; `ETIMEDOUT` | Estás usando la **conexión directa** (`db.<ref>.supabase.co:5432`) desde Vercel. Ese host es IPv6-only y Vercel no rutea IPv6: el handshake nunca completa. | Cambiá `DATABASE_URL` al **Transaction pooler**: puerto **6543**, host `aws-0-<region>.pooler.supabase.com`, usuario `postgres.bmcgwmmcfyvoazxfficz`. Redeployá. |
| `prepared statement "s1" already exists` (intermitente) | El pooler en modo transaction no soporta prepared statements: la conexión real cambia entre transacciones. | `lib/db/client.ts` ya tiene `prepare: false`. Si el error aparece, alguien lo sacó, o hay otro cliente `postgres()` creado en otro archivo sin esa opción. Buscá `postgres(` en el repo. |
| `Max client connections reached` / `remaining connection slots are reserved` | Demasiadas conexiones simultáneas. Típico de usar conexión directa desde serverless, o de un `postgres()` creado fuera del singleton de `lib/db/client.ts`. | Usá el pooler en `DATABASE_URL`. Confirmá que en producción `max: 1`. Importá siempre `db` desde `lib/db/client.ts`, nunca crees un cliente nuevo. Si persiste, esperá el reciclado o reiniciá el proyecto desde Supabase → Settings → General → Restart project. |
| `Invalid login credentials` al loguear | Email o contraseña incorrectos; o el usuario no existe en **Authentication → Users**; o existe pero no está confirmado y "Confirm email" está activo. | Revisá el usuario en Authentication → Users. Si figura sin confirmar, usá **Auto Confirm** o mandale el mail de confirmación. Podés resetear la contraseña desde el mismo panel (`⋯` → Reset password). |
| Loguea bien pero la app dice que el usuario **no está aprovisionado** / lo saca al login | El usuario existe en Supabase Auth pero **ninguna fila de `people` tiene ese `auth_user_id`**. La app no puede resolver rol ni permisos. | Paso 5.3 b): `UPDATE people SET auth_user_id = '<uuid>' WHERE email = '<email>';`. Verificá con `SELECT id, email, auth_user_id FROM people WHERE auth_user_id IS NOT NULL;`. Ojo con el UUID copiado de más o de menos. |
| `password authentication failed for user "postgres"` | Contraseña incorrecta en la cadena; o tiene caracteres especiales sin URL-encodear; o rotaste la contraseña y no actualizaste las variables. | Regenerá las cadenas desde **Connect** con la contraseña actual. Si tiene `@`, `/`, `:`, `#` o `?`, URL-encodealos o generá una contraseña solo alfanumérica. Actualizá **las dos** variables en Vercel y redeployá. |
| `relation "people" does not exist` | Las migraciones no se aplicaron a esta base. | Paso 3: corré `drizzle/0000_init.sql` y `drizzle/0001_constraints_rls.sql` contra `DIRECT_URL`. Confirmá que apuntás al proyecto correcto. |
| `permission denied for table people` **desde la app** | Se aplicó el revoke de RLS y la app está conectando con un rol sin permisos (`anon`/`authenticated`) en vez de con `postgres` vía `DATABASE_URL`. | La app tiene que ir por Server Actions con `DATABASE_URL` (usuario `postgres.<ref>`). Revisá que el código no esté leyendo datos con el cliente de `@supabase/ssr`. |
| El curl del paso 6 devuelve **filas reales** | `0001_constraints_rls.sql` no se aplicó: las tablas quedaron legibles por la publishable key. | Aplicalo ya (paso 3) y repetí el curl hasta que devuelva `[]` o error de permisos. Es un agujero de seguridad, no un detalle. |
| El login redirige a Supabase o `redirect_to is not allowed` | Falta la URL en **Authentication → URL Configuration → Redirect URLs**. Los deploys de preview tienen subdominio distinto cada vez. | Agregá `https://tu-proyecto.vercel.app/**`, `https://tu-proyecto-*.vercel.app/**` y `http://localhost:3000/**`, y verificá **Site URL**. |
| Cambiaste una variable en Vercel y no pasa nada | Las variables se inyectan en build/runtime; un deploy existente no las relee. | Deployments → el último → `⋯` → **Redeploy**. |

---

## Referencia rápida de archivos

| Archivo | Qué hace |
|---|---|
| `.env.example` | Plantilla de variables, comentada. Nunca con credenciales reales. |
| `lib/db/client.ts` | Cliente Drizzle/postgres.js. Usa `DATABASE_URL`, `prepare: false`. |
| `drizzle.config.ts` | Config de drizzle-kit. Usa `DIRECT_URL`. |
| `lib/db/schema.ts` | Esquema de tablas. |
| `drizzle/0000_init.sql` | Tablas, enums, índices. |
| `drizzle/0001_constraints_rls.sql` | Constraints de integridad, RLS y revoke a `anon`/`authenticated`. |
| `drizzle/0002_registro_pendiente.sql` | Estado `Pendiente` para el autorregistro con aprobación. |
| `scripts/seed.ts` | Datos iniciales. `npm run db:seed`. Usa `DIRECT_URL`. |
| `lib/supabase/` | Clientes de Supabase Auth (browser, server, middleware). |
