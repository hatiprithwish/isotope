import type * as Schemas from "@app/schemas";
import { StatusBadge } from "./-StatusBadge";

function DesktopContactRow({
  contact,
  active,
  onClick,
}: {
  contact: Schemas.Contact;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={[
        "grid items-center px-6 border-b border-border h-12.5 cursor-pointer transition-colors duration-100",
        active ? "bg-sidebar" : "bg-sidebar hover:bg-(--surface-raised)",
      ].join(" ")}
      style={{ gridTemplateColumns: "2fr 1.4fr 1fr 1fr 110px 90px" }}
    >
      {/* Name */}
      <div>
        <div className="text-[13px] font-medium text-foreground truncate">{contact.name}</div>
        <div className="text-[11px] text-(--text-secondary) mt-0.5 truncate">
          {contact.designation}
        </div>
      </div>
      {/* Company */}
      <div>
        <div className="text-[12px] font-medium text-(--text-secondary) truncate">
          {contact.companyName ?? "—"}
        </div>
      </div>
      {/* Email */}
      <div className="text-[12px] text-(--text-secondary) truncate pr-2">
        {contact.email ?? "—"}
      </div>
      {/* LinkedIn */}
      <div className="text-[12px] text-(--text-secondary) truncate pr-2">
        {contact.linkedinUrl ?? "—"}
      </div>
      {/* Status */}
      <div>{contact.status && <StatusBadge status={contact.status} sm />}</div>
      {/* Next */}
      <div className="text-[11px] text-(--text-secondary)">
        {contact.nextTouchDueAt ? new Date(contact.nextTouchDueAt).toLocaleDateString() : "—"}
      </div>
    </div>
  );
}

export default DesktopContactRow;
