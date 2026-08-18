/**
 * ⚠️ TEMPORAL — MODO DEMO: el login y el registro están PUENTEADOS.
 *
 * Con `DEMO_MODE` en true la app queda accesible sin iniciar sesión: cualquiera
 * con la URL entra, con el rol que elija en el selector. Es un puente para la
 * presentación, no un estado en el que la app pueda quedarse.
 *
 * POR QUÉ ESTÁ: el flujo de login/registro contra Supabase no funciona en
 * producción y hay una presentación. No se borró nada del auth — login,
 * registro, callback y los estados de cuenta siguen enteros —, solo se saltean
 * desde acá.
 *
 * CÓMO SE REVIERTE: poner esta constante en `false` y desplegar. Con eso el
 * comportamiento vuelve a ser exactamente el de antes. Cuando haya acceso a
 * Vercel, lo prolijo es volver a colgarla de una variable de entorno
 * server-only (`process.env.DEMO_MODE === "true"`, SIN prefijo NEXT_PUBLIC)
 * para poder apagarla sin redesplegar.
 *
 * El tipo se anota explícitamente como `boolean` y no se deja inferir el
 * literal `true`: así TypeScript sigue chequeando las dos ramas de cada `if`
 * (la de demo y la de auth real) en vez de darlas por muertas.
 *
 * Este es el ÚNICO interruptor. Todo el bypass (middleware, lib/auth.ts y la
 * action del selector) cuelga de esta línea.
 */
export const DEMO_MODE: boolean = true

/**
 * Cookie donde el selector de rol guarda con qué perfil se está mostrando la
 * demo. Solo se lee cuando `DEMO_MODE` está prendido: con el flag apagado es
 * una cookie muerta que nadie mira.
 */
export const DEMO_ROLE_COOKIE = "demo_role"
