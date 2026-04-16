import { getSpaceTree } from "@/lib/work/actions";
import { WorkSidebar } from "@/components/work/work-sidebar";

export default async function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = await getSpaceTree();

  return (
    <div className="flex gap-0 -mx-8 -my-8 h-[calc(100dvh-68px)]">
      {/* Work nav panel */}
      <div className="w-56 shrink-0 overflow-y-auto border-r border-border bg-surface-alt/30 px-2 py-3">
        <div className="haven-eyebrow px-2 pb-2">Work</div>
        <WorkSidebar tree={tree} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">{children}</div>
    </div>
  );
}
