import type * as Schemas from "@app/schemas";
import ContactStatusControl from "./ContactStatusControl";

const WEB_ORIGIN = import.meta.env.WXT_WEB_ORIGIN;

/**
 * One contact with its status and a way to move it. Used by the Contacts tab and by Capture's
 * "already in your pipeline" state, so a contact can be advanced from wherever it turns up.
 */
export default function ContactCard({ contact }: { contact: Schemas.Contact }) {
  const metaLine = [contact.companyName, contact.designation].filter(Boolean).join(" · ");

  return (
    <div className="border-b border-border px-4 py-3 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-foreground">{contact.name}</p>
          {metaLine && (
            <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{metaLine}</p>
          )}
        </div>
        <a
          className="shrink-0 text-[12px] font-medium text-primary underline underline-offset-2"
          href={`${WEB_ORIGIN}/contacts?panel=${contact.id}`}
          target="_blank"
          rel="noreferrer"
        >
          Open
        </a>
      </div>
      <ContactStatusControl
        contactId={contact.id}
        name={contact.name}
        status={contact.status}
        statusLabel={contact.statusLabel}
      />
    </div>
  );
}
