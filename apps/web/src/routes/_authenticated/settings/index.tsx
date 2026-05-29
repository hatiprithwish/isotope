import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { CompanyFrameworkFormInputs, Framework } from "@app/schemas";
import { CompanyResearchFrameworkForm } from "@/shared/forms/CompanyResearchFrameworkForm";
import { FrameworksQueries, useGenerateFramework, useSaveFramework } from "../onboarding/-data";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: SettingsPage,
});

type FrameworkStep = "view" | "form" | "review";

function SettingsPage() {
  const { getToken } = useAuth();
  const generateMutation = useGenerateFramework();
  const saveMutation = useSaveFramework();

  const latestQuery = useQuery(FrameworksQueries.companyLatest(getToken));
  const versionsQuery = useQuery(FrameworksQueries.companyVersions(getToken));

  const [step, setStep] = useState<FrameworkStep>("view");
  const [savedFormInputs, setSavedFormInputs] = useState<CompanyFrameworkFormInputs | null>(null);
  const [generatedText, setGeneratedText] = useState("");
  const [editedText, setEditedText] = useState("");
  const [generateError, setGenerateError] = useState<string | undefined>();
  const [saveError, setSaveError] = useState<string | undefined>();

  const latestFramework = latestQuery.data?.framework;
  const versions = versionsQuery.data?.frameworks ?? [];

  function handleEditClick() {
    if (latestFramework?.formInputs) {
      try {
        const parsed = JSON.parse(latestFramework.formInputs) as CompanyFrameworkFormInputs;
        setSavedFormInputs(parsed);
      } catch {
        setSavedFormInputs(null);
      }
    }
    setStep("form");
  }

  function handleRestoreVersion(f: Framework) {
    setEditedText(f.content);
    setGeneratedText(f.content);
    setStep("review");
  }

  async function handleGenerate(inputs: CompanyFrameworkFormInputs) {
    setGenerateError(undefined);
    try {
      const result = await generateMutation.mutateAsync({ formInputs: inputs });
      if (result.frameworkText) {
        setSavedFormInputs(inputs);
        setGeneratedText(result.frameworkText);
        setEditedText(result.frameworkText);
        setStep("review");
      } else {
        setGenerateError("Generation returned no text. Please try again.");
      }
    } catch {
      setGenerateError("Failed to generate framework. Please try again.");
    }
  }

  async function handleSave() {
    setSaveError(undefined);
    try {
      await saveMutation.mutateAsync({
        content: editedText,
        formInputs: savedFormInputs ?? undefined,
        isCustomized: editedText !== generatedText,
      });
      toast.success("Framework saved");
      setStep("view");
    } catch {
      setSaveError("Failed to save framework. Please try again.");
    }
  }

  return (
    <div className="max-w-[860px] mx-auto px-8 py-8 flex flex-col gap-8">
      <div>
        <h1 className="text-[16px] font-semibold text-foreground">Settings</h1>
      </div>

      {/* Frameworks section */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-foreground">Company Research Framework</h2>
          {step === "view" && latestFramework && (
            <button
              type="button"
              onClick={handleEditClick}
              className="h-[31px] px-[13px] rounded-lg border border-border text-[13px] font-medium text-(--text-secondary) hover:text-foreground hover:bg-(--surface-raised) transition-colors"
            >
              Edit framework
            </button>
          )}
          {(step === "form" || step === "review") && (
            <button
              type="button"
              onClick={() => setStep("view")}
              className="flex items-center gap-1.5 h-[31px] px-[13px] rounded-lg border border-border text-[13px] font-medium text-(--text-secondary) hover:text-foreground hover:bg-(--surface-raised) transition-colors"
            >
              <ArrowLeftIcon size={13} />
              Cancel
            </button>
          )}
        </div>

        {/* View: current framework */}
        {step === "view" && (
          <>
            {latestQuery.isPending && (
              <div className="rounded-xl bg-(--surface-raised) h-32 animate-pulse" />
            )}
            {latestQuery.isError && (
              <p className="text-[13px] text-destructive">Failed to load framework.</p>
            )}
            {latestQuery.isSuccess && !latestFramework && (
              <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center gap-4">
                <p className="text-[13px] text-(--text-secondary)">
                  No framework saved yet. Create one to start AI company research.
                </p>
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="h-[31px] px-[13px] rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity"
                >
                  Create framework
                </button>
              </div>
            )}
            {latestFramework && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-(--text-secondary)">
                    Version {latestFramework.version}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Last saved: {formatRelativeTime(latestFramework.createdAt)}
                  </span>
                </div>

                {/* Framework text read-only */}
                <div className="rounded-r-lg border border-border border-l-[3px] border-l-(--ai-border) bg-(--ai-bg) p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-[11px] text-(--ai)">✦</span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-(--ai-text)">
                      Active framework
                    </span>
                  </div>
                  <pre className="text-[13px] leading-[1.75] text-foreground whitespace-pre-wrap font-sans">
                    {latestFramework.content}
                  </pre>
                </div>

                {/* Version history */}
                {versions.length > 1 && (
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                      Version history
                    </h3>
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      {versions.map((v, i) => (
                        <div
                          key={v.id}
                          className={`flex items-center gap-3 px-4 py-3 ${
                            i < versions.length - 1 ? "border-b border-border" : ""
                          } ${v.id === latestFramework.id ? "bg-(--surface-raised)" : ""}`}
                        >
                          <span className="text-[12px] font-medium text-foreground w-12">
                            v{v.version}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex-1">
                            {formatRelativeTime(v.createdAt)}
                          </span>
                          {v.isCustomized && (
                            <span className="text-[10px] font-semibold uppercase tracking-[0.05em] text-(--text-secondary)">
                              Edited
                            </span>
                          )}
                          {v.id !== latestFramework.id && (
                            <button
                              type="button"
                              onClick={() => handleRestoreVersion(v)}
                              className="h-[25px] px-3 rounded-lg border border-border text-[12px] font-medium text-(--text-secondary) hover:text-foreground hover:bg-(--surface-raised) transition-colors"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Form step */}
        {step === "form" && (
          <CompanyResearchFrameworkForm
            initialValues={savedFormInputs ?? undefined}
            onGenerate={handleGenerate}
            isGenerating={generateMutation.isPending}
            generateError={generateError}
            context="settings"
          />
        )}

        {/* Review step */}
        {step === "review" && (
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-[14px] font-semibold text-foreground">Review generated text</h3>
              <p className="text-[12px] leading-[1.55] text-(--text-secondary) mt-1">
                Edit inline or go back to adjust the form.
              </p>
            </div>

            <div className="rounded-r-lg border border-border border-l-[3px] border-l-(--ai-border) bg-(--ai-bg) p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[11px] text-(--ai)">✦</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-(--ai-text)">
                  Generated framework · {editedText.length} chars
                </span>
              </div>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full min-h-[360px] bg-transparent text-[13px] leading-[1.75] text-foreground resize-none focus:outline-none"
                spellCheck={false}
              />
            </div>

            {saveError && (
              <div className="rounded-lg bg-(--danger-bg) border border-destructive px-4 py-3 text-[13px] text-(--danger-text)">
                {saveError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("form")}
                className="flex items-center gap-1.5 h-[31px] px-[13px] rounded-lg border border-border text-[13px] font-medium text-(--text-secondary) hover:text-foreground hover:bg-(--surface-raised) transition-colors"
              >
                <ArrowLeftIcon size={13} />
                Back to form
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 h-[31px] px-[13px] rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saveMutation.isPending ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save framework"
                )}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function formatRelativeTime(isoString: string): string {
  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diff = Math.round((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;

  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
