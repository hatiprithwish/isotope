import { toast } from "sonner";
import { CopyIcon } from "@phosphor-icons/react";
import type * as Schemas from "@app/schemas";
import { StatusBadge } from "./-StatusBadge";
import Utilities from "@/utils";
import {
  MobileListRowCheckbox,
  MobileListRowChevron,
  MobileListRowLinkShell,
  MobileListRowShell,
} from "../-MobileListRow";

interface MobileContactRowProps {
  contact: Schemas.Contact;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: number) => void;
}

function copyToClipboard(e: React.MouseEvent, value: string, label: string) {
  e.preventDefault();
  e.stopPropagation();
  void navigator.clipboard.writeText(value).then(() => {
    toast.success(`${label} copied`);
  });
}

function MobileContactRow({
  contact,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: MobileContactRowProps) {
  const email = contact.email;
  const linkedinUrl = contact.linkedinUrl;

  const content = (
    <>
      {selectMode && (
        <MobileListRowCheckbox selected={selected} onToggle={() => onToggleSelect?.(contact.id)} />
      )}
      <span className="w-9 h-9 rounded-full inline-flex items-center justify-center font-semibold shrink-0 text-[13px] bg-(--surface-raised) text-(--text-secondary)">
        {Utilities.getInitials(contact.name)}
      </span>
      <div className="flex flex-col min-w-0 grow">
        <span className="text-sm font-semibold text-foreground truncate">{contact.name}</span>
        <span className="text-xs text-(--text-secondary) mt-0.5 truncate">
          {[contact.companyName, contact.designation].filter(Boolean).join(" · ")}
        </span>
        <div className="flex gap-2 mt-1">
          {email && (
            <button
              type="button"
              onClick={(e) => copyToClipboard(e, email, "Email")}
              className="group inline-flex items-center gap-1 text-[11px] text-(--text-secondary) truncate max-w-36"
              title="Copy email"
            >
              <span className="truncate">{email}</span>
              <CopyIcon size={10} className="shrink-0 opacity-60 group-active:opacity-100" />
            </button>
          )}
          {linkedinUrl && (
            <button
              type="button"
              onClick={(e) => copyToClipboard(e, linkedinUrl, "LinkedIn URL")}
              className="group inline-flex items-center gap-1 text-[11px] text-primary truncate max-w-36"
              title="Copy LinkedIn URL"
            >
              LinkedIn
              <CopyIcon size={10} className="shrink-0 opacity-60 group-active:opacity-100" />
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <StatusBadge status={contact.status} sm />
      </div>
      {!selectMode && <MobileListRowChevron />}
    </>
  );

  if (selectMode) {
    return (
      <MobileListRowShell role="button" onActivate={() => onToggleSelect?.(contact.id)}>
        {content}
      </MobileListRowShell>
    );
  }

  return (
    <MobileListRowLinkShell
      to="/contacts/$contactId"
      params={{ contactId: String(contact.id) }}
      label={`Open ${contact.name}`}
    >
      {content}
    </MobileListRowLinkShell>
  );
}

export default MobileContactRow;
