import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import type * as Schemas from "@app/schemas";
import DesktopContactRow from "./-DesktopContactRow";
import { ContactDetailPanel } from "./-DesktopPanel";

interface Props {
  contacts: Schemas.Contact[];
  selectedContact: Schemas.Contact | null;
  onOpenPanel: (id: number) => void;
  onClosePanel: () => void;
  onAddClick: () => void;
}

export function DesktopContactsTable({
  contacts,
  selectedContact,
  onOpenPanel,
  onClosePanel,
  onAddClick,
}: Props) {
  return (
    <div className="hidden md:flex h-full overflow-hidden relative">
      <div className="flex flex-col overflow-hidden flex-1">
        <header className="h-13 px-6 flex items-center border-b border-border bg-sidebar shrink-0">
          <span className="text-base font-semibold text-foreground tracking-tight">Contacts</span>
          <div className="ml-auto flex gap-2 items-center">
            <Button type="button" variant="ghost" size="icon">
              <MagnifyingGlassIcon size={14} />
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={onAddClick}>
              <PlusIcon size={13} />
              Add manually
            </Button>
          </div>
        </header>

        <div className="flex gap-2 items-center px-6 py-3.5 border-b border-border bg-background shrink-0">
          {[
            { lbl: "Status:", val: "Draft ready" },
            { lbl: "Company:", val: "All" },
            { lbl: "Channel:", val: "All" },
            { lbl: "Fit:", val: "All bands" },
          ].map(({ lbl, val }) => (
            <button
              key={lbl}
              type="button"
              className="inline-flex items-center gap-1.5 h-7 px-2.75 rounded-[7px] bg-background border border-border text-[12px] font-medium text-(--text-secondary) hover:border-foreground hover:text-foreground transition-colors"
            >
              <span className="text-(--text-secondary) opacity-70">{lbl}</span>
              <span className="text-foreground">{val}</span>
              <svg
                width={11}
                height={11}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-70"
              >
                <path d="M6 9l6 6l6 -6" />
              </svg>
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-[12px] font-medium text-(--text-secondary)">
            {contacts.length} {contacts.length === 1 ? "contact" : "contacts"}
          </span>
        </div>

        <div className="flex-1 overflow-auto bg-background">
          {contacts.length === 0 ? (
            <div className="px-6 py-8 text-(--text-secondary) text-sm">No contacts yet.</div>
          ) : (
            <>
              <div
                className="grid items-center px-6 border-b border-border bg-sidebar h-10.5 text-[11px] font-semibold uppercase tracking-wider text-(--text-secondary) sticky top-0"
                style={{ gridTemplateColumns: "2fr 1.4fr 1fr 1fr 110px 90px" }}
              >
                <div>Name</div>
                <div>Company</div>
                <div>Email</div>
                <div>LinkedIn</div>
                <div>Status</div>
                <div>Next</div>
              </div>
              {contacts.map((co) => (
                <DesktopContactRow
                  key={co.id}
                  contact={co}
                  active={selectedContact?.id === co.id}
                  onClick={() =>
                    selectedContact?.id === co.id ? onClosePanel() : onOpenPanel(co.id)
                  }
                />
              ))}
            </>
          )}
        </div>
      </div>

      <ContactDetailPanel
        contactId={selectedContact?.id ?? null}
        contact={selectedContact}
        onClose={onClosePanel}
      />
    </div>
  );
}
