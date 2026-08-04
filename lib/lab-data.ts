export const ROLE_DEFAULT_USER: Record<string, string> = {
  admin: "Preceptor",
  docente: "Prof. García (Informática)",
  alumno: "Camila Sosa"
};

export interface Componente {
  id: string;
  nombre: string;
  categoria: 'Llaves' | 'Hardware' | 'Componentes' | 'Periféricos' | 'Herramientas';
  total: number;
  disponible: number;
  estado: 'Operativo' | 'En Mantenimiento' | 'Fuera de Servicio' | 'En Reparación' | 'En Uso Activo';
}

export const initialComponents: Componente[] = [
  // 🔑 Llaves y Accesos
  { id: "LL-01", nombre: "Llave del Box de Laboratorio de Hardware", categoria: "Llaves", total: 1, disponible: 1, estado: "Operativo" },
  { id: "LL-02", nombre: "Llave del Armario de Informática", categoria: "Llaves", total: 1, disponible: 1, estado: "Operativo" },

  // 💻 Hardware e Informática (Dentro del Armario)
  { id: "HW-01", nombre: "Fuentes de alimentación ATX para PC", categoria: "Hardware", total: 8, disponible: 8, estado: "Operativo" },
  { id: "HW-02", nombre: "Memorias RAM DDR4 8GB", categoria: "Hardware", total: 16, disponible: 16, estado: "Operativo" },
  { id: "HW-03", nombre: "Memorias RAM DDR4 16GB", categoria: "Hardware", total: 8, disponible: 8, estado: "Operativo" },
  { id: "HW-04", nombre: "Discos de estado sólido SSD Kingston 240GB", categoria: "Hardware", total: 10, disponible: 10, estado: "Operativo" },
  { id: "HW-05", nombre: "Discos de estado sólido SSD Kingston 480GB", categoria: "Hardware", total: 6, disponible: 6, estado: "Operativo" },
  { id: "HW-06", nombre: "Tarjetas de Red PCI-Express", categoria: "Hardware", total: 10, disponible: 10, estado: "Operativo" },
  { id: "HW-07", nombre: "Switches TP-Link de 8 puertos", categoria: "Hardware", total: 4, disponible: 4, estado: "Operativo" },

  // 🔬 Componentes y Microcontroladores
  { id: "MC-01", nombre: "ESP32", categoria: "Componentes", total: 15, disponible: 15, estado: "Operativo" },
  { id: "MC-02", nombre: "Arduino Uno", categoria: "Componentes", total: 20, disponible: 20, estado: "Operativo" },
  { id: "MC-03", nombre: "Kits de sensores (HC-SR04, DHT11, KY-039)", categoria: "Componentes", total: 12, disponible: 12, estado: "Operativo" },
  { id: "MC-04", nombre: "Módulos de Relé", categoria: "Componentes", total: 10, disponible: 10, estado: "Operativo" },
  { id: "MC-05", nombre: "Pelacables", categoria: "Componentes", total: 6, disponible: 6, estado: "Operativo" },
  { id: "MC-06", nombre: "Soldadora de estaño", categoria: "Componentes", total: 8, disponible: 8, estado: "Operativo" },
  { id: "MC-07", nombre: "Estaño", categoria: "Componentes", total: 10, disponible: 10, estado: "Operativo" },
  { id: "MC-08", nombre: "Destornillador", categoria: "Componentes", total: 25, disponible: 25, estado: "Operativo" },
  { id: "MC-09", nombre: "Tornillos", categoria: "Componentes", total: 500, disponible: 500, estado: "Operativo" },
  { id: "MC-10", nombre: "Martillos", categoria: "Componentes", total: 4, disponible: 4, estado: "Operativo" },
  { id: "MC-11", nombre: "LEDs", categoria: "Componentes", total: 300, disponible: 300, estado: "Operativo" },
  { id: "MC-12", nombre: "Pantallas LCD", categoria: "Componentes", total: 8, disponible: 8, estado: "Operativo" },
  { id: "MC-13", nombre: "Pulsadores", categoria: "Componentes", total: 50, disponible: 50, estado: "Operativo" },
  { id: "MC-14", nombre: "Cables Dupont", categoria: "Componentes", total: 400, disponible: 400, estado: "Operativo" },

  // 🔌 Periféricos y Equipos Portátiles
  { id: "PE-01", nombre: "Proyectores", categoria: "Periféricos", total: 4, disponible: 4, estado: "Operativo" },
  { id: "PE-02", nombre: "Notebooks", categoria: "Periféricos", total: 12, disponible: 12, estado: "Operativo" },
  { id: "PE-03", nombre: "Teclados y Ratones USB (Kit de repuesto)", categoria: "Periféricos", total: 15, disponible: 15, estado: "Operativo" },
  { id: "PE-04", nombre: "Cables HDMI", categoria: "Periféricos", total: 10, disponible: 10, estado: "Operativo" },
  { id: "PE-05", nombre: "Cables VGA", categoria: "Periféricos", total: 8, disponible: 8, estado: "Operativo" },
  { id: "PE-06", nombre: "Adaptadores a HDMI", categoria: "Periféricos", total: 6, disponible: 6, estado: "Operativo" },

  // 🛠️ Herramientas de Taller e Instrumentación
  { id: "TL-01", nombre: "Multímetros Digitales (Testers)", categoria: "Herramientas", total: 8, disponible: 8, estado: "Operativo" },
  { id: "TL-02", nombre: "Desoldadores de bomba de vacío", categoria: "Herramientas", total: 6, disponible: 6, estado: "Operativo" },
  { id: "TL-03", nombre: "Juegos de destornilladores de precisión", categoria: "Herramientas", total: 5, disponible: 5, estado: "Operativo" },
  { id: "TL-04", nombre: "Pinzas de fuerza, punta y alicates", categoria: "Herramientas", total: 14, disponible: 14, estado: "Operativo" },
  { id: "TL-05", nombre: "Calibres digitales", categoria: "Herramientas", total: 4, disponible: 4, estado: "Operativo" }
];

