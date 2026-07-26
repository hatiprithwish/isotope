import { useForm } from "@tanstack/react-form";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { Field, FieldError } from "@/shadcn/ui/field";
import * as Schemas from "@app/schemas";

interface Props {
  initialValues: Schemas.ContactRolePillsInput;
  onSubmit: (values: Schemas.ContactRolePillsInput) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
  submitError?: string;
}

const MAX_PILLS = 5;

function FieldSub({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-(--text-secondary) mb-2">{children}</p>;
}

// ── Pill labels repeater ─────────────────────────────────
function PillLabelsRepeater({
  pillLabels,
  onChange,
}: {
  pillLabels: string[];
  onChange: (v: string[]) => void;
}) {
  function update(index: number, value: string) {
    onChange(pillLabels.map((l, i) => (i === index ? value : l)));
  }
  function remove(index: number) {
    onChange(pillLabels.filter((_, i) => i !== index));
  }
  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...pillLabels];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onChange(next);
  }
  function moveDown(index: number) {
    if (index === pillLabels.length - 1) return;
    const next = [...pillLabels];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onChange(next);
  }
  function addRow() {
    onChange([...pillLabels, ""]);
  }

  return (
    <div className="space-y-3">
      {pillLabels.length === 0 && (
        <p className="text-[12px] text-(--text-secondary) italic">
          No quick-fill pills configured — the Title field in Add Contact will show none.
        </p>
      )}
      {pillLabels.map((label, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card"
        >
          <input
            type="text"
            value={label}
            onChange={(e) => update(i, e.target.value)}
            placeholder="e.g. Tech"
            className="flex-1 h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />
          <button
            type="button"
            onClick={() => moveUp(i)}
            disabled={i === 0}
            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
            aria-label={`Move ${label || "pill"} up`}
          >
            <ArrowUpIcon size={13} />
          </button>
          <button
            type="button"
            onClick={() => moveDown(i)}
            disabled={i === pillLabels.length - 1}
            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
            aria-label={`Move ${label || "pill"} down`}
          >
            <ArrowDownIcon size={13} />
          </button>
          <button
            type="button"
            onClick={() => remove(i)}
            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors"
            aria-label={`Remove ${label || "pill"}`}
          >
            <XIcon size={13} />
          </button>
        </div>
      ))}
      {pillLabels.length < MAX_PILLS && (
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-[12px] font-medium text-(--text-secondary) hover:text-foreground transition-colors mt-1"
        >
          <PlusIcon size={13} />
          Add pill
        </button>
      )}
      {pillLabels.length >= MAX_PILLS && (
        <p className="text-[12px] text-(--text-secondary)">Maximum of {MAX_PILLS} pills reached.</p>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────
export default function ContactRolePillsForm({
  initialValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  submitError,
}: Props) {
  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onSubmit: Schemas.ZContactRolePillsInput,
    },
    onSubmit: async ({ value }) => {
      await onSubmit({ pillLabels: value.pillLabels.map((l) => l.trim()).filter(Boolean) });
    },
  });

  return (
    <form
      onSubmit={(e: React.SyntheticEvent) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="pillLabels">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid} className="mb-4">
              <FieldSub>
                These show as quick-fill buttons on the Title field when adding or editing a
                contact, in the order you set here.
              </FieldSub>
              <PillLabelsRepeater
                pillLabels={field.state.value}
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
