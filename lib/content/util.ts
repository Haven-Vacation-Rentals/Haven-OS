/**
 * Haven OS — Content/Paid-Ads small text helpers.
 *
 * Word count + reading-time estimate, used by the script editor and the
 * article (script) mutations. Kept dependency-free.
 */

export function countWords(text: string): number {
  if (!text) return 0;
  const cleaned = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(" ").filter(Boolean).length;
}

export function readingTimeMin(words: number): number {
  return Math.max(1, Math.round(words / 220));
}
