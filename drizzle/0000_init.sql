CREATE TYPE "public"."equipment_category" AS ENUM('Llaves', 'Hardware', 'Componentes', 'Periféricos', 'Herramientas');--> statement-breakpoint
CREATE TYPE "public"."equipment_status" AS ENUM('Operativo', 'En Mantenimiento', 'Fuera de Servicio', 'En Reparación', 'En Uso Activo');--> statement-breakpoint
CREATE TYPE "public"."loan_status" AS ENUM('Activo', 'Devuelto');--> statement-breakpoint
CREATE TYPE "public"."person_status" AS ENUM('Activo', 'Inactivo');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'docente', 'alumno');--> statement-breakpoint
CREATE TYPE "public"."sanction_level" AS ENUM('amarilla', 'roja');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('pendiente', 'proceso', 'solucionado');--> statement-breakpoint
CREATE TABLE "audit" (
	"id" text PRIMARY KEY NOT NULL,
	"fecha" timestamp with time zone DEFAULT now() NOT NULL,
	"usuario" text NOT NULL,
	"rol" "role" NOT NULL,
	"accion" text NOT NULL,
	"anterior" text NOT NULL,
	"siguiente" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"dia" text NOT NULL,
	"modulo_id" text NOT NULL,
	"division" text NOT NULL,
	"docente" text,
	"actividad" text,
	"fecha" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"categoria" "equipment_category" NOT NULL,
	"total" integer NOT NULL,
	"disponible" integer NOT NULL,
	"estado" "equipment_status" DEFAULT 'Operativo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "id_counters" (
	"prefix" text PRIMARY KEY NOT NULL,
	"value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" text PRIMARY KEY NOT NULL,
	"equipo_id" text NOT NULL,
	"equipo" text NOT NULL,
	"alumno" text NOT NULL,
	"docente" text NOT NULL,
	"fecha_salida" date NOT NULL,
	"fecha_devolucion_prevista" date NOT NULL,
	"fecha_devolucion" date,
	"estado" "loan_status" DEFAULT 'Activo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" text PRIMARY KEY NOT NULL,
	"auth_user_id" uuid,
	"nombre" text NOT NULL,
	"role" "role" NOT NULL,
	"legajo" text NOT NULL,
	"email" text,
	"curso" text,
	"division" text,
	"orientacion" text,
	"supervisor" text,
	"estado" "person_status" DEFAULT 'Activo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "people_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "people_legajo_unique" UNIQUE("legajo")
);
--> statement-breakpoint
CREATE TABLE "sanctions" (
	"id" text PRIMARY KEY NOT NULL,
	"alumno" text NOT NULL,
	"legajo" text NOT NULL,
	"nivel" "sanction_level" NOT NULL,
	"motivo" text NOT NULL,
	"dias" integer NOT NULL,
	"fecha" date NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"equipo_id" text NOT NULL,
	"equipo" text NOT NULL,
	"problema" text NOT NULL,
	"reporta" text NOT NULL,
	"tecnico" text DEFAULT 'Sin asignar' NOT NULL,
	"fecha" date NOT NULL,
	"estado" "ticket_status" DEFAULT 'pendiente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_equipo_id_equipment_id_fk" FOREIGN KEY ("equipo_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_equipo_id_equipment_id_fk" FOREIGN KEY ("equipo_id") REFERENCES "public"."equipment"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_slot_idx" ON "bookings" USING btree ("dia","modulo_id","fecha");--> statement-breakpoint
CREATE UNIQUE INDEX "people_email_idx" ON "people" USING btree ("email");