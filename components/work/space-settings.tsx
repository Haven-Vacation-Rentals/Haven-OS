"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Globe,
  Lock,
  Plus,
  Settings,
  Shield,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getSpaceMembers,
  getMembers,
  addSpaceMember,
  removeSpaceMember,
  updateSpacePrivacy,
  updateSpaceMemberRole,
  updateSpace,
  deleteSpace,
} from "@/lib/work/actions";
import type { Space, SpaceMember, SpaceMemberRole, SpacePrivacy } from "@/lib/work/types";

export function SpaceSettingsButton({
  space,
}: {
  space: Space;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="invisible grid h-5 w-5 place-items-center rounded text-muted-foreground hover:bg-muted group-hover:visible"
        title="Space settings"
      >
        <Settings className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <SpaceSettingsModal space={space} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function SpaceSettingsModal({
  space,
  onClose,
}: {
  space: Space;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [allUsers, setAllUsers] = useState<
    { id: string; full_name: string | null; email: string; avatar_url: string | null }[]
  >([]);
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<"general" | "members">("members");

  useEffect(() => {
    async function load() {
      const [m, u] = await Promise.all([getSpaceMembers(space.id), getMembers()]);
      setMembers(m);
      setAllUsers(u);
    }
    load();
  }, [space.id]);

  const memberIds = new Set(members.map((m) => m.profile_id));
  const nonMembers = allUsers.filter((u) => !memberIds.has(u.id));

  function handlePrivacyChange(privacy: SpacePrivacy) {
    start(async () => {
      await updateSpacePrivacy(space.id, privacy);
    });
  }

  function handleAddMember(profileId: string) {
    start(async () => {
      await addSpaceMember(space.id, profileId);
      const m = await getSpaceMembers(space.id);
      setMembers(m);
    });
  }

  function handleRemoveMember(profileId: string) {
    start(async () => {
      await removeSpaceMember(space.id, profileId);
      const m = await getSpaceMembers(space.id);
      setMembers(m);
    });
  }

  function handleRoleChange(profileId: string, role: SpaceMemberRole) {
    start(async () => {
      await updateSpaceMemberRole(space.id, profileId, role);
      const m = await getSpaceMembers(space.id);
      setMembers(m);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 animate-fade-in bg-foreground/20 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg animate-slide-up overflow-hidden rounded-card border border-border bg-surface shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span
            className="h-3 w-3 rounded-sm"
            style={{ backgroundColor: space.color }}
          />
          <h2 className="flex-1 font-heading text-base font-bold">
            {space.name} — Settings
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(["members", "general"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-5 py-2.5 text-[13px] font-semibold capitalize transition-colors",
                tab === t
                  ? "border-b-2 border-accent text-accent"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
          {tab === "members" ? (
            <div className="space-y-4">
              {/* Privacy toggle */}
              <div>
                <label className="haven-eyebrow mb-2 block">Visibility</label>
                <div className="flex gap-2">
                  <PrivacyOption
                    active={space.privacy === "team"}
                    icon={Globe}
                    label="Team"
                    desc="All team members can see this space"
                    onClick={() => handlePrivacyChange("team")}
                    disabled={pending}
                  />
                  <PrivacyOption
                    active={space.privacy === "private"}
                    icon={Lock}
                    label="Private"
                    desc="Only added members can see"
                    onClick={() => handlePrivacyChange("private")}
                    disabled={pending}
                  />
                </div>
              </div>

              {/* Current members */}
              <div>
                <label className="haven-eyebrow mb-2 block">
                  Members ({members.length})
                </label>
                <div className="space-y-1">
                  {members.map((m) => (
                    <div
                      key={m.profile_id}
                      className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface-alt"
                    >
                      <MemberAvatar member={m} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold">
                          {m.profile?.full_name ?? m.profile?.email ?? "Unknown"}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {m.profile?.email}
                        </div>
                      </div>
                      <select
                        value={m.role}
                        onChange={(e) =>
                          handleRoleChange(
                            m.profile_id,
                            e.target.value as SpaceMemberRole,
                          )
                        }
                        disabled={pending}
                        className="h-7 rounded border border-border bg-surface px-2 text-[12px] font-medium"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.profile_id)}
                        disabled={pending}
                        className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-surface-alt hover:text-rose-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add member */}
              {nonMembers.length > 0 ? (
                <div>
                  <label className="haven-eyebrow mb-2 block">Add member</label>
                  <div className="space-y-1">
                    {nonMembers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        disabled={pending}
                        onClick={() => handleAddMember(u.id)}
                        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-surface-alt"
                      >
                        {u.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.avatar_url}
                            alt=""
                            className="h-6 w-6 rounded-full"
                          />
                        ) : (
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-muted text-[10px] font-bold">
                            {(u.full_name ?? u.email)?.[0]?.toUpperCase()}
                          </span>
                        )}
                        <span className="flex-1 truncate text-[13px]">
                          {u.full_name ?? u.email}
                        </span>
                        <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="haven-eyebrow mb-1.5 block">Space name</label>
                <input
                  defaultValue={space.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== space.name) {
                      start(async () => {
                        await updateSpace(space.id, { name: v });
                      });
                    }
                  }}
                  className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm outline-none focus:shadow-ring"
                />
              </div>
              <div>
                <label className="haven-eyebrow mb-1.5 block">Color</label>
                <input
                  type="color"
                  defaultValue={space.color}
                  onChange={(e) => {
                    start(async () => {
                      await updateSpace(space.id, { color: e.target.value });
                    });
                  }}
                  className="h-9 w-16 cursor-pointer rounded border border-border"
                />
              </div>
              <div>
                <label className="haven-eyebrow mb-1.5 block">Description</label>
                <textarea
                  defaultValue={space.description ?? ""}
                  onBlur={(e) => {
                    start(async () => {
                      await updateSpace(space.id, {
                        description: e.target.value || null,
                      });
                    });
                  }}
                  rows={3}
                  className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:shadow-ring"
                />
              </div>
              <div className="border-t border-border pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => {
                    if (
                      confirm(
                        `Delete "${space.name}"? This removes all folders, lists, and tasks in this space.`,
                      )
                    ) {
                      start(async () => {
                        await deleteSpace(space.id);
                        onClose();
                      });
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete space
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PrivacyOption({
  active,
  icon: Icon,
  label,
  desc,
  onClick,
  disabled,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-1 items-start gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors",
        active
          ? "border-accent bg-accent-soft"
          : "border-border hover:bg-surface-alt",
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4", active ? "text-accent" : "text-muted-foreground")} />
      <div>
        <div className="text-[13px] font-semibold">{label}</div>
        <div className="text-[11px] text-muted-foreground">{desc}</div>
      </div>
    </button>
  );
}

function MemberAvatar({ member }: { member: SpaceMember }) {
  if (member.profile?.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.profile.avatar_url}
        alt=""
        className="h-7 w-7 rounded-full"
      />
    );
  }
  return (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-[11px] font-bold">
      {(member.profile?.full_name ?? "?")[0]?.toUpperCase()}
    </span>
  );
}
