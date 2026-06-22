"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  getPermissions,
  requireAdminOrAbove,
  requireSignedIn,
} from "@/lib/auth/permissions";

export type CleanTransitionStatus =
  | "pending"
  | "needs_info"
  | "approved"
  | "rejected";

export type CleanTransitionSubmission = {
  id: string;
  property_name: string;
  address: string | null;
  owner_name: string | null;
  submitted_by_name: string | null;
  cleaning_contact: string | null;
  transition_date: string | null;
  old_price: number;
  new_price: number;
  price_delta: number;
  price_delta_pct: number | null;
  notes: string | null;
  status: CleanTransitionStatus;
  review_note: string | null;
  submitted_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CleanTransitionCounts = Record<CleanTransitionStatus, number> & {
  total: number;
};

export type CreateCleanTransitionInput = {
  property_name: string;
  address?: string;
  owner_name?: string;
  submitted_by_name?: string;
  cleaning_contact?: string;
  transition_date?: string;
  old_price: number;
  new_price: number;
  notes?: string;
};

export type ReviewCleanTransitionInput = {
  id: string;
  status: CleanTransitionStatus;
  review_note?: string;
};

export type CleanTransitionResult = { ok: true } | { ok: false; error: string };

async function db() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

function cleanText(value: unknown, limit = 500): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text ? text.slice(0, limit) : null;
}

function cleanDate(value: unknown): string | null {
  const text = cleanText(value, 40);
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function cleanPrice(value: unknown): number | null {
  const num =
    typeof value === "number"
      ? value
      : Number(
          String(value ?? "")
            .replace(/[$,]/g, "")
            .trim(),
        );
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100) / 100;
}

export async function getCleanTransitionData(): Promise<{
  submissions: CleanTransitionSubmission[];
  counts: CleanTransitionCounts;
  canReview: boolean;
}> {
  await requireSignedIn();
  const supabase = await db();
  const [{ data, error }, permissions] = await Promise.all([
    supabase
      .from("clean_transition_submissions")
      .select("*")
      .order("created_at", { ascending: false }),
    getPermissions(),
  ]);
  if (error) throw error;

  const submissions = (data ?? []) as CleanTransitionSubmission[];
  const counts: CleanTransitionCounts = {
    pending: 0,
    needs_info: 0,
    approved: 0,
    rejected: 0,
    total: submissions.length,
  };
  for (const submission of submissions) {
    counts[submission.status] += 1;
  }

  return {
    submissions,
    counts,
    canReview: permissions.is_admin_or_above,
  };
}

export async function createCleanTransitionSubmission(
  input: CreateCleanTransitionInput,
): Promise<CleanTransitionResult> {
  try {
    const userId = await requireSignedIn();
    const propertyName = cleanText(input.property_name, 180);
    const oldPrice = cleanPrice(input.old_price);
    const newPrice = cleanPrice(input.new_price);

    if (!propertyName) return { ok: false, error: "Property name is required" };
    if (oldPrice === null || newPrice === null) {
      return {
        ok: false,
        error: "Old price and new price must be valid numbers",
      };
    }

    const supabase = await db();
    const { error } = await supabase
      .from("clean_transition_submissions")
      .insert({
        property_name: propertyName,
        address: cleanText(input.address, 240),
        owner_name: cleanText(input.owner_name, 140),
        submitted_by_name: cleanText(input.submitted_by_name, 140),
        cleaning_contact: cleanText(input.cleaning_contact, 180),
        transition_date: cleanDate(input.transition_date),
        old_price: oldPrice,
        new_price: newPrice,
        notes: cleanText(input.notes, 1200),
        submitted_by: userId,
      });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/onboarding/clean-transition");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to submit clean transition request",
    };
  }
}

export async function reviewCleanTransitionSubmission(
  input: ReviewCleanTransitionInput,
): Promise<CleanTransitionResult> {
  try {
    const reviewerId = await requireAdminOrAbove();
    if (!input.id) return { ok: false, error: "Submission id is required" };
    if (
      !["pending", "needs_info", "approved", "rejected"].includes(input.status)
    ) {
      return { ok: false, error: "Invalid status" };
    }

    const supabase = await db();
    const { error } = await supabase
      .from("clean_transition_submissions")
      .update({
        status: input.status,
        review_note: cleanText(input.review_note, 1200),
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", input.id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/onboarding/clean-transition");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to update clean transition request",
    };
  }
}
