import { useState } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  CheckSquareIcon,
  SquareIcon,
} from "@phosphor-icons/react";
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
  onBulkDelete: (ids: number[]) => void;
  isBulkPending: boolean;
}

export function DesktopContactsTable({
  contacts,
  selectedContact,
  onOpenPanel,
  onClosePanel,
  onAddClick,
  onBulkDelete,
  isBulkPending,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const allPageIds = contacts.map((c) => c.id);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allPageIds));
    }
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleBulkDelete() {
    onBulkDelete(Array.from(selectedIds));
    clearSelection();
  }

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
          {someSelected ? (
            <>
              <span className="text-[12px] font-medium text-foreground">
                {selectedIds.size} selected
              </span>
              <Button
                type="button"
                size="xs"
                variant="outline"
                disabled={isBulkPending}
                onClick={handleBulkDelete}
                className="text-destructive border-destructive/40 hover:bg-destructive/10"
              >
                <TrashIcon size={12} />
                Delete
              </Button>
              <button
                type="button"
                onClick={clearSelection}
                className="text-[12px] text-(--text-secondary) hover:text-foreground underline-offset-2 hover:underline"
              >
                Clear
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
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
                style={{ gridTemplateColumns: "32px 2fr 1.4fr 1fr 1fr 110px 90px" }}
              >
                <button
                  type="button"
                  onClick={toggleAll}
                  className="flex items-center justify-center text-muted-foreground hover:text-foreground"
                  aria-label="Select all"
                >
                  {allSelected ? (
                    <CheckSquareIcon size={16} weight="fill" className="text-primary" />
                  ) : (
                    <SquareIcon size={16} />
                  )}
                </button>
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
                  selected={selectedIds.has(co.id)}
                  onSelect={(e) => {
                    e.stopPropagation();
                    toggleOne(co.id);
                  }}
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
