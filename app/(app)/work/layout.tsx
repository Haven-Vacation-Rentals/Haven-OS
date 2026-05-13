import { getSpaceTree } from "@/lib/work/actions";
import { WorkSidebar } from "@/components/work/work-sidebar";

export default async function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = await getSpaceTree();

  return (
    <div className="flex gap-0 -mx-4 -my-5 md:-mx-8 md:-my-8 min-h-[calc(100dvh-60px)] md:h-[calc(100dvh-68px)]">
      {/* Work nav panel — hidden on mobile, shown via inline disclosure below */}
      <div className="hidden md:flex md:flex-col w-56 shrink-0 overflow-y-auto border-r border-border bg-surface-alt/30 px-2 py-3">
        <div className="haven-eyebrow px-2 pb-2">Work</div>
        <WorkSidebar tree={tree} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 overflow-y-auto px-4 py-4 md:px-8 md:py-6">
        {/* Mobile: collapsible work nav inline */}
        <details className="md:hidden mb-4 rounded-md border border-border bg-surface-alt/40">
          <summary className="cursor-pointer select-none px-3 py-2 text-[13px] font-semibold">
            Work navigation
          </summary>
          <div className="px-2 pb-3">
            <WorkSidebar tree={tree} />
          </div>
        </details>
        {children}
      </div>
    </div>
  );
}