export const schoolCourses = [
  "1ro Básico", "2do Básico",
  "3ro Naval", "3ro Informática",
  "4to Naval", "4to Informática",
  "5to Naval", "5to Informática",
  "6to Naval", "6to Informática"
];

export const timeModules = [
  { id: "M1", label: "1° Módulo (Mañana)", rango: "07:00 - 07:40" },
  { id: "M2", label: "2° Módulo (Mañana)", rango: "07:40 - 08:20" },
  { id: "M3", label: "3° Módulo (Mañana)", rango: "08:20 - 09:00" },
  { id: "M4", label: "4° Módulo (Mañana)", rango: "09:20 - 10:00" },
  { id: "M5", label: "5° Módulo (Mañana)", rango: "10:00 - 10:40" },
  { id: "M6", label: "6° Módulo (Mañana)", rango: "10:40 - 11:20" },
  { id: "M7", label: "7° Módulo (Mañana)", rango: "11:20 - 12:00" },
  { id: "T1", label: "1° Módulo (Tarde)", rango: "14:00 - 14:40" },
  { id: "T2", label: "2° Módulo (Tarde)", rango: "14:40 - 15:20" },
  { id: "T3", label: "3° Módulo (Tarde)", rango: "15:20 - 16:00" },
  { id: "T4", label: "4° Módulo (Tarde)", rango: "16:20 - 17:00" },
  { id: "T5", label: "5° Módulo (Tarde)", rango: "17:00 - 17:40" },
  { id: "T6", label: "6° Módulo (Tarde)", rango: "17:40 - 18:20" }
];

export const initialTeachers = [
  { id: "P01", nombre: "Prof. García (Informática)", orientacion: "Informática" },
  { id: "P02", nombre: "Prof. Martínez (Informática)", orientacion: "Informática" },
  { id: "P03", nombre: "Prof. Rodríguez (Naval)", orientacion: "Naval" },
  { id: "P04", nombre: "Prof. López (Naval)", orientacion: "Naval" },
  { id: "P05", nombre: "Prof. Vega (Básico)", orientacion: "Ciclo básico" }
];

export type Role = "admin" | "docente" | "alumno"

export type Persona = {
  id: string
  nombre: string
  role: Role
  legajo?: string
  division?: string
  supervisor?: string
  email?: string
  estado?: "Activo" | "Inactivo"
  orientacion?: string  // <-- Agregado para solucionar la línea 117
  curso?: string        // <-- Agregado para solucionar las líneas 134, 145, 156, 167
}

export type Person = Persona

export const ORIENTACIONES = [
  "Naval",
  "Informática"
]

export const PEOPLE: Persona[] = [

  ...initialTeachers.map((t): Persona => ({
    id: t.id,
    nombre: t.nombre,
    role: "docente",
    legajo: `LEG-${t.id}`,
    orientacion: t.orientacion,
    division: t.orientacion,
    email: `${t.id.toLowerCase()}@escuela.edu.ar`,
    estado: "Activo"
  })),

  {
    id: "ADM-01",
    nombre: "Preceptor",
    role: "admin",
    legajo: "LEG-ADM-01",
    email: "preceptoria@escuela.edu.ar",
    estado: "Activo"
  },

  {
    id: "A01",
    nombre: "Camila Sosa",
    role: "alumno",
    legajo: "LEG-A01",
    curso: "6°",
    division: "Informática",
    supervisor: "Prof. García",
    email: "camila.sosa@alumnos.edu.ar",
    estado: "Activo"
  },

  {
    id: "A02",
    nombre: "Mateo Benítez",
    role: "alumno",
    legajo: "LEG-A02",
    curso: "5°",
    division: "Naval",
    supervisor: "Prof. Rodríguez",
    email: "mateo.benitez@alumnos.edu.ar",
    estado: "Activo"
  },

  {
    id: "A03",
    nombre: "Lucas Juárez",
    role: "alumno",
    legajo: "LEG-A03",
    curso: "4°",
    division: "Informática",
    supervisor: "Prof. Martínez",
    email: "lucas.juarez@alumnos.edu.ar",
    estado: "Activo"
  },

  {
    id: "A04",
    nombre: "Franco Martínez",
    role: "alumno",
    legajo: "LEG-A04",
    curso: "3°",
    division: "Naval",
    supervisor: "Prof. López",
    email: "franco.martinez@alumnos.edu.ar",
    estado: "Activo"
  }
]

