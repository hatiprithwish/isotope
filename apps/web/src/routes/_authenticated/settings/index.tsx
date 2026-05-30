import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useState } from "react";
import { toast } from "sonner";
import type { FrameworkInput } from "@app/schemas";
import JobSearchFrameworkForm from "@/shared/forms/JobSearchFrameworkForm";
import {
  FrameworkQueries,
  useSaveFramework,
} from "../../_without_nav/onboarding/job-search-framework/-data";
import Utilities from "@/utils";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: SettingsFrameworksPage,
});

type Tab = "job-search" | "company-research" | "ab-testing";

function SettingsFrameworksPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("job-search");
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const frameworkQuery = useQuery(FrameworkQueries.latest(getToken));
  const saveMutation = useSaveFramework();

  const framework = frameworkQuery.data?.framework;

  async function handleSubmit(values: FrameworkInput) {
    setSubmitError(undefined);
    try {
      await saveMutation.mutateAsync(values);
      toast.success("Job search criteria updated", { duration: 3000 });
    } catch {
      setSubmitError("Failed to save. Please try again.");
    }
  }

  const showNotice = !noticeDismissed && framework != null && !framework.isCustomized;

  const TABS: { key: Tab; label: string }[] = [
    { key: "job-search", label: "Job Search" },
    { key: "company-research", label: "Company Research" },
    { key: "ab-testing", label: "A/B Testing" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* topbar */}
      <header className="h-13 px-6 flex items-center border-b border-border bg-sidebar shrink-0">
        <span className="text-base font-semibold text-foreground tracking-tight">Frameworks</span>
      </header>

      {/* tabs */}
      <div className="px-6 pt-0 flex gap-1 border-b border-border bg-background shrink-0">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                "h-9 px-4 text-[12px] font-medium border-b-2 -mb-px transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-(--text-secondary) hover:text-foreground",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* content */}
      <div className="flex-1 overflow-y-auto bg-background">
        {activeTab === "job-search" && (
          <div className="px-6 py-6">
            {showNotice && (
              <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-lg bg-(--warning-bg) border border-(--warning)">
                <p className="flex-1 text-[13px] text-(--warning-text)">
                  You're using default criteria. Update these to match your actual preferences — AI
                  will use them for every future job search.
                </p>
                <button
                  type="button"
                  onClick={() => setNoticeDismissed(true)}
                  className="shrink-0 text-(--warning-text) hover:opacity-70 transition-opacity mt-0.5"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            )}

            {framework && (
              <p className="text-[12px] text-(--text-secondary) mb-6">
                Last updated: {Utilities.relativeTime(framework.createdAt)} · Version{" "}
                {framework.version}
              </p>
            )}

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
                submitLabel="Save criteria"
                isSubmitting={saveMutation.isPending}
                submitError={submitError}
              />
            )}
          </div>
        )}

        {activeTab === "company-research" && (
          <div className="flex items-center justify-center h-64">
            <p className="text-[13px] text-(--text-secondary)">Coming soon</p>
          </div>
        )}

        {activeTab === "ab-testing" && (
          <div className="flex items-center justify-center h-64">
            <p className="text-[13px] text-(--text-secondary)">Coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}
