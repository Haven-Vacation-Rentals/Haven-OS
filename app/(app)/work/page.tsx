import { FolderKanban, Plus } from "lucide-react";
import { TopographicBg } from "@/components/brand/topographic-bg";
import { getSpaceTree } from "@/lib/work/actions";

export default async function WorkIndexPage() {
  const tree = await getSpaceTree();
  const hasSpaces = tree.length > 0;

  return (
    <div className="flex h-full items-center justify-center">
      <div className="relative flex max-w-md flex-col items-center overflow-hidden rounded-card border border-border bg-surface px-8 py-12 text-center shadow-card">
        <TopographicBg className="text-foreground" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-foreground text-background">
            <FolderKanban className="h-5 w-5" />
          </span>
          <h2 className="font-heading text-display-4 font-bold">
            {hasSpaces ? "Select a list" : "Create your first Space"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {hasSpaces
              ? "Pick a list from the sidebar, or create a new one."
              : "Spaces organize your work — like departments or projects. Click \"New Space\" in the sidebar to get started."}
          </p>
        </div>
      </div>
    </div>
  );
}
