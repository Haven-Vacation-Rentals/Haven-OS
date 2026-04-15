import { FolderKanban } from "lucide-react";
import { SoonPage } from "@/components/soon";

export default function WorkPage() {
  return (
    <SoonPage
      icon={FolderKanban}
      eyebrow="Work"
      title="The ClickUp replacement"
      phase="Phase 2 — next up"
      description="A native task and project system: Spaces → Lists → Tasks, with List, Board, Calendar, Timeline, and Table views, custom fields, dependencies, recurring tasks, docs, and time tracking."
      bullets={[
        "List / Board / Calendar / Timeline / Table views",
        "Custom fields + saved views",
        "Docs, templates, recurrences",
        "Time tracking + dependencies",
        "Slash-commands + keyboard-first",
        "Haven Assistant tool access",
      ]}
    />
  );
}
