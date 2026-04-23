import { notFound } from "next/navigation";
import { getProjectTree } from "@/lib/onboarding/actions";
import { ProjectDetail } from "@/components/onboarding/project-detail";

export const dynamic = "force-dynamic";

export default async function OnboardingProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tree = await getProjectTree(id);
  if (!tree) return notFound();
  return <ProjectDetail tree={tree} />;
}
