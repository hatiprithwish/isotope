import { Link } from "@tanstack/react-router";
import type * as Schemas from "@app/schemas";
import { StatusBadge } from "./-StatusBadge";
import Utilities from "@/utils";

function MobileContactRow({ contact }: { contact: Schemas.Contact }) {
  const touchLabel =
    contact.sequencePosition != null && contact.sequencePosition > 0
      ? `T${contact.sequencePosition}`
      : null;

  return (
    <Link
      to="/contacts/$contactId"
      params={{ contactId: String(contact.id) }}
      className="flex items-center gap-3 py-3.5 px-4 bg-sidebar border-b border-border cursor-pointer active:bg-(--surface-raised)"
    >
      <span className="w-9 h-9 rounded-full inline-flex items-center justify-center font-semibold shrink-0 text-[13px] bg-(--surface-raised) text-(--text-secondary)">
        {Utilities.getInitials(contact.name)}
      </span>
      <div className="flex flex-col min-w-0 grow">
        <span className="text-sm font-semibold text-foreground truncate">{contact.name}</span>
        <span className="text-xs text-(--text-secondary) mt-0.5 truncate">
          {[contact.companyName, contact.designation].filter(Boolean).join(" · ")}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <StatusBadge status={contact.status} sm />
        {touchLabel && <span className="text-[11px] font-semibold text-primary">{touchLabel}</span>}
        {contact.nextTouchDueAt && !touchLabel && (
          <span className="text-[11px] text-(--text-secondary)">
            {new Date(contact.nextTouchDueAt).toLocaleDateString()}
          </span>
        )}
      </div>
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-(--text-secondary) shrink-0"
      >
        <path d="M9 6l6 6l-6 6" />
      </svg>
    </Link>
  );
}

export default MobileContactRow;
