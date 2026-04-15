import { Inbox } from "lucide-react";
import { SoonPage } from "@/components/soon";

export default function InboxPage() {
  return (
    <SoonPage
      icon={Inbox}
      eyebrow="Overview"
      title="Inbox"
      phase="Phase 2"
      description="Your single stream of mentions, comment replies, task assignments, and agent notifications across the entire OS."
      bullets={[
        "@mentions from tasks and docs",
        "Agent-surfaced follow-ups",
        "Triage with keyboard shortcuts",
        "Snooze, archive, escalate",
      ]}
    />
  );
}
