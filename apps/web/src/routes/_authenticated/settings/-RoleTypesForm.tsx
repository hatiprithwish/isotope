import { useForm } from "@tanstack/react-form";
import { StarIcon } from "@phosphor-icons/react";
import { Field, FieldError } from "@/shadcn/ui/field";
import * as Schemas from "@app/schemas";

interface Props {
  initialValues: Schemas.RoleTypesInput;
  onSubmit: (values: Schemas.RoleTypesInput) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
  submitError?: string;
}

const MAX_LABELS = 3;

function FieldSub({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-(--text-secondary) mb-2">{children}</p>;
}

function RoleTypesRepeater({
  labels,
  defaultLabel,
  onLabelsChange,
  onDefaultChange,
}: {
  labels: string[];
  defaultLabel: string | null;
  onLabelsChange: (v: string[]) => void;
  onDefaultChange: (v: string | null) => void;
}) {
  // Track the default by index, not label text — two rows can transiently hold the same
  // text while editing, and comparing by value would make both appear starred at once.
  const defaultIndex = defaultLabel == null ? -1 : labels.indexOf(defaultLabel);

  function update(index: number, value: string) {
    const wasDefault = index === defaultIndex;
    onLabelsChange(labels.map((l, i) => (i === index ? value : l)));
    if (wasDefault) onDefaultChange(value || null);
  }
  function remove(index: number) {
    const wasDefault = index === defaultIndex;
    onLabelsChange(labels.filter((_, i) => i !== index));
    if (wasDefault) onDefaultChange(null);
  }
  function addRow() {
    onLabelsChange([...labels, ""]);
  }

  return (
    <div className="space-y-3">
      {labels.length === 0 && (
        <p className="text-[12px] text-(--text-secondary) italic">
          No role types configured — job entries and Day-0 template variants will use a single
          default template.
        </p>
      )}
      {labels.map((label, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card"
        >
          <input
            type="text"
            value={label}
            onChange={(e) => update(i, e.target.value)}
            placeholder="e.g. Backend"
            className="flex-1 h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />
          <button
            type="button"
            onClick={() => onDefaultChange(label)}
            disabled={!label}
            className={[
              "w-7 h-7 flex items-center justify-center rounded transition-colors disabled:opacity-30 disabled:pointer-events-none",
              i === defaultIndex ? "text-primary" : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
            aria-label={i === defaultIndex ? `${label} is default` : `Set ${label} as default`}
            title="Default role type"
          >
            <StarIcon size={14} weight={i === defaultIndex ? "fill" : "regular"} />
          </button>
          <button
            type="button"
            onClick={() => remove(i)}
            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors text-[13px]"
            aria-label={`Remove ${label || "role type"}`}
          >
            ×
          </button>
        </div>
      ))}
      {labels.length < MAX_LABELS && (
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-[12px] font-medium text-(--text-secondary) hover:text-foreground transition-colors mt-1"
        >
          + Add role type
        </button>
      )}
      {labels.length >= MAX_LABELS && (
        <p className="text-[12px] text-(--text-secondary)">
          Maximum of {MAX_LABELS} role types reached.
        </p>
      )}
    </div>
  );
}

export default function RoleTypesForm({
  initialValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  submitError,
}: Props) {
  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onSubmit: Schemas.ZRoleTypesInput,
    },
    onSubmit: async ({ value }) => {
      const labels = value.labels.map((l) => l.trim()).filter(Boolean);
      const defaultLabel =
        value.defaultLabel && labels.includes(value.defaultLabel) ? value.defaultLabel : null;
      await onSubmit({ labels, defaultLabel });
    },
  });

  return (
    <form
      onSubmit={(e: React.SyntheticEvent) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="labels">
        {(labelsField) => {
          const isInvalid = labelsField.state.meta.isTouched && !labelsField.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid} className="mb-4">
              <FieldSub>
                Role types tag your job entries and drive the Day-0 message template variant. The
                starred one is used as the fallback when a contact's company has jobs of more than
                one type, or none tagged.
              </FieldSub>
              <form.Field name="defaultLabel">
                {(defaultField) => (
                  <RoleTypesRepeater
                    labels={labelsField.state.value}
                    defaultLabel={defaultField.state.value}
                    onLabelsChange={(v) => labelsField.handleChange(v)}
                    onDefaultChange={(v) => defaultField.handleChange(v)}
                  />
                )}
              </form.Field>
              {isInvalid && <FieldError errors={labelsField.state.meta.errors} />}
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