export type Equipment = Componente;
export type EquipmentStatus = Componente["estado"];
export type EquipmentCategory = Componente["categoria"];
export const EQUIPMENT = initialComponents;

export const CATEGORIAS: EquipmentCategory[] = [
  "Llaves",
  "Hardware",
  "Componentes",
  "Periféricos",
  "Herramientas",
];

export const ESTADOS_EQUIPO: EquipmentStatus[] = [
  "Operativo",
  "En Mantenimiento",
  "Fuera de Servicio",
  "En Reparación",
  "En Uso Activo",
];

/** Prefijo de ID por categoría, para autogenerar el ID de un alta de inventario. */
export const CATEGORIA_PREFIX: Record<EquipmentCategory, string> = {
  Llaves: "LL",
  Hardware: "HW",
  Componentes: "MC",
  Periféricos: "PE",
  Herramientas: "TL",
};

export interface HistoryEntry {
  personId: string
  equipo: string
  accion: "Retiro" | "Devolución"
  fecha: string
  condicion: "En buen estado" | "Dañado"
  retraso: string
}

export const HISTORY: HistoryEntry[] = [];

export const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador / Preceptor",
  docente: "Docente Responsable",
  alumno: "Alumno"
};

export const STATUS_LABELS: Record<string, string> = {
  "Operativo": "Operativo",
  "En Mantenimiento": "En Mantenimiento",
  "Fuera de Servicio": "Fuera de Servicio",
  "En Reparación": "En Reparación",
  "En Uso Activo": "En Uso Activo"
};

export interface Prestamo {
  id: string
  equipo: string
  equipoId: string
  alumno: string
  docente: string
  fechaSalida: string
  fechaDevolucionPrevista: string
  /** Fecha real de devolución; se completa al reponer el stock. */
  fechaDevolucion?: string
  estado: "Activo" | "Devuelto"
}

export type Loan = Prestamo

export const LOANS: Loan[] = []

export function estaVencido(prestamo: Prestamo): boolean {
  if (prestamo.estado === "Devuelto") return false

  const hoy = new Date()
  const vencimiento = new Date(prestamo.fechaDevolucionPrevista)

  return hoy > vencimiento
}

export const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
]

export const DIVISIONES = [
  "1°A",
  "1°B",
  "2°A",
  "2°B",
  "3°A",
  "3°B",
]

export const MODULOS = [
  { id: "M1", label: "1° Módulo Mañana", rango: "07:00 - 07:40" },
  { id: "M2", label: "2° Módulo Mañana", rango: "07:40 - 08:20" },
  { id: "M3", label: "3° Módulo Mañana", rango: "08:20 - 09:00" },
  { id: "M4", label: "4° Módulo Mañana", rango: "09:20 - 10:00" },
  { id: "M5", label: "5° Módulo Mañana", rango: "10:00 - 10:40" },
  { id: "M6", label: "6° Módulo Mañana", rango: "10:40 - 11:20" },
  { id: "M7", label: "7° Módulo Mañana", rango: "11:20 - 12:00" },
  { id: "T1", label: "1° Módulo Tarde", rango: "14:00 - 14:40" },
  { id: "T2", label: "2° Módulo Tarde", rango: "14:40 - 15:20" },
  { id: "T3", label: "3° Módulo Tarde", rango: "15:20 - 16:00" },
  { id: "T4", label: "4° Módulo Tarde", rango: "16:20 - 17:00" },
  { id: "T5", label: "5° Módulo Tarde", rango: "17:00 - 17:40" },
]


export interface Booking {
  id: string
  dia: string
  moduloId: string
  division: string
  docente?: string
  actividad?: string
  fecha?: string
}

export const BOOKINGS: Booking[] = []


export interface AuditEntry {
  id: string
  fecha: string
  usuario: string
  rol: Role
  accion: string
  anterior: string
  siguiente: string
}

export const AUDIT: AuditEntry[] = []


export type TicketStatus =
  | "pendiente"
  | "proceso"
  | "solucionado"

export interface Ticket {
  id: string
  /** ID del artículo del inventario al que afecta el ticket. */
  equipoId: string
  equipo: string
  problema: string
  reporta: string
  tecnico: string
  fecha: string
  estado: TicketStatus
}

export const TICKETS: Ticket[] = []


export type SanctionLevel = "amarilla" | "roja"

export interface Sanction {
  id: string
  alumno: string
  legajo: string
  nivel: SanctionLevel
  motivo: string
  dias: number
  fecha: string
  activa: boolean
}

export const SANCTIONS: Sanction[] = []

/** Un equipo se puede prestar si está técnicamente apto y queda stock. */
export function canLoan(estado: EquipmentStatus, disponible: number) {
  return (
    estado !== "Fuera de Servicio" &&
    estado !== "En Reparación" &&
    estado !== "En Mantenimiento" &&
    disponible > 0
  )
}
