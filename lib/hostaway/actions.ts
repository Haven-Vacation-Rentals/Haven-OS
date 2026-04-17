"use server";

import { testConnection } from "./client";

export type TestConnectionResult =
  | { ok: true; tokenPreview: string }
  | { ok: false; error: string; status?: number };

export async function testHostawayConnection(): Promise<TestConnectionResult> {
  return await testConnection();
}
