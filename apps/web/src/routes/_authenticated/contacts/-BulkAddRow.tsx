import { useRef } from "react";
import { TrashIcon, ArrowCounterClockwiseIcon, WarningIcon } from "@phosphor-icons/react";
import { ContactStatusIntEnum } from "@app/schemas";
import CompanySelect from "@/shared/fields/CompanySelect";
import Utilities from "@/utils";
import { STATUS_OPTIONS, TitleRolePills, DuplicateContactWarning } from "./-AddOrEditContactModal";

export interface BulkAddRowState {
  rowId: string;
  name: string;
  companyId: number | null;
  companyName: string | null;
  designation: string;
  email: string;
  linkedinUrl: string;
  status: ContactStatusIntEnum;
  skipped: boolean;
  titleFieldFocused: boolean;
}

export function makeEmptyRow(defaults?: {
  companyId: number | null;
  companyName: string | null;
  designation: string;
}): BulkAddRowState {
  return {
    rowId: crypto.randomUUID(),
    name: "",
    companyId: defaults?.companyId ?? null,
    companyName: defaults?.companyName ?? null,
    designation: defaults?.designation ?? "",
    email: "",
    linkedinUrl: "",
    status: ContactStatusIntEnum.NotStarted,
    skipped: false,
    titleFieldFocused: false,
  };
}

interface Props {
  row: BulkAddRowState;
  index: number;
  onChange: (patch: Partial<BulkAddRowState>) => void;
  onToggleSkipped: () => void;
  onDelete: () => void;
  getToken: () => Promise<string | null>;
}

const cellInputCls =
  "h-9 px-2.5 rounded-md bg-background border border-border text-[12.5px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors w-full";

export function BulkAddRow({ row, index, onChange, onToggleSkipped, onDelete, getToken }: Props) {
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
    <>
      <tr className={row.skipped ? "opacity-45" : undefined}>
        <td className="pl-3 pt-4 align-top text-[12px] text-(--text-secondary)">{index + 1}</td>
        <td className="p-1.5 align-top">
          <input
            type="text"
            value={row.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Full name"
            className={cellInputCls}
          />
        </td>
        <td className="p-1.5 align-top">
          <CompanySelect value={row.companyId} onChange={handleCompanyChange} allowCreate />
        </td>
        <td className="p-1.5 align-top">
          <input
            type="text"
            value={row.designation}
            onChange={(e) => onChange({ designation: e.target.value })}
            onFocus={() => onChange({ titleFieldFocused: true })}
            onBlur={() => {
              // Delay so a pill's onClick (fired on mouseup, after this blur) still lands before
              // the panel disappears — TitleRolePills is shared with the single-add modal and
              // isn't wired with onMouseDown/preventDefault there, so the delay lives here instead.
              window.setTimeout(() => onChange({ titleFieldFocused: false }), 150);
            }}
            placeholder="Title"
            className={cellInputCls}
          />
        </td>
        <td className="p-1.5 align-top">
          <input
            type="email"
            value={row.email}
            onChange={(e) => {
              onChange({ email: e.target.value });
              maybeAutofillName(e.target.value, row.linkedinUrl);
            }}
            onBlur={(e) => maybeAutofillName(e.target.value, row.linkedinUrl)}
            placeholder="Email"
            className={cellInputCls}
          />
        </td>
        <td className="p-1.5 align-top">
          <input
            type="text"
            value={row.linkedinUrl}
            onChange={(e) => {
              onChange({ linkedinUrl: e.target.value });
              maybeAutofillName(row.email, e.target.value);
            }}
            onBlur={(e) => maybeAutofillName(row.email, e.target.value)}
            placeholder="linkedin.com/in/…"
            className={cellInputCls}
          />
        </td>
        <td className="p-1.5 align-top">
          <select
            value={row.status}
            onChange={(e) => onChange({ status: Number(e.target.value) as ContactStatusIntEnum })}
            className={cellInputCls}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </td>
        <td className="p-1.5 align-top">
          <button
            type="button"
            onClick={onToggleSkipped}
            title={row.skipped ? "Restore row" : "Skip this row"}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-(--surface-raised) hover:text-foreground transition-colors"
          >
            {row.skipped ? <ArrowCounterClockwiseIcon size={13} /> : <WarningIcon size={13} />}
          </button>
        </td>
        <td className="p-1.5 align-top">
          <button
            type="button"
            onClick={onDelete}
            title="Remove row"
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-(--danger-bg) hover:text-(--danger) transition-colors"
          >
            <TrashIcon size={13} />
          </button>
        </td>
      </tr>

      {row.titleFieldFocused && (
        <tr>
          <td />
          <td colSpan={8} className="px-1.5 pb-2">
            <div className="rounded-lg border border-border bg-(--surface-raised) px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-(--text-secondary) mb-1.5">
                Quick fill
              </p>
              <TitleRolePills
                getToken={getToken}
                onSelect={(label) => onChange({ designation: label })}
              />
            </div>
          </td>
        </tr>
      )}

      {showDuplicateWarning && (
        <tr>
          <td />
          <td colSpan={8} className="px-1.5 pb-2">
            <DuplicateContactWarning
              email={row.email}
              linkedinUrl={row.linkedinUrl}
              getToken={getToken}
            />
          </td>
        </tr>
      )}
    </>
  );
}
