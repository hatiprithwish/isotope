import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/shadcn/ui/button";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useState } from "react";
import { toast } from "sonner";
import { CopyIcon, CheckIcon } from "@phosphor-icons/react";
import type { FrameworkInput, FollowUpSettingsInput } from "@app/schemas";
import JobSearchFrameworkForm from "@/shared/forms/JobSearchFrameworkForm";
import {
  FrameworkQueries,
  useSaveFramework,
} from "../../_without_nav/onboarding/job-search-framework/-data";
import { FollowUpSettingsQueries, useSaveFollowUpSettings } from "./-data";
import FollowUpSettingsForm from "./-FollowUpSettingsForm";
import Utilities from "@/utils";
import { apiClient } from "@/providers/apiClient";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: SettingsFrameworksPage,
});

type Tab = "job-search" | "followups" | "company-research" | "account";

function useInboundAddress(getToken: () => Promise<string | null>) {
  return useQuery(
    queryOptions({
      queryKey: ["settings", "inbound-address"],
      queryFn: ({ signal }) =>
        apiClient<{ isSuccess: boolean; address: string }>("/settings/inbound-address", getToken, {
          signal,
        }),
    }),
  );
}

function AccountTab({ getToken }: { getToken: () => Promise<string | null> }) {
  const { data, isPending } = useInboundAddress(getToken);
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!data?.address) return;
    void navigator.clipboard.writeText(data.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="px-6 py-6 max-w-xl">
      <h2 className="text-[13px] font-semibold text-foreground mb-1">Job alerts</h2>
      <p className="text-[12px] text-(--text-secondary) mb-4">
        Forward any job alert email here and we'll automatically import the listings for review.
      </p>

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
          Forward job alert emails to
        </span>
        <div className="flex items-center gap-2 px-3 py-2.5 bg-card border border-border rounded-lg">
          {isPending ? (
            <div className="h-4 flex-1 rounded bg-(--surface-raised) animate-pulse" />
          ) : (
            <span className="text-[13px] font-medium text-foreground flex-1 select-all break-all">
              {data?.address ?? "—"}
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            disabled={isPending || !data?.address}
            title={copied ? "Copied!" : "Copy address"}
          >
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function FollowUpSettingsTab({ getToken }: { getToken: () => Promise<string | null> }) {
  const [submitError, setSubmitError] = useState<string | undefined>();
  const settingsQuery = useQuery(FollowUpSettingsQueries.latest(getToken));
  const saveMutation = useSaveFollowUpSettings();

  const settings = settingsQuery.data?.settings;

  async function handleSubmit(values: FollowUpSettingsInput) {
    setSubmitError(undefined);
    try {
      await saveMutation.mutateAsync(values);
      toast.success("Follow-up settings updated", { duration: 3000 });
    } catch {
      setSubmitError("Failed to save. Please try again.");
    }
  }

  if (settingsQuery.isPending) {
    return (
      <div className="px-6 py-10 max-w-2xl mx-auto space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-9 rounded-lg bg-(--surface-raised) animate-pulse" />
        ))}
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <div className="px-6 py-10 max-w-2xl mx-auto">
        <div className="text-[13px] text-destructive">Failed to load follow-up settings.</div>
      </div>
    );
  }

  return (
    <div className="px-6 py-10 max-w-2xl mx-auto">
      <h2 className="text-[15px] font-semibold text-foreground mb-1.5">Follow-up cadence</h2>
      <p className="text-[13px] text-(--text-secondary) mb-8">
        Configure how many automatic follow-up reminders each contact gets after a sent message, and
        how many days to wait before each one.
      </p>

      <FollowUpSettingsForm
        key={settings?.version ?? 0}
        initialValues={{ stepOffsetDays: settings?.stepOffsetDays ?? [] }}
        onSubmit={handleSubmit}
        submitLabel="Save cadence"
        isSubmitting={saveMutation.isPending}
        submitError={submitError}
      />
    </div>
  );
}

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
    { key: "followups", label: "Follow-ups" },
    { key: "company-research", label: "Company Research" },
    { key: "account", label: "Account" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* topbar */}
      <header className="h-13 px-6 flex items-center border-b border-border bg-sidebar shrink-0">
        <span className="text-base font-semibold text-foreground tracking-tight">Frameworks</span>
      </header>

      {/* tabs */}
      <div className="px-6 pt-0 flex gap-6 border-b border-border bg-background shrink-0">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                "h-14 text-[13px] font-medium border-b-2 -mb-px transition-colors",
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setNoticeDismissed(true)}
                  aria-label="Dismiss"
                  className="shrink-0 text-(--warning-text) hover:bg-(--warning-bg) hover:text-(--warning-text) mt-0.5"
                >
                  ×
                </Button>
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

        {activeTab === "followups" && <FollowUpSettingsTab getToken={getToken} />}

        {activeTab === "company-research" && (
          <div className="flex items-center justify-center h-64">
            <p className="text-[13px] text-(--text-secondary)">Coming soon</p>
          </div>
        )}

        {activeTab === "account" && <AccountTab getToken={getToken} />}
      </div>
    </div>
  );
}
