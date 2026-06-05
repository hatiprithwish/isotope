import { useRef, KeyboardEvent } from "react";
import { useForm } from "@tanstack/react-form";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import { Field, FieldError } from "@/shadcn/ui/field";
import * as Schemas from "@app/schemas";

type Priority = "High" | "Medium" | "Low";

interface Props {
  initialValues: Schemas.FrameworkInput;
  onSubmit: (values: Schemas.FrameworkInput) => Promise<void>;
  submitLabel: string;
  isSubmitting: boolean;
  submitError?: string;
}

// ── Section label ─────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-4">
      {children}
    </p>
  );
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-(--text-secondary) -mt-2 mb-4">{children}</p>;
}

function FieldLabelText({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] font-medium text-foreground mb-1">{children}</p>;
}

function FieldSub({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-(--text-secondary) mb-2">{children}</p>;
}

function Divider() {
  return <div className="border-t border-border my-6" />;
}

// ── Tag input ─────────────────────────────────────────────
function TagInput({
  tags,
  onChange,
  placeholder = "Type and press Enter…",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = [
    useRef("").current,
    (v: string) => {
      inputRef.current && (inputRef.current.value = v);
    },
  ];
  // Use uncontrolled input to avoid re-renders on each keystroke
  function addTag(raw: string) {
    const val = raw.trim().replace(/,$/, "").trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const val = inputRef.current?.value ?? "";
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(val);
    } else if (e.key === "Backspace" && val === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div
      className="min-h-9 px-2 py-1.5 rounded-lg bg-background border border-border flex flex-wrap gap-1.5 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-(--surface-raised) border border-border rounded-md px-2 py-0.5 text-[12px] font-medium text-foreground"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(tags.filter((t) => t !== tag));
            }}
            className="text-muted-foreground hover:text-foreground transition-colors leading-none"
          >
            <XIcon size={10} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        defaultValue=""
        onKeyDown={handleKeyDown}
        onBlur={(e) => {
          if (e.target.value.trim()) addTag(e.target.value);
        }}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-30 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none py-0.5"
      />
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={[
        "relative inline-flex w-8 h-4.5 rounded-full transition-colors duration-150 shrink-0",
        value ? "bg-primary" : "bg-border",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-150",
          value ? "translate-x-3.5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

// ── Priority chip ─────────────────────────────────────────
function PriorityChip({
  label,
  active,
  onClick,
}: {
  label: Priority;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-7 px-3 rounded-md text-[12px] font-medium border transition-colors",
        active
          ? "bg-(--accent-bg) text-(--accent-text) border-primary"
          : "bg-(--surface-raised) text-(--text-secondary) border-border hover:bg-background",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

// ── Segmented control for recency ─────────────────────────
const RECENCY_OPTIONS: { label: string; value: 7 | 14 | 30 }[] = [
  { label: "7 days", value: 7 },
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
];

function RecencyControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: 7 | 14 | 30) => void;
}) {
  return (
    <div className="flex gap-2">
      {RECENCY_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={[
            "h-8 px-4 rounded-full text-[12px] font-medium border transition-colors",
            value === opt.value
              ? "bg-(--accent-bg) text-(--accent-text) border-primary"
              : "bg-(--surface-raised) text-(--text-secondary) border-border hover:bg-background",
          ].join(" ")}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Prioritised skills repeater ───────────────────────────
function PrioritisedSkillsRepeater({
  skills,
  onChange,
}: {
  skills: Schemas.PrioritisedSkill[];
  onChange: (s: Schemas.PrioritisedSkill[]) => void;
}) {
  function update(index: number, patch: Partial<Schemas.PrioritisedSkill>) {
    onChange(skills.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }
  function remove(index: number) {
    onChange(skills.filter((_, i) => i !== index));
  }
  function addRow() {
    onChange([...skills, { name: "", priority: "Medium" }]);
  }

  return (
    <div className="space-y-2">
      {skills.map((skill, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={skill.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder="Skill name"
            className="flex-1 h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          <div className="flex gap-1">
            {(["High", "Medium", "Low"] as Priority[]).map((p) => (
              <PriorityChip
                key={p}
                label={p}
                active={skill.priority === p}
                onClick={() => update(i, { priority: p })}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive transition-colors"
          >
            <XIcon size={13} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-[12px] font-medium text-(--text-secondary) hover:text-foreground transition-colors mt-1"
      >
        <PlusIcon size={13} />
        Add skill
      </button>
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────
export default function JobSearchFrameworkForm({
  initialValues,
  onSubmit,
  submitLabel,
  isSubmitting,
  submitError,
}: Props) {
  const form = useForm({
    defaultValues: initialValues,
    validators: {
      onSubmit: Schemas.ZFrameworkInput,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
        {/* ── LEFT COLUMN ─────────────────────────────── */}
        <div>
          <SectionLabel>Target roles</SectionLabel>

          <form.Field name="targetRoles">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid} className="mb-4">
                  <FieldLabelText>Job titles to search for</FieldLabelText>
                  <FieldSub>AI will search for jobs matching any of these titles</FieldSub>
                  <TagInput
                    tags={field.state.value}
                    onChange={(v) => field.handleChange(v)}
                    placeholder="e.g. Software Engineer, SDE-2…"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="isRemote">
            {(field) => (
              <div className="mb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <FieldLabelText>Prefer remote roles</FieldLabelText>
                    <FieldSub>
                      Remote listings will be ranked higher when all else is equal
                    </FieldSub>
                  </div>
                  <Toggle value={field.state.value} onChange={(v) => field.handleChange(v)} />
                </div>
              </div>
            )}
          </form.Field>

          <Divider />

          <SectionLabel>Hard requirements</SectionLabel>
          <SectionDesc>Jobs missing all of these will be filtered out automatically</SectionDesc>

          <form.Field name="requiredSkills">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid} className="mb-4">
                  <FieldLabelText>Required skills (OR logic)</FieldLabelText>
                  <FieldSub>At least one must appear in the job description</FieldSub>
                  <TagInput
                    tags={field.state.value}
                    onChange={(v) => field.handleChange(v)}
                    placeholder="e.g. Node.js, TypeScript…"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="minSalaryLpa">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid} className="mb-4">
                  <FieldLabelText>Minimum salary</FieldLabelText>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                      onBlur={field.handleBlur}
                      className="w-25 h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground focus:outline-none focus:border-primary"
                    />
                    <span className="text-[13px] text-(--text-secondary)">LPA</span>
                  </div>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <div className="mb-4">
            <FieldLabelText>Experience range</FieldLabelText>
            <div className="flex items-center gap-2">
              <form.Field name="minExp">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                        onBlur={field.handleBlur}
                        aria-invalid={isInvalid}
                        className="w-20 h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground focus:outline-none focus:border-primary group-data-[invalid=true]/field:border-destructive"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>
              <span className="text-[13px] text-(--text-secondary)">to</span>
              <form.Field name="maxExp">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
                        onBlur={field.handleBlur}
                        aria-invalid={isInvalid}
                        className="w-20 h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground focus:outline-none focus:border-primary group-data-[invalid=true]/field:border-destructive"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              </form.Field>
              <span className="text-[13px] text-(--text-secondary)">years</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────── */}
        <div>
          <SectionLabel>Ranking signals</SectionLabel>
          <SectionDesc>
            Jobs with more of these skills will be ranked higher — they are not hard requirements
          </SectionDesc>

          <form.Field name="skills">
            {(field) => (
              <div className="mb-4">
                <FieldLabelText>Skills to prioritise</FieldLabelText>
                <PrioritisedSkillsRepeater
                  skills={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                />
              </div>
            )}
          </form.Field>

          <Divider />

          <SectionLabel>Search settings</SectionLabel>

          <form.Field name="recencyWindow">
            {(field) => (
              <div className="mb-6">
                <FieldLabelText>Only show jobs posted within</FieldLabelText>
                <RecencyControl value={field.state.value} onChange={(v) => field.handleChange(v)} />
              </div>
            )}
          </form.Field>

          <Divider />

          <SectionLabel>Location</SectionLabel>

          <form.Field name="preferredLocations">
            {(field) => (
              <div className="mb-4">
                <FieldLabelText>Preferred cities or regions</FieldLabelText>
                <FieldSub>Leave empty to accept any location</FieldSub>
                <TagInput
                  tags={field.state.value}
                  onChange={(v) => field.handleChange(v)}
                  placeholder="e.g. Remote, Bengaluru…"
                />
              </div>
            )}
          </form.Field>
        </div>
      </div>

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
