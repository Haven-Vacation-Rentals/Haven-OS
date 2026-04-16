import { Lock, Users, Globe } from "lucide-react";
import type { ListType } from "@/lib/work/types";

/**
 * Tiny helper: renders an icon that represents the list visibility type.
 * Lock = private, Users = shared, Globe = public.
 */
export function ListTypeIcon({
  type,
  className,
}: {
  type: ListType;
  className?: string;
}) {
  const cls = className ?? "h-3.5 w-3.5 shrink-0 text-muted-foreground";
  switch (type) {
    case "private":
      return <Lock className={cls} />;
    case "public":
      return <Globe className={cls} />;
    case "shared":
    default:
      return <Users className={cls} />;
  }
}
