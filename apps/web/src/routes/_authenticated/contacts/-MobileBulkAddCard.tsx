import { useRef } from "react";
import { ArrowCounterClockwiseIcon, TrashIcon, WarningIcon } from "@phosphor-icons/react";
import type { ContactStatusIntEnum } from "@app/schemas";
import CompanySelect from "@/shared/fields/CompanySelect";
import Utilities from "@/utils";
import { STATUS_OPTIONS, TitleRolePills, DuplicateContactWarning } from "./-AddOrEditContactModal";
import type { BulkAddRowState } from "./-BulkAddRow";

interface Props {
  row: BulkAddRowState;
  index: number;
  onChange: (patch: Partial<BulkAddRowState>) => void;
  onToggleSkipped: () => void;
  onDelete: () => void;
  getToken: () => Promise<string | null>;
}

const inputCls =
  "h-9 px-2.5 rounded-md bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors w-full";

export function MobileBulkAddCard({
  row,
  index,
  onChange,
  onToggleSkipped,
  onDelete,
  getToken,
}: Props) {
  const lastAutofilledName = useRef("");

  function maybeAutofillName(email: string, linkedinUrl: string) {
    const currentName = row.name.trim();
    if (currentName && currentName !== lastAutofilledName.current) return;

    const guess = Utilities.guessNameFromEmailOrLinkedin(email, linkedinUrl);
    if (guess) {
      lastAutofilledName.current = guess;
      onChange({ name: guess });
    }
  }

  function handleCompanyChange(companyId: number | null, companyName?: string) {
    onChange({ companyId, companyName: companyId != null ? (companyName ?? null) : null });
  }

  const showDuplicateWarning = Boolean(row.email.trim() || row.linkedinUrl.trim());

  return (
    <div
      className={[
        "border border-border rounded-lg bg-card p-3 flex flex-col gap-2.5",
        row.skipped ? "opacity-45" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-semibold text-(--text-secondary)">
          Contact {index + 1}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleSkipped}
            title={row.skipped ? "Restore row" : "Skip this row"}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground active:bg-(--surface-raised)"
          >
            {row.skipped ? <ArrowCounterClockwiseIcon size={14} /> : <WarningIcon size={14} />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Remove row"
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground active:bg-(--danger-bg) active:text-(--danger)"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>

      <input
        type="text"
        value={row.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Full name *"
        className={inputCls}
      />

      <CompanySelect value={row.companyId} onChange={handleCompanyChange} allowCreate />

      <input
        type="text"
        value={row.designation}
        onChange={(e) => onChange({ designation: e.target.value })}
        onFocus={() => onChange({ titleFieldFocused: true })}
        onBlur={() => {
          window.setTimeout(() => onChange({ titleFieldFocused: false }), 150);
        }}
        placeholder="Title"
        className={inputCls}
      />

      {row.titleFieldFocused && (
        <TitleRolePills
          getToken={getToken}
          onSelect={(label) => onChange({ designation: label })}
        />
      )}

      <input
        type="email"
        value={row.email}
        onChange={(e) => {
          onChange({ email: e.target.value });
          maybeAutofillName(e.target.value, row.linkedinUrl);
        }}
        onBlur={(e) => maybeAutofillName(e.target.value, row.linkedinUrl)}
        placeholder="Email"
        className={inputCls}
      />

      <input
        type="text"
        value={row.linkedinUrl}
        onChange={(e) => {
          onChange({ linkedinUrl: e.target.value });
          maybeAutofillName(row.email, e.target.value);
        }}
        onBlur={(e) => maybeAutofillName(row.email, e.target.value)}
        placeholder="linkedin.com/in/…"
        className={inputCls}
      />

      {showDuplicateWarning && (
        <DuplicateContactWarning
          email={row.email}
          linkedinUrl={row.linkedinUrl}
          getToken={getToken}
        />
      )}

      <select
        value={row.status}
        onChange={(e) => onChange({ status: Number(e.target.value) as ContactStatusIntEnum })}
        className={inputCls}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
