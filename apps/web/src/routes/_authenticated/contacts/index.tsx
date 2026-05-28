import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { z } from "zod";
import { MagnifyingGlassIcon, FunnelIcon, PlusIcon } from "@phosphor-icons/react";
import { ContactsQueries } from "./-data";
import MobileContactRow from "./-MobileContactRow";
import DesktopContactRow from "./-DesktopContactRow";
import DesktopPanel from "./-DesktopPanel";
import AddContactModal from "./-AddContactModal";

const searchSchema = z.object({
  panel: z.number().optional(),
});

export const Route = createFileRoute("/_authenticated/contacts/")({
  validateSearch: searchSchema,
  component: ContactsPage,
});

function ContactsPage() {
  const { getToken } = useAuth();
  const { panel } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [showAddModal, setShowAddModal] = useState(false);

  const { data, isPending, isError } = useQuery(ContactsQueries.list(getToken));
  const contacts = data?.contacts ?? [];

  const selectedContact = panel ? (contacts.find((c) => c.id === panel) ?? null) : null;

  function openPanel(id: number) {
    navigate({ search: (prev) => ({ ...prev, panel: id }) });
  }

  function closePanel() {
    navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
  }

  const draftReady = contacts.filter((c) => c.status === 2);
  const inPipeline = contacts.filter((c) => c.status === 3);
  const other = contacts.filter((c) => c.status !== 2 && c.status !== 3);

  if (isPending) return <div className="p-6 text-(--text-secondary) text-sm">Loading...</div>;
  if (isError)
    return <div className="p-6 text-(--text-secondary) text-sm">Failed to load contacts.</div>;

  return (
    <>
      {/* ── MOBILE ─────────────────────────────────────────────── */}
      <div className="flex flex-col h-full md:hidden overflow-hidden">
        {/* Header */}
        <header className="h-13 px-4 flex items-center gap-2 bg-background border-b border-border shrink-0">
          <span className="flex-1 text-[17px] font-semibold text-foreground tracking-tight">
            Contacts
          </span>
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-(--text-secondary) hover:bg-(--surface-raised)"
          >
            <MagnifyingGlassIcon size={18} />
          </button>
          <button
            type="button"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-(--text-secondary) hover:bg-(--surface-raised)"
          >
            <FunnelIcon size={18} />
          </button>
        </header>

        {/* Chips */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-border bg-background shrink-0 no-scrollbar">
          {[
            { label: "All", count: contacts.length, active: true },
            { label: "Draft ready", count: draftReady.length },
            { label: "In pipeline", count: inPipeline.length },
            {
              label: "Needs input",
              count: contacts.filter(
                (c) => c.status === 1 && !c.personalizationNotes && !c.manualPersonalizationNotes,
              ).length,
            },
            { label: "Replied" },
            { label: "Re-engage" },
            { label: "Dead" },
          ].map(({ label, count, active }) => (
            <button
              key={label}
              type="button"
              className={[
                "inline-flex items-center gap-1 h-8 px-3 rounded-full border text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors",
                active
                  ? "bg-(--accent-bg,var(--primary)/0.1) border-primary text-primary font-semibold"
                  : "bg-sidebar border-border text-(--text-secondary)",
              ].join(" ")}
            >
              {label}
              {count !== undefined && count > 0 && (
                <span
                  className={[
                    "inline-flex items-center justify-center min-w-4.5 h-4 px-1 rounded text-[10px] font-semibold",
                    active
                      ? "text-primary opacity-70"
                      : "bg-(--surface-raised) text-(--text-secondary)",
                  ].join(" ")}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List body */}
        <div className="flex-1 overflow-y-auto bg-sidebar">
          {contacts.length === 0 ? (
            <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
              No contacts yet.
            </div>
          ) : (
            <>
              {draftReady.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
                      Drafts ready · ready to send{" "}
                      <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-(--surface-raised) text-(--text-secondary) text-[10px] font-semibold ml-1">
                        {draftReady.length}
                      </span>
                    </span>
                  </div>
                  {draftReady.map((co) => (
                    <MobileContactRow key={co.id} contact={co} />
                  ))}
                </>
              )}
              {inPipeline.length > 0 && (
                <>
                  <div className="px-4 pt-5 pb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
                      In pipeline{" "}
                      <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-(--surface-raised) text-(--text-secondary) text-[10px] font-semibold ml-1">
                        {inPipeline.length}
                      </span>
                    </span>
                  </div>
                  {inPipeline.map((co) => (
                    <MobileContactRow key={co.id} contact={co} />
                  ))}
                </>
              )}
              {other.length > 0 && (
                <>
                  <div className="px-4 pt-5 pb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
                      Other{" "}
                      <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-(--surface-raised) text-(--text-secondary) text-[10px] font-semibold ml-1">
                        {other.length}
                      </span>
                    </span>
                  </div>
                  {other.map((co) => (
                    <MobileContactRow key={co.id} contact={co} />
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── DESKTOP ────────────────────────────────────────────── */}
      <div className="hidden md:flex h-full overflow-hidden">
        {/* Left: table */}
        <div className="flex flex-col overflow-hidden border-r border-border flex-1">
          {/* Topbar */}
          <header className="h-13 px-6 flex items-center border-b border-border bg-sidebar shrink-0">
            <span className="text-base font-semibold text-foreground tracking-tight">Contacts</span>
            <div className="ml-auto flex gap-2 items-center">
              <button
                type="button"
                className="h-7.75 w-7.75 flex items-center justify-center rounded-lg text-(--text-secondary) hover:bg-(--surface-raised) border border-transparent transition-colors"
              >
                <MagnifyingGlassIcon size={14} />
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="h-7.75 px-3 flex items-center gap-1.5 rounded-lg text-[13px] font-medium border border-border text-foreground hover:bg-(--surface-raised) transition-colors"
              >
                <PlusIcon size={13} />
                Add manually
              </button>
            </div>
          </header>

          {/* Filter bar */}
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

          {/* Table */}
          <div className="flex-1 overflow-auto bg-background">
            {contacts.length === 0 ? (
              <div className="px-6 py-8 text-(--text-secondary) text-sm">No contacts yet.</div>
            ) : (
              <>
                {/* Thead */}
                <div
                  className="grid items-center px-6 border-b border-border bg-sidebar h-10.5 text-[11px] font-semibold uppercase tracking-wider text-(--text-secondary) sticky top-0"
                  style={{ gridTemplateColumns: "2fr 1.4fr 80px 1fr 110px 90px" }}
                >
                  <div>Name</div>
                  <div>Company</div>
                  <div>Touch</div>
                  <div>Channel</div>
                  <div>Status</div>
                  <div>Next</div>
                </div>
                {contacts.map((co) => (
                  <DesktopContactRow
                    key={co.id}
                    contact={co}
                    active={selectedContact?.id === co.id}
                    onClick={() =>
                      selectedContact?.id === co.id ? closePanel() : openPanel(co.id)
                    }
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* Right: panel */}
        {selectedContact && (
          <div className="w-100 shrink-0">
            <DesktopPanel contact={selectedContact} onClose={closePanel} />
          </div>
        )}
      </div>

      {showAddModal && <AddContactModal onClose={() => setShowAddModal(false)} />}
    </>
  );
}
