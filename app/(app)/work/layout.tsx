import { getSpaceTree } from "@/lib/work/actions";
import { WorkSidebar } from "@/components/work/work-sidebar";

export default async function WorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = await getSpaceTree();

  return (
    <div className="-mx-4 -my-4 flex h-[calc(100dvh-56px)] gap-0 sm:-mx-6 sm:-my-6 sm:h-[calc(100dvh-68px)] lg:-mx-8 lg:-my-8">
      {/* Work nav panel — collapses on phones */}
      <div className="hidden w-56 shrink-0 overflow-y-auto border-r border-border bg-surface-alt/30 px-2 py-3 md:block">
        <div className="haven-eyebrow px-2 pb-2">Work</div>
        <WorkSidebar tree={tree} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
