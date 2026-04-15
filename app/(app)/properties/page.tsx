import { Home } from "lucide-react";
import { SoonPage } from "@/components/soon";

export default function PropertiesPage() {
  return (
    <SoonPage
      icon={Home}
      eyebrow="Operations"
      title="Properties"
      phase="Phase 3"
      description="The source of truth for every cabin: lifecycle stage, revenue, onboarding checklist, offboarding plan, linen + access codes, and recurring maintenance."
      bullets={[
        "Lifecycle: Lead → Quote → Onboarding → Active → Offboarding",
        "Per-property revenue & margin",
        "Onboarding + offboarding checklists",
        "Linen, access codes, AC filters",
      ]}
    />
  );
}
