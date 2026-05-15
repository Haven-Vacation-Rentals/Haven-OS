"use client";

import { useState, useTransition } from "react";
import { Bot, Plug, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { revokeMcpConnector } from "@/lib/mcp/oauth/actions";
import type { ApiScope } from "@/lib/api-tokens/types";

export interface McpConnectorRow {
  id: string;
  client_id: string;
  scopes: ApiScope[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function McpConnectorCard({
  initialConnectors,
}: {
  initialConnectors: McpConnectorRow[];
}) {
  const [connectors, setConnectors] = useState(initialConnectors);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleRevoke(id: string) {
    if (!confirm("Revoke this connector? Claude will lose access immediately.")) {
      return;
    }
    setRevokingId(id);
    startTransition(async () => {
      try {
        await revokeMcpConnector(id);
        setConnectors((cur) => cur.filter((c) => c.id !== id));
        toast.success("Connector revoked");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to revoke connector";
        toast.error(msg);
      } finally {
        setRevokingId(null);
      }
    });
  }

  return (
    <section className="rounded-card border border-border bg-surface shadow-card">
      <header className="flex items-start gap-3 border-b border-border px-5 py-4">
        <div className="rounded-md bg-surface-alt p-2">
          <Plug className="h-4 w-4 text-muted-foreground" aria-hidden />
        </div>
        <div className="flex-1">
          <div className="font-heading text-[14px] font-bold">
            Claude Connector (MCP)
          </div>
          <div className="text-[12px] text-muted-foreground">
            Add Haven OS as a custom remote MCP connector in Claude. Claude
            handles OAuth + PKCE — no token to paste.
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-surface-alt/40 px-5 py-4 text-[12.5px] leading-relaxed text-foreground/85">
        <ol className="list-decimal space-y-1 pl-4">
          <li>
            In Claude (web or mobile), open <strong>Settings → Connectors</strong>
            and choose <strong>Add custom connector</strong>.
          </li>
          <li>
            Use the MCP server URL:{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11.5px]">
              {origin()}/api/mcp
            </code>
          </li>
          <li>
            Claude will open this site and ask you to approve the requested
            scopes — you&rsquo;ll see the approval screen on{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11.5px]">
              /mcp/consent
            </code>
            .
          </li>
          <li>
            Once approved, the connector is live for Claude (web and mobile).
            Revoke anytime below.
          </li>
        </ol>
      </div>

      <div className="px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          <Bot className="h-3 w-3" />
          Active connectors
        </div>
        {connectors.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">
            No Claude connectors authorized yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {connectors.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 py-3 text-[12.5px]"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium">Claude connector</div>
                  <div className="truncate text-[11.5px] text-muted-foreground">
                    Client {c.client_id.slice(0, 24)}… · authorized{" "}
                    {formatDate(c.created_at)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Scopes: {c.scopes.length > 0 ? c.scopes.join(", ") : "(none)"}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-500/10"
                  onClick={() => handleRevoke(c.id)}
                  disabled={revokingId === c.id}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function origin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
