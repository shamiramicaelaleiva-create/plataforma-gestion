import type { LucideIcon } from "lucide-react"
import {
Boxes,
CalendarDays,
ClipboardList,
LayoutDashboard,
PackageCheck,
ScrollText,
ShieldAlert,
UserCircle,
Users,
Wrench,
} from "lucide-react"
import type { Role } from "@/lib/lab-data"

export type ModuleKey =
  | "dashboard"
  | "perfil"
  | "calendar"
  | "users"
  | "equipment"
  | "loans"
  | "sanctions"
  | "tickets"
  | "audit"
  | "reports"

export interface NavItem {
  key: ModuleKey
  label: string
  icon: LucideIcon
  roles: Role[]
}

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Panel Principal", icon: LayoutDashboard, roles: ["admin", "docente", "alumno"] },
  { key: "perfil", label: "Mi Perfil", icon: UserCircle, roles: ["admin", "docente", "alumno"] }, // Habilitado para admin también
  { key: "calendar", label: "Calendario del Lab", icon: CalendarDays, roles: ["admin", "docente", "alumno"] },
  { key: "users", label: "Gestión de Usuarios", icon: Users, roles: ["admin"] },
  { key: "equipment", label: "Equipos y Stock", icon: Boxes, roles: ["admin", "docente", "alumno"] },
  { key: "loans", label: "Préstamos", icon: PackageCheck, roles: ["admin", "docente", "alumno"] }, // Habilitado para todos (con sus respectivas vistas)
  { key: "sanctions", label: "Sanciones y Alertas", icon: ShieldAlert, roles: ["admin"] }, // Removido 'alumno'
  { key: "tickets", label: "Tickets de Mantenimiento", icon: Wrench, roles: ["admin"] }, // Removido 'docente' y 'alumno'
  { key: "audit", label: "Registro de Auditoría", icon: ScrollText, roles: ["admin"] },
  { key: "reports", label: "Reportes Avanzados", icon: ClipboardList, roles: ["admin"] },
]