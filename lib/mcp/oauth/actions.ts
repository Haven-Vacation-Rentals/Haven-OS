"use server";

/**
 * Server actions for the MCP connector settings UI.
 */

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/user";
import {
  listActiveTokensForUser,
  revokeTokenAndPair,
} from "./store";
import { getAdminClient } from "@/lib/supabase/admin";

export async function listMyMcpConnectors() {
  const user = await getCurrentUser();
  if (!user) return [];
  return listActiveTokensForUser(user.id);
}

export async function revokeMcpConnector(tokenId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not signed in");
  // Verify the token belongs to the caller before revoking, since
  // revokeTokenAndPair operates on the service role.
  const admin = getAdminClient();
  const { data } = await admin
    .from("mcp_oauth_tokens")
    .select("id, profile_id")
    .eq("id", tokenId)
    .maybeSingle();
  if (!data || data.profile_id !== user.id) {
    throw new Error("Token not found");
  }
  await revokeTokenAndPair(tokenId);
  revalidatePath("/settings/api-tokens");
}
