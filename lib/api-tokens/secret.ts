/**
 * PAT secret generation + hashing.
 *
 * Format: `hvn_pat_<base64url(32 random bytes)>`. The string after the
 * second underscore is ~43 characters, giving 256 bits of entropy.
 *
 * Hashing: sha256 of the raw token, hex-encoded. Constant-time compare
 * via timingSafeEqual when verifying — see `verifyTokenHash`.
 *
 * NOTE: We deliberately don't HMAC the token with a separate secret.
 * The raw token is itself a high-entropy random value; a sha256 of it
 * is enough to make the stored hash useless if the DB is leaked
 * (an attacker can't reverse it to a usable bearer). Adding an HMAC
 * pepper would only matter if the raw tokens themselves had structure
 * that could be guessed, which they don't.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const TOKEN_PREFIX = "hvn_pat_";
export const TOKEN_PREFIX_DISPLAY_LEN = TOKEN_PREFIX.length + 4; // "hvn_pat_3f9c"

export interface GeneratedToken {
  /** The raw bearer the user must save. Format: hvn_pat_<random>. */
  raw: string;
  /** Visible prefix safe to persist — shown in the tokens list. */
  prefix: string;
  /** sha256(raw), hex. */
  hash: string;
}

export function generateToken(): GeneratedToken {
  const random = randomBytes(32).toString("base64url");
  const raw = `${TOKEN_PREFIX}${random}`;
  return {
    raw,
    prefix: raw.slice(0, TOKEN_PREFIX_DISPLAY_LEN),
    hash: hashToken(raw),
  };
}

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Constant-time compare of two hex-encoded sha256 hashes.
 */
export function verifyTokenHash(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length || ab.length === 0) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Cheap shape check before hitting the DB. Bearer tokens that don't
 * match the format are rejected immediately.
 */
export function looksLikePat(raw: string): boolean {
  if (!raw.startsWith(TOKEN_PREFIX)) return false;
  // 32 random bytes → ~43 base64url chars. Allow 30..64 to be lenient.
  const tail = raw.slice(TOKEN_PREFIX.length);
  return /^[A-Za-z0-9_-]{30,64}$/.test(tail);
}
