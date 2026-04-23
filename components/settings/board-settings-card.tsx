"use client";

import { useState, useTransition } from "react";
import { Video, Users, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveLoomUrl, addAdmin, removeAdmin } from "@/lib/board/actions";

type Props = {
  initialLoomUrl: string;
  initialLoomTitle: string;
  initialAdmins: string[];
  currentUserEmail: string;
};

export function BoardSettingsCard({
  initialLoomUrl,
  initialLoomTitle,
  initialAdmins,
  currentUserEmail,
}: Props) {
  const [loomUrl, setLoomUrl] = useState(initialLoomUrl);
  const [loomTitle, setLoomTitle] = useState(initialLoomTitle);
  const [loomError, setLoomError] = useState<string | null>(null);
  const [loomSaved, setLoomSaved] = useState(false);
  const [loomPending, startLoom] = useTransition();

  const [admins, setAdmins] = useState<string[]>(initialAdmins);
  const [newAdmin, setNewAdmin] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminPending, startAdmin] = useTransition();

  const handleSaveLoom = () => {
    setLoomError(null);
    setLoomSaved(false);
    startLoom(async () => {
      try {
        await saveLoomUrl(loomUrl, loomTitle);
        setLoomSaved(true);
      } catch (e) {
        setLoomError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const handleAddAdmin = () => {
    setAdminError(null);
    const clean = newAdmin.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      setAdminError("Valid email required");
      return;
    }
    startAdmin(async () => {
      try {
        await addAdmin(clean);
        setAdmins((prev) => Array.from(new Set([...prev, clean])).sort());
        setNewAdmin("");
      } catch (e) {
        setAdminError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const handleRemoveAdmin = (email: string) => {
    setAdminError(null);
    startAdmin(async () => {
      try {
        await removeAdmin(email);
        setAdmins((prev) => prev.filter((a) => a !== email));
      } catch (e) {
        setAdminError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-heading text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
        The Board
      </h2>

      {/* Loom */}
      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-md bg-surface-alt p-2">
            <Video className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-[15px] font-bold">Quarterly Loom video</h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Paste the Loom share link for the quarterly team update. It will embed on The Board.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">
              Loom URL
            </label>
            <Input
              value={loomUrl}
              onChange={(e) => {
                setLoomUrl(e.target.value);
                setLoomSaved(false);
              }}
              placeholder="https://www.loom.com/share/..."
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-muted-foreground">
              Title (optional)
            </label>
            <Input
              value={loomTitle}
              onChange={(e) => {
                setLoomTitle(e.target.value);
                setLoomSaved(false);
              }}
              placeholder="Q2 Team Update"
            />
          </div>

          {loomError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
              {loomError}
            </div>
          )}
          {loomSaved && !loomError && (
            <div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-[12px] text-green-700 dark:text-green-400">
              Saved. It's now live on The Board.
            </div>
          )}

          <div className="flex items-center justify-between">
            {loomUrl ? (
              <a
                href={loomUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-muted-foreground hover:text-foreground"
              >
                Preview in Loom ↗
              </a>
            ) : (
              <span />
            )}
            <Button onClick={handleSaveLoom} disabled={loomPending} size="sm">
              {loomPending ? "Saving…" : "Save Loom"}
            </Button>
          </div>
        </div>
      </section>

      {/* Admins */}
      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-md bg-surface-alt p-2">
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-[15px] font-bold">Board admins</h3>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Admins can post announcements and set the quarterly Loom.
            </p>
          </div>
        </div>

        <ul className="mb-3 flex flex-col gap-1">
          {admins.length === 0 && (
            <li className="text-[12px] italic text-muted-foreground">No admins yet.</li>
          )}
          {admins.map((email) => (
            <li
              key={email}
              className="flex items-center justify-between rounded-md border border-border bg-surface-alt/40 px-3 py-2 text-[13px]"
            >
              <span className="truncate">
                {email}
                {email.toLowerCase() === currentUserEmail.toLowerCase() && (
                  <span className="ml-2 text-[11px] text-muted-foreground">(you)</span>
                )}
              </span>
              <button
                onClick={() => handleRemoveAdmin(email)}
                disabled={adminPending || email.toLowerCase() === currentUserEmail.toLowerCase()}
                className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-red-600 disabled:opacity-30"
                aria-label={`Remove ${email}`}
                title={
                  email.toLowerCase() === currentUserEmail.toLowerCase()
                    ? "You can't remove yourself"
                    : "Remove admin"
                }
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <Input
            value={newAdmin}
            onChange={(e) => setNewAdmin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddAdmin();
              }
            }}
            placeholder="teammate@havenvacationrentals.com"
            type="email"
          />
          <Button onClick={handleAddAdmin} disabled={adminPending} size="sm">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
        {adminError && (
          <div className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-600 dark:text-red-400">
            {adminError}
          </div>
        )}
      </section>
    </div>
  );
}
