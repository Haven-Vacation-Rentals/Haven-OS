import { listProjects } from "@/lib/onboarding/actions";
import { ProjectsDirectory } from "@/components/onboarding/projects-directory";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const projects = await listProjects();
  return <ProjectsDirectory projects={projects} />;
}
