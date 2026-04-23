import { NewProjectForm } from "@/components/onboarding/new-project-form";

export const dynamic = "force-dynamic";

export default function NewOnboardingProjectPage() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold">Start a new onboarding project</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This will spawn the full task template (29 parent tasks with subtasks, checklists, and
          key-date milestones) under the new project.
        </p>
      </div>
      <NewProjectForm />
    </div>
  );
}
