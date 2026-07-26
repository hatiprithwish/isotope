import { useState } from "react";
import type * as Schemas from "@app/schemas";

interface Props {
  templates: Schemas.MessageTemplate[];
  stepOffsetDays: number[];
  roleTypeLabels: string[];
  onSave: (entry: Schemas.SaveMessageTemplateApiRequest) => Promise<void>;
  savingKey: string | null;
}

function findBody(
  templates: Schemas.MessageTemplate[],
  step: number,
  variantLabel: string | null,
): string {
  return templates.find((t) => t.step === step && t.variantLabel === variantLabel)?.body ?? "";
}

function StepSlot({
  label,
  initialBody,
  onSave,
  isSaving,
}: {
  label: string;
  initialBody: string;
  onSave: (body: string) => Promise<void>;
  isSaving: boolean;
}) {
  const [body, setBody] = useState(initialBody);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaved(false);
    await onSave(body);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="px-4 py-3 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-foreground">{label}</span>
        {saved && <span className="text-[11px] text-primary">Saved</span>}
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="e.g. Hi [Name], following up on my note to [Company]."
        rows={4}
        className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground leading-[1.65] resize-none outline-none focus:border-primary transition-colors placeholder:text-muted-foreground mb-2"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {isSaving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

export default function MessageTemplatesForm({
  templates,
  stepOffsetDays,
  roleTypeLabels,
  onSave,
  savingKey,
}: Props) {
  const stepCount = stepOffsetDays.length + 1;

  return (
    <div className="space-y-6">
      <p className="text-[12px] text-(--text-secondary)">
        Use <code className="text-foreground">[Name]</code> and{" "}
        <code className="text-foreground">[Company]</code> as placeholders — they're substituted
        automatically when you log a message. Step count follows your configured follow-up cadence
        in the Follow-ups tab.
      </p>

      {Array.from({ length: stepCount }, (_, step) => {
        const stepLabel = step === 0 ? "Day 0 (initial outbound)" : `Follow-up ${step}`;
        const variants: { variantLabel: string | null; label: string }[] =
          step === 0
            ? [
                ...roleTypeLabels.map((l) => ({ variantLabel: l, label: `${stepLabel} — ${l}` })),
                { variantLabel: null, label: `${stepLabel} — Default` },
              ]
            : [{ variantLabel: null, label: stepLabel }];

        return (
          <div key={step} className="space-y-2">
            {step > 0 && <h3 className="text-[13px] font-semibold text-foreground">{stepLabel}</h3>}
            {variants.map((v) => {
              const key = `${step}:${v.variantLabel ?? ""}`;
              return (
                <StepSlot
                  key={key}
                  label={step === 0 ? v.label : "Body"}
                  initialBody={findBody(templates, step, v.variantLabel)}
                  isSaving={savingKey === key}
                  onSave={(body) => onSave({ step, variantLabel: v.variantLabel, body })}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
