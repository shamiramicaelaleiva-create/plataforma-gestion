import { LabProvider } from "@/lib/lab-store"
import { LabShell } from "@/components/lab/lab-shell"

export default function Page() {
  return (
    <LabProvider>
      <LabShell />
    </LabProvider>
  )
}
