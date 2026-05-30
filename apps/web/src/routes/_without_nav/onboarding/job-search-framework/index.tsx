import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import type { FrameworkInput } from "@app/schemas";
import JobSearchFrameworkForm from "@/shared/forms/JobSearchFrameworkForm";
import { FrameworkQueries, useSaveFramework } from "./-data";

export const Route = createFileRoute("/_without_nav/onboarding/job-search-framework/")({
  component: JobSearchFrameworkOnboardingPage,
});

function JobSearchFrameworkOnboardingPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const saveMutation = useSaveFramework();
  const [submitError, setSubmitError] = useState<string | undefined>();

  const frameworkQuery = useQuery(FrameworkQueries.latest(getToken));

  if (frameworkQuery.isSuccess && frameworkQuery.data?.framework?.isCustomized) {
    void navigate({ to: "/jobs" });
    return null;
  }

  const framework = frameworkQuery.data?.framework;

  async function handleSubmit(values: FrameworkInput) {
    setSubmitError(undefined);
    try {
      await saveMutation.mutateAsync(values);
      void navigate({ to: "/jobs", search: { framework_saved: "1" } });
    } catch {
      setSubmitError("Failed to save. Please try again.");
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-background flex flex-col items-center px-4 py-12">
      {/* decorative circles */}
      <div className="pointer-events-none fixed top-0 right-0 overflow-hidden" aria-hidden>
        <div className="absolute top-15 right-15 w-60 h-60 rounded-full bg-primary opacity-[0.05]" />
        <div className="absolute -top-5 right-5 w-30 h-30 rounded-full border-[1.5px] border-primary opacity-[0.12]" />
      </div>

      <div className="w-full max-w-275">
        <h1 className="text-[22px] font-semibold text-foreground tracking-tight mb-3">
          Set up your job search criteria
        </h1>
        <p className="text-[13px] text-(--text-secondary) leading-relaxed mb-6">
          Before searching for jobs, tell us what you're looking for. AI will use these criteria to
          filter and rank every job it finds — only showing you roles that actually match. You can
          update these anytime from Settings → Frameworks.
        </p>
        <div className="border-t border-border mb-8" />

        {frameworkQuery.isPending || !framework ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-(--surface-raised) animate-pulse" />
            ))}
          </div>
        ) : (
          <JobSearchFrameworkForm
            key={framework.version}
            initialValues={framework}
            onSubmit={handleSubmit}
            submitLabel="Save and continue"
            isSubmitting={saveMutation.isPending}
            submitError={submitError}
          />
        )}
      </div>
    </div>
  );
}
