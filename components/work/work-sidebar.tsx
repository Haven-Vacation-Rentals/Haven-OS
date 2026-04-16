"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronRight,
  FolderOpen,
  Folder as FolderIcon,
  List as ListIcon,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SpaceTree } from "@/lib/work/types";
import {
  createSpace,
  createFolder,
  createList,
} from "@/lib/work/actions";
import { SpaceSettingsButton } from "@/components/work/space-settings";

/**
 * Work sidebar tree — Spaces, Folders, Lists. Lives in the work
 * layout as a secondary panel inside the main sidebar area.
 */
export function WorkSidebar({ tree }: { tree: SpaceTree[] }) {
  return (
    <div className="flex flex-col gap-1 py-2">
      {tree.map((space) => (
        <SpaceNode key={space.id} space={space} />
      ))}
      <AddSpaceButton />
    </div>
  );
}

function SpaceNode({ space }: { space: SpaceTree }) {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();

  return (
    <div>
      <div className="group flex items-center gap-1 rounded-md px-2 py-1 hover:bg-surface-alt">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="grid h-5 w-5 shrink-0 place-items-center"
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              expanded && "rotate-90",
            )}
          />
        </button>
        <span
          className="mr-1.5 h-2 w-2 shrink-0 rounded-sm"
          style={{ backgroundColor: space.color }}
        />
        <span className="flex-1 truncate text-[13px] font-semibold text-foreground">
          {space.name}
        </span>
        <SpaceSettingsButton space={space} />
        <AddFolderListButton spaceId={space.id} />
      </div>

      {expanded ? (
        <div className="ml-4 border-l border-border/50 pl-1">
          {/* Folders */}
          {space.folders.map((folder) => (
            <FolderNode
              key={folder.id}
              folder={folder}
              spaceId={space.id}
              pathname={pathname}
            />
          ))}
          {/* Loose lists (not in any folder) */}
          {space.lists.map((list) => (
            <ListNode key={list.id} list={list} pathname={pathname} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FolderNode({
  folder,
  spaceId,
  pathname,
}: {
  folder: SpaceTree["folders"][number];
  spaceId: string;
  pathname: string;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <div className="group flex items-center gap-1 rounded-md px-2 py-0.5 hover:bg-surface-alt">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="grid h-5 w-5 shrink-0 place-items-center"
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 text-muted-foreground transition-transform",
              expanded && "rotate-90",
            )}
          />
        </button>
        {expanded ? (
          <FolderOpen className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <FolderIcon className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="flex-1 truncate text-[12.5px] font-medium text-foreground/80">
          {folder.name}
        </span>
        <AddListInFolderButton spaceId={spaceId} folderId={folder.id} />
      </div>
      {expanded ? (
        <div className="ml-4">
          {folder.lists.map((list) => (
            <ListNode key={list.id} list={list} pathname={pathname} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ListNode({
  list,
  pathname,
}: {
  list: { id: string; name: string };
  pathname: string;
}) {
  const active = pathname === `/work/list/${list.id}`;
  return (
    <Link
      href={`/work/list/${list.id}` as never}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1 text-[12.5px] font-medium",
        "transition-colors hover:bg-surface-alt",
        active
          ? "bg-accent-soft text-haven-coral-700 dark:text-haven-coral"
          : "text-foreground/70",
      )}
    >
      <ListIcon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{list.name}</span>
    </Link>
  );
}

// --- Quick-add buttons -------------------------------------------------------

function AddSpaceButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const name = prompt("Space name:");
        if (!name?.trim()) return;
        start(async () => {
          await createSpace({ name: name.trim() });
        });
      }}
      className="mx-2 mt-2 flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-semibold text-muted-foreground hover:bg-surface-alt hover:text-foreground"
    >
      <Plus className="h-3.5 w-3.5" />
      New Space
    </button>
  );
}

function AddFolderListButton({ spaceId }: { spaceId: string }) {
  const [pending, start] = useTransition();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowMenu((v) => !v)}
        className="invisible grid h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-muted group-hover:visible"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      {showMenu ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-36 animate-slide-up rounded-card border border-border bg-surface py-1 shadow-card-hover">
          <button
            type="button"
            disabled={pending}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-[12.5px] hover:bg-surface-alt"
            onClick={() => {
              setShowMenu(false);
              const name = prompt("List name:");
              if (!name?.trim()) return;
              start(async () => {
                await createList({ space_id: spaceId, name: name.trim() });
              });
            }}
          >
            <ListIcon className="h-3.5 w-3.5" /> New List
          </button>
          <button
            type="button"
            disabled={pending}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-[12.5px] hover:bg-surface-alt"
            onClick={() => {
              setShowMenu(false);
              const name = prompt("Folder name:");
              if (!name?.trim()) return;
              start(async () => {
                await createFolder({ space_id: spaceId, name: name.trim() });
              });
            }}
          >
            <FolderIcon className="h-3.5 w-3.5" /> New Folder
          </button>
        </div>
      ) : null}
    </div>
  );
}

function AddListInFolderButton({
  spaceId,
  folderId,
}: {
  spaceId: string;
  folderId: string;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const name = prompt("List name:");
        if (!name?.trim()) return;
        start(async () => {
          await createList({
            space_id: spaceId,
            folder_id: folderId,
            name: name.trim(),
          });
        });
      }}
      className="invisible grid h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-muted group-hover:visible"
    >
      <Plus className="h-3 w-3" />
    </button>
  );
}
