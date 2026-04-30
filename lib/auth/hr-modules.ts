// Pure constant module — safe to import from anywhere.
// Lives outside lib/auth/permissions.ts because that file is "use server"
// and Next.js forbids non-async exports there.

export const HR_MODULES = [
  "people",
  "hiring",
  "surveys",
  "policies",
  "procedures",
] as const;
export type HrModule = (typeof HR_MODULES)[number];

export const HR_MODULE_LABELS: Record<HrModule, string> = {
  people: "People",
  hiring: "Hiring",
  surveys: "Surveys",
  policies: "Policies",
  procedures: "Procedures",
};
