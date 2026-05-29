import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { CompanyFrameworkFormInputs } from "@app/schemas";
import { CompanyResearchFrameworkForm } from "@/shared/forms/CompanyResearchFrameworkForm";
import { useGenerateFramework, useSaveFramework } from "./-data";

export const Route = createFileRoute("/_authenticated/onboarding/step-1")({
  component: OnboardingStep1Page,
});

type Step = "form" | "review" | "saved";

function OnboardingStep1Page() {
  const navigate = useNavigate();
  const generateMutation = useGenerateFramework();
  const saveMutation = useSaveFramework();

  const [step, setStep] = useState<Step>("form");
  const [savedFormInputs, setSavedFormInputs] = useState<CompanyFrameworkFormInputs | null>(null);
  const [generatedText, setGeneratedText] = useState("");
  const [editedText, setEditedText] = useState("");
  const [generateError, setGenerateError] = useState<string | undefined>();
  const [saveError, setSaveError] = useState<string | undefined>();

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
      setStep("saved");
      navigate({ to: "/today" });
    } catch {
      setSaveError("Failed to save framework. Please try again.");
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="shrink-0 flex items-center gap-4 px-8 py-5 border-b border-border bg-card">
        <span className="text-[13px] font-semibold text-foreground leading-none tracking-[-0.012em]">
          Isotope<sup className="text-xxxs font-semibold text-primary align-super ml-0.5">¹³</sup>
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Setup wizard
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-2 rounded-full transition-all duration-200 ${
                n <= 1 ? "bg-primary" : "bg-border"
              } ${n === 1 ? "w-[22px]" : "w-2"}`}
            />
          ))}
          <span className="ml-3 text-[12px] font-medium text-(--text-secondary)">Step 1 of 3</span>
        </div>
      </header>

      {step === "form" && (
        <div className="flex-1 overflow-auto">
          <div className="relative">
            {/* Decorative circles */}
            <div className="pointer-events-none absolute top-0 right-0 overflow-hidden w-64 h-64">
              <div className="absolute top-[-50px] right-[-50px] w-[220px] h-[220px] rounded-full bg-primary opacity-[0.05]" />
              <div className="absolute top-[40px] right-[60px] w-[70px] h-[70px] rounded-full border-[1.5px] border-primary opacity-[0.1]" />
            </div>

            <div className="max-w-[920px] mx-auto px-8 pt-10 pb-32 relative z-10">
              <div className="mb-8">
                <h1 className="text-[24px] font-semibold text-foreground leading-[1.25] tracking-[-0.012em]">
                  Company Research framework
                </h1>
                <p className="text-[14px] leading-[1.6] text-(--text-secondary) mt-2 max-w-[620px]">
                  How AI evaluates every company in your pipeline. Pre-filled with Appendix A
                  defaults — adjust to your situation. You can change everything later.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
                <div>
                  <CompanyResearchFrameworkForm
                    onGenerate={handleGenerate}
                    isGenerating={generateMutation.isPending}
                    generateError={generateError}
                    context="onboarding"
                  />
                </div>

                {/* Right rail example — desktop only */}
                <aside className="hidden lg:block">
                  <div className="sticky top-0 rounded-r-lg border border-border border-l-[3px] border-l-(--ai-border) bg-(--ai-bg) p-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <span className="text-[11px] text-(--ai)">✦</span>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-(--ai-text)">
                        See an example
                      </span>
                    </div>
                    <p className="text-[12px] leading-[1.65] text-foreground">
                      When you set{" "}
                      <strong className="text-(--ai-text)">Work-Life Balance weight to 5</strong>,
                      AI flags any company where Glassdoor WLB is below 3.8 as a likely miss.
                    </p>
                    <p className="text-[12px] leading-[1.65] text-(--text-secondary) mt-2.5">
                      When AI scores a criterion 3 with <em>low confidence</em>, it surfaces an
                      amber dot on the company panel.
                    </p>
                    <p className="text-[12px] leading-[1.65] text-(--text-secondary) mt-2.5">
                      Auto No-Go ON means a single zero overrides the total. Useful for hard culture
                      lines.
                    </p>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="flex-1 overflow-auto">
          <div className="max-w-[760px] mx-auto px-8 pt-10 pb-32">
            <div className="mb-6">
              <h1 className="text-[20px] font-semibold text-foreground leading-[1.3] tracking-[-0.008em]">
                AI will use this to score every company.
              </h1>
              <p className="text-[13px] leading-[1.55] text-(--text-secondary) mt-1.5">
                Edit inline or go back to adjust the form.
              </p>
            </div>

            <div className="rounded-r-lg border border-border border-l-[3px] border-l-(--ai-border) bg-(--ai-bg) p-4 mb-6">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[11px] text-(--ai)">✦</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-(--ai-text)">
                  Generated framework · {editedText.length} chars
                </span>
              </div>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full min-h-[400px] bg-transparent text-[13px] leading-[1.75] text-foreground resize-none focus:outline-none"
                spellCheck={false}
              />
            </div>

            <div className="rounded-xl border border-border bg-(--accent-bg) p-4">
              <p className="text-[13px] font-semibold text-(--accent-text)">
                Looks good. Save and continue.
              </p>
              <p className="text-[12px] leading-[1.55] text-foreground mt-1.5">
                This becomes v1 of your Company Research framework. You can edit it any time in
                Settings — the last 5 versions are restorable.
              </p>
            </div>

            {saveError && (
              <div className="mt-4 rounded-lg bg-(--danger-bg) border border-destructive px-4 py-3 text-[13px] text-(--danger-text)">
                {saveError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sticky footer */}
      <div className="shrink-0 flex items-center gap-3 px-8 py-4 bg-card border-t border-border">
        {step === "form" && (
          <>
            <button
              type="button"
              className="h-[31px] px-[13px] rounded-lg border border-border text-[13px] font-medium text-(--text-secondary) hover:text-foreground hover:bg-(--surface-raised) transition-colors"
            >
              Skip this framework
            </button>
            <span className="flex-1 text-[12px] text-muted-foreground">
              Skipped frameworks block AI jobs until completed.
            </span>
          </>
        )}

        {step === "review" && (
          <>
            <button
              type="button"
              onClick={() => setStep("form")}
              className="flex items-center gap-1.5 h-[31px] px-[13px] rounded-lg border border-border text-[13px] font-medium text-(--text-secondary) hover:text-foreground hover:bg-(--surface-raised) transition-colors"
            >
              <ArrowLeftIcon size={13} />
              Back to form
            </button>
            <div className="flex-1" />
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
          </>
        )}
      </div>
    </div>
  );
}
