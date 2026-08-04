"use client"

import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { useLab } from "@/lib/lab-store"
import { NAV_ITEMS, type ModuleKey } from "./nav"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { DashboardModule } from "./modules/dashboard"
import { CalendarModule } from "./modules/calendar"
import { UsersModule } from "./modules/users"
import { EquipmentModule } from "./modules/equipment"
import { SanctionsModule } from "./modules/sanctions"
import { TicketsModule } from "./modules/tickets"
import { AuditModule } from "./modules/audit"
import { ReportsModule } from "./modules/reports"
import { ProfileModule } from "./modules/profile"
import { cn } from "@/lib/utils"
import { LoansModule } from "./modules/loans"

function ModuleView({ active }: { active: ModuleKey }) {
  switch (active) {
    case "dashboard":
      return <DashboardModule />
    case "perfil":
      return <ProfileModule />
    case "calendar":
      return <CalendarModule />
    case "users":
      return <UsersModule />
    case "equipment":
      return <EquipmentModule />
    case "loans":            // 
      return <LoansModule /> 
    case "sanctions":
      return <SanctionsModule />
    case "tickets":
      return <TicketsModule />
    case "audit":
      return <AuditModule />
    case "reports":
      return <ReportsModule />
    default:
      return null
  }
}

export function LabShell() {
  const { role, toasts } = useLab()
  const [active, setActive] = useState<ModuleKey>("dashboard")
  const [mobileOpen, setMobileOpen] = useState(false)

  // When role changes, ensure the active module is permitted for the new role.
  useEffect(() => {
    const allowed = NAV_ITEMS.filter((i) => i.roles.includes(role)).map((i) => i.key)
    if (!allowed.includes(active)) {
      setActive(allowed[0])
    }
  }, [role, active])

  function navigate(k: ModuleKey) {
    setActive(k)
    setMobileOpen(false)
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden w-72 shrink-0 lg:block">
        <Sidebar active={active} onNavigate={navigate} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 shadow-2xl">
            <Sidebar active={active} onNavigate={navigate} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <ModuleView active={active} />
          </div>
        </main>
      </div>

      {/* Toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-foreground shadow-lg",
              "animate-in slide-in-from-right-4 fade-in",
            )}
          >
            <CheckCircle2 className="size-4 text-emerald-500" />
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  )
}
