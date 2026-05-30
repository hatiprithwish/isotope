import { useState, useRef, KeyboardEvent } from "react";
import { PlusIcon, XIcon } from "@phosphor-icons/react";
import type { FrameworkInput, PrioritisedSkill } from "@app/schemas";

type Priority = "High" | "Medium" | "Low";

interface Props {
  initialValues: FrameworkInput;
  onSubmit: (values: FrameworkInput) => Promise<void>;
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] font-medium text-foreground mb-1">{children}</p>;
}

function FieldSub({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] text-(--text-secondary) mb-2">{children}</p>;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[12px] text-destructive mt-1">{msg}</p>;
}

function Divider() {
  return <div className="border-t border-border my-6" />;
}

// ── Tag input ─────────────────────────────────────────────
function TagInput({
  tags,
  onChange,
  placeholder = "Type and press Enter…",
  error,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const val = raw.trim().replace(/,$/, "").trim();
    if (val && !tags.includes(val)) {
      onChange([...tags, val]);
    }
    setInput("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div>
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
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input.trim()) addTag(input);
          }}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground outline-none py-0.5"
        />
      </div>
      <FieldError msg={error} />
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
        "relative inline-flex w-8 h-[18px] rounded-full transition-colors duration-150 shrink-0",
        value ? "bg-primary" : "bg-border",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-150",
          value ? "translate-x-[14px]" : "translate-x-0",
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
      {RECENCY_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={[
              "h-8 px-4 rounded-full text-[12px] font-medium border transition-colors",
              active
                ? "bg-(--accent-bg) text-(--accent-text) border-primary"
                : "bg-(--surface-raised) text-(--text-secondary) border-border hover:bg-background",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Prioritised skills repeater ───────────────────────────
function PrioritisedSkillsRepeater({
  skills,
  onChange,
}: {
  skills: PrioritisedSkill[];
  onChange: (s: PrioritisedSkill[]) => void;
}) {
  function update(index: number, patch: Partial<PrioritisedSkill>) {
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
  const [values, setValues] = useState<FrameworkInput>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  function set<K extends keyof FrameworkInput>(key: K, val: FrameworkInput[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<string, string>> = {};
    if (values.targetRoles.length === 0) errs.targetRoles = "At least one target role is required";
    if (values.requiredSkills.length === 0)
      errs.requiredSkills = "At least one required skill is required";
    if (values.minExp < 0) errs.minExp = "Min experience must be ≥ 0";
    if (values.maxExp < values.minExp) errs.maxExp = "Max experience must be ≥ min experience";
    if (values.minSalaryLpa < 0) errs.minSalaryLpa = "Salary must be ≥ 0";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Two-column grid on md+, single column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
        {/* ── LEFT COLUMN ─────────────────────────────── */}
        <div>
          {/* Target roles */}
          <SectionLabel>Target roles</SectionLabel>

          <div className="mb-4">
            <FieldLabel>Job titles to search for</FieldLabel>
            <FieldSub>AI will search for jobs matching any of these titles</FieldSub>
            <TagInput
              tags={values.targetRoles}
              onChange={(v) => set("targetRoles", v)}
              placeholder="e.g. Software Engineer, SDE-2…"
              error={errors.targetRoles}
            />
          </div>

          <div className="mb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <FieldLabel>Prefer remote roles</FieldLabel>
                <FieldSub>Remote listings will be ranked higher when all else is equal</FieldSub>
              </div>
              <Toggle value={values.isRemote} onChange={(v) => set("isRemote", v)} />
            </div>
          </div>

          <Divider />

          {/* Hard requirements */}
          <SectionLabel>Hard requirements</SectionLabel>
          <SectionDesc>Jobs missing all of these will be filtered out automatically</SectionDesc>

          <div className="mb-4">
            <FieldLabel>Required skills (OR logic)</FieldLabel>
            <FieldSub>At least one must appear in the job description</FieldSub>
            <TagInput
              tags={values.requiredSkills}
              onChange={(v) => set("requiredSkills", v)}
              placeholder="e.g. Node.js, TypeScript…"
              error={errors.requiredSkills}
            />
          </div>

          <div className="mb-4">
            <FieldLabel>Minimum salary</FieldLabel>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={0.5}
                value={values.minSalaryLpa}
                onChange={(e) => set("minSalaryLpa", parseFloat(e.target.value) || 0)}
                className="w-25 h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground focus:outline-none focus:border-primary"
              />
              <span className="text-[13px] text-(--text-secondary)">LPA</span>
            </div>
            <FieldError msg={errors.minSalaryLpa} />
          </div>

          <div className="mb-4">
            <FieldLabel>Experience range</FieldLabel>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={0.5}
                value={values.minExp}
                onChange={(e) => set("minExp", parseFloat(e.target.value) || 0)}
                className="w-20 h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground focus:outline-none focus:border-primary"
              />
              <span className="text-[13px] text-(--text-secondary)">to</span>
              <input
                type="number"
                min={0}
                step={0.5}
                value={values.maxExp}
                onChange={(e) => set("maxExp", parseFloat(e.target.value) || 0)}
                className="w-20 h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground focus:outline-none focus:border-primary"
              />
              <span className="text-[13px] text-(--text-secondary)">years</span>
            </div>
            <FieldError msg={errors.minExp} />
            <FieldError msg={errors.maxExp} />
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────── */}
        <div>
          {/* Ranking signals */}
          <SectionLabel>Ranking signals</SectionLabel>
          <SectionDesc>
            Jobs with more of these skills will be ranked higher — they are not hard requirements
          </SectionDesc>

          <div className="mb-4">
            <FieldLabel>Skills to prioritise</FieldLabel>
            <PrioritisedSkillsRepeater skills={values.skills} onChange={(v) => set("skills", v)} />
          </div>

          <Divider />

          {/* Search settings */}
          <SectionLabel>Search settings</SectionLabel>

          <div className="mb-6">
            <FieldLabel>Only show jobs posted within</FieldLabel>
            <RecencyControl
              value={values.recencyWindow}
              onChange={(v) => set("recencyWindow", v)}
            />
          </div>

          <Divider />

          {/* Location */}
          <SectionLabel>Location</SectionLabel>

          <div className="mb-4">
            <FieldLabel>Preferred cities or regions</FieldLabel>
            <FieldSub>Leave empty to accept any location</FieldSub>
            <TagInput
              tags={values.preferredLocations}
              onChange={(v) => set("preferredLocations", v)}
              placeholder="e.g. Remote, Bengaluru…"
            />
          </div>
        </div>
      </div>

      {/* Submit — full width below both columns */}
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
