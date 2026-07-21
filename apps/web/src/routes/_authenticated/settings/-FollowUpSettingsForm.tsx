import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { Field, FieldError } from "@/shadcn/ui/field";
import * as Schemas from "@app/schemas";

interface Props {
  initialValues: Schemas.FollowUpSettingsInput;
  onSubmit: (values: Schemas.FollowUpSettingsInput) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
  submitError?: string;
}

const MAX_STEPS = 12;

function FieldSub({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-(--text-secondary) mb-2">{children}</p>;
}

// Digits-only text input (no native number spinner) — buffers raw text locally so the field can go
// momentarily empty while typing/backspacing, but only ever commits a valid positive integer upward.
function DaysInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(value));

  function handleChange(raw: string) {
    const digitsOnly = raw.replace(/\D/g, "");
    setText(digitsOnly);
    if (digitsOnly !== "") onChange(parseInt(digitsOnly, 10));
  }

  function handleBlur() {
    if (text === "") {
      setText(String(value));
      return;
    }
    setText(String(parseInt(text, 10)));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      className="w-20 h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground focus:outline-none focus:border-primary"
    />
  );
}

// ── Step offsets repeater ─────────────────────────────────
function StepOffsetsRepeater({
  stepOffsetDays,
  onChange,
}: {
  stepOffsetDays: number[];
  onChange: (v: number[]) => void;
}) {
  function update(index: number, value: number) {
    onChange(stepOffsetDays.map((d, i) => (i === index ? value : d)));
  }
  function remove(index: number) {
    onChange(stepOffsetDays.filter((_, i) => i !== index));
  }
  function addRow() {
    onChange([...stepOffsetDays, 7]);
  }

  return (
    <div className="space-y-3">
      {stepOffsetDays.length === 0 && (
        <p className="text-[12px] text-(--text-secondary) italic">
          No follow-ups configured — sent messages will not get automatic follow-up reminders.
        </p>
      )}
      {stepOffsetDays.map((days, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card"
        >
          <span className="w-24 shrink-0 text-[13px] font-medium text-foreground">
            Follow-up {i + 1}
          </span>
          <span className="w-28 shrink-0 text-[12px] text-(--text-secondary)">
            {i === 0 ? "after" : "after another"}
          </span>
          <DaysInput value={days} onChange={(v) => update(i, v)} />
          <span className="text-[12px] text-(--text-secondary)">days</span>
          <button
            type="button"
            onClick={() => remove(i)}
            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors ml-auto"
            aria-label={`Remove follow-up ${i + 1}`}
          >
            <XIcon size={13} />
          </button>
        </div>
      ))}
      {stepOffsetDays.length < MAX_STEPS && (
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-[12px] font-medium text-(--text-secondary) hover:text-foreground transition-colors mt-1"
        >
          <PlusIcon size={13} />
          Add follow-up
        </button>
      )}
      {stepOffsetDays.length >= MAX_STEPS && (
        <p className="text-[12px] text-(--text-secondary)">
          Maximum of {MAX_STEPS} follow-up steps reached.
        </p>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────
export default function FollowUpSettingsForm({
  initialValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  submitError,
}: Props) {
  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onSubmit: Schemas.ZFollowUpSettingsInput,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(e: React.SyntheticEvent) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="stepOffsetDays">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid} className="mb-4">
              <FieldSub>
                Each step's delay is relative to when the previous message was actually sent — not
                the original send date.
              </FieldSub>
              <StepOffsetsRepeater
                stepOffsetDays={field.state.value}
                onChange={(v) => field.handleChange(v)}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      {submitError && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-(--danger-bg) border border-destructive text-[13px] text-destructive">
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-9.5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {isSubmitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
