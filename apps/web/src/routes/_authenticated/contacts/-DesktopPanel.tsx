import { useState } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type * as Schemas from "@app/schemas";
import { ArrowsOutSimpleIcon, XIcon } from "@phosphor-icons/react";
import { StatusBadge } from "./-StatusBadge";
import { ContactsQueries, useUpdateContact } from "./-data";
import Utilities from "@/utils";

type Tab = "draft" | "history" | "about";

function Avatar({ name }: { name: string }) {
  return (
    <span className="w-9 h-9 rounded-full inline-flex items-center justify-center font-semibold shrink-0 text-[13px] bg-(--surface-raised) text-(--text-secondary)">
      {Utilities.getInitials(name)}
    </span>
  );
}

function DraftTab({ contact }: { contact: Schemas.Contact }) {
  if (!contact.draftSubject && !contact.draftBody) {
    return (
      <div className="px-5 py-8 text-center text-(--text-secondary) text-sm">
        No draft yet. AI will generate one overnight.
      </div>
    );
  }

  return (
    <div className="px-5 py-4.5 flex flex-col gap-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) flex items-center gap-1.5">
        <span className="text-(--warning) text-[13px]">✦</span>
        Touch {contact.sequencePosition ?? 1} · {contact.abVariable ?? "Email"}
      </div>

      {contact.draftSubject && (
        <div className="bg-background border border-border rounded-lg px-3.5 py-3 relative">
          <div className="text-[13px] font-medium text-foreground pr-14 leading-snug">
            {contact.draftSubject}
          </div>
          <button
            type="button"
            className="absolute top-2.5 right-2.5 text-[11px] font-medium text-(--text-secondary) bg-sidebar border border-border rounded-md px-2 py-1 flex items-center gap-1 hover:text-foreground hover:bg-(--surface-raised) transition-colors"
            onClick={() => navigator.clipboard.writeText(contact.draftSubject ?? "")}
          >
            Copy
          </button>
        </div>
      )}

      {contact.draftBody && (
        <div className="bg-background border border-border rounded-lg px-3.5 py-3 relative">
          <pre className="text-[13px] leading-[1.75] text-foreground whitespace-pre-wrap font-sans pr-16">
            {contact.draftBody}
          </pre>
          <button
            type="button"
            className="absolute top-2.5 right-2.5 text-[11px] font-medium text-(--text-secondary) bg-sidebar border border-border rounded-md px-2 py-1 flex items-center gap-1 hover:text-foreground hover:bg-(--surface-raised) transition-colors"
            onClick={() => navigator.clipboard.writeText(contact.draftBody ?? "")}
          >
            Copy body
          </button>
        </div>
      )}

      {contact.personalizationNotes && (
        <div className="border-b border-border pt-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2 flex items-center gap-1.5">
            <span className="text-(--warning) text-[13px]">✦</span>
            Context used in draft
          </div>
          <div className="bg-(--ai-bg,var(--warning-bg)) border border-border border-l-[3px] border-l-(--ai-border,var(--warning)) rounded-r-lg px-3.5 py-3 text-[12px] leading-[1.65] text-(--text-secondary)">
            {contact.personalizationNotes}
          </div>
        </div>
      )}

      {contact.abVariant && (
        <div className="bg-(--surface-raised) border-l-[3px] border-primary rounded-r-lg px-3.5 py-3 text-[13px] leading-[1.55] text-(--text-secondary)">
          <strong className="text-primary font-semibold">Variant {contact.abVariant}</strong>
          {contact.abVariable && ` · ${contact.abVariable}`}
        </div>
      )}
    </div>
  );
}

function HistoryTab({
  contact,
  getToken,
}: {
  contact: Schemas.Contact;
  getToken: () => Promise<string | null>;
}) {
  const { data, isPending } = useQuery(ContactsQueries.history(contact.id, getToken));
  const history = data?.history ?? [];

  if (isPending)
    return <div className="px-5 py-6 text-(--text-secondary) text-sm">Loading history…</div>;

  if (history.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-(--text-secondary) text-sm">
        No messages sent yet.
      </div>
    );
  }

  return (
    <div className="px-5 py-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-[12px] text-(--text-secondary) border-b border-border pb-3">
        <span className="font-medium">{history.length} messages</span>
        <span className="w-1 h-1 rounded-full bg-(--border-strong)" />
        <span className="font-medium">
          {
            history.filter((h) => h.type === "email_received" || h.type === "linkedin_received")
              .length
          }{" "}
          repl
          {history.filter((h) => h.type === "email_received" || h.type === "linkedin_received")
            .length === 1
            ? "y"
            : "ies"}
        </span>
      </div>
      {history.map((h) => {
        const isSent = h.type === "email_sent" || h.type === "linkedin_sent";
        return (
          <div
            key={h.id}
            className={`flex flex-col gap-1.5 ${isSent ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-(--text-secondary)">
                {h.type.replace("_", " ")} · {new Date(h.sentAt).toLocaleDateString()}
              </span>
            </div>
            <div
              className={[
                "max-w-[82%] px-3.5 py-2.5 text-[13px] leading-[1.7] text-foreground whitespace-pre-wrap break-words",
                isSent
                  ? "bg-(--accent-bg) border border-(--accent)/25 rounded-[16px_16px_4px_16px]"
                  : "bg-sidebar border border-border rounded-[16px_16px_16px_4px]",
              ].join(" ")}
            >
              {h.subject && (
                <div className="font-semibold text-[12px] mb-1 text-(--text-secondary)">
                  {h.subject}
                </div>
              )}
              {h.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AboutTab({ contact, onMarkDead }: { contact: Schemas.Contact; onMarkDead: () => void }) {
  return (
    <div className="flex flex-col">
      {/* Identity */}
      <div className="px-5 py-4.5 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar name={contact.name} />
          <div className="min-w-0">
            <div className="text-base font-semibold text-foreground">{contact.name}</div>
            {contact.designation && (
              <div className="text-[12px] text-(--text-secondary) mt-0.5">
                {contact.designation}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Channels */}
      <div className="border-b border-border overflow-hidden">
        {contact.email && (
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-foreground truncate">
                {contact.email}
              </div>
              <div className="text-[11px] text-(--text-secondary) mt-0.5">Work email</div>
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(contact.email ?? "")}
              className="w-7 h-7 flex items-center justify-center rounded-md text-(--text-secondary) hover:bg-(--surface-raised) transition-colors"
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 9m0 2a2 2 0 0 1 2 -2h7a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2z" />
                <path d="M5 15h-1a2 2 0 0 1 -2 -2v-7a2 2 0 0 1 2 -2h7a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
        )}
        {contact.linkedinUrl && (
          <div className="flex items-center gap-3 px-5 py-3.5">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-foreground truncate">
                {contact.linkedinUrl}
              </div>
              {contact.linkedinConnected && (
                <div className="text-[11px] text-(--success-text) mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-(--success)" />
                  Connection accepted
                </div>
              )}
            </div>
            <a
              href={`https://${contact.linkedinUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 flex items-center justify-center rounded-md text-(--text-secondary) hover:bg-(--surface-raised) transition-colors"
            >
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" />
                <path d="M11 13l9 -9M15 4h5v5" />
              </svg>
            </a>
          </div>
        )}
      </div>

      {/* Sequence */}
      <div className="px-5 py-4.5 border-b border-border">
        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
          Sequence
        </div>
        <div className="bg-sidebar border border-border rounded-lg p-3.5 flex flex-col gap-2">
          {[
            {
              label: "Touch",
              value: contact.sequencePosition != null ? `${contact.sequencePosition} of 3` : "—",
            },
            { label: "A/B", value: contact.abVariant ? `Variant ${contact.abVariant}` : "—" },
            { label: "Variable", value: contact.abVariable ?? "—" },
            {
              label: "Source",
              value: contact.source === 1 ? "Apollo" : contact.source === 2 ? "Manual" : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[13px] text-(--text-secondary)">{label}</span>
              <span className="text-[13px] font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="px-5 py-4.5 border-b border-border">
        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
          Notes
        </div>
        <textarea
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground leading-[1.65] resize-none outline-none focus:border-primary transition-colors min-h-18"
          defaultValue={contact.notes ?? ""}
          placeholder="Add a note…"
          rows={3}
        />
      </div>

      {/* Danger */}
      <div className="px-5 py-4.5">
        <button
          type="button"
          onClick={onMarkDead}
          className="text-[13px] font-medium text-(--danger) hover:bg-(--danger-bg) px-3 py-2 rounded-lg transition-colors w-full border border-transparent"
        >
          Mark as dead
        </button>
      </div>
    </div>
  );
}

function DesktopPanel({ contact, onClose }: { contact: Schemas.Contact; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("draft");
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const updateContact = useUpdateContact();

  function handleMarkSent() {
    updateContact.mutate({ id: contact.id, body: { contact: { status: 3 } } });
  }

  function handleMarkReplied() {
    updateContact.mutate({
      id: contact.id,
      body: { contact: { status: 4, abReplied: true } },
    });
  }

  function handleMarkDead() {
    updateContact.mutate({
      id: contact.id,
      body: { contact: { status: 6, deadAt: new Date().toISOString() } },
    });
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "draft", label: "✦ Draft" },
    { id: "history", label: "History" },
    { id: "about", label: "About" },
  ];

  return (
    <aside className="bg-sidebar border-l border-border flex flex-col h-full overflow-hidden">
      {/* Head */}
      <div className="px-5 pt-4 pb-3.5 border-b border-border shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={contact.name} />
            <div className="min-w-0">
              <div className="text-base font-semibold text-foreground leading-snug truncate">
                {contact.name}
              </div>
              <div className="text-[13px] text-(--text-secondary) mt-0.5 truncate">
                {contact.designation}
                {contact.designation && contact.companyName && " · "}
                {contact.companyName && <span className="text-primary">{contact.companyName}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: "/contacts/$contactId",
                  params: { contactId: String(contact.id) },
                })
              }
              className="w-7 h-7 rounded-md flex items-center justify-center text-(--text-secondary) hover:bg-(--surface-raised) hover:text-foreground transition-colors"
              title="Open full page"
            >
              <ArrowsOutSimpleIcon size={14} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-(--text-secondary) hover:bg-(--surface-raised) hover:text-foreground transition-colors"
              title="Close panel"
            >
              <XIcon size={14} />
            </button>
          </div>
        </div>
        <div className="flex gap-2 items-center mt-3 flex-wrap">
          <StatusBadge status={contact.status} />
          {contact.abVariant && (
            <span className="inline-flex items-center gap-1 h-5.5 px-2 rounded-full bg-(--warning-bg) text-(--warning-text) text-[11px] font-semibold">
              <span className="text-[11px]">✦</span>
              Variant {contact.abVariant}
            </span>
          )}
          <span className="ml-auto text-[11px] text-(--text-secondary)">
            Touch {contact.sequencePosition ?? 0} · {contact.abVariable ?? "Email"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-sidebar shrink-0 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              "h-9.5 px-3.5 text-[12px] border-b-2 transition-colors",
              activeTab === tab.id
                ? "font-semibold text-foreground border-primary"
                : "font-normal text-(--text-secondary) border-transparent hover:text-foreground",
            ].join(" ")}
            style={{ marginBottom: -1 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "draft" && <DraftTab contact={contact} />}
        {activeTab === "history" && <HistoryTab contact={contact} getToken={getToken} />}
        {activeTab === "about" && <AboutTab contact={contact} onMarkDead={handleMarkDead} />}
      </div>

      {/* Footer */}
      <div className="px-5 py-3.5 border-t border-border bg-sidebar flex gap-2 shrink-0">
        <button
          type="button"
          onClick={handleMarkReplied}
          disabled={updateContact.isPending}
          className="h-7.75 px-3.5 rounded-lg text-[13px] font-medium border border-border text-foreground hover:bg-(--surface-raised) transition-colors disabled:opacity-50"
        >
          Mark as replied
        </button>
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleMarkDead}
          disabled={updateContact.isPending}
          className="h-7.75 px-3.5 rounded-lg text-[13px] font-medium text-(--danger) hover:bg-(--danger-bg) border border-transparent transition-colors disabled:opacity-50"
        >
          Mark dead
        </button>
        <button
          type="button"
          onClick={handleMarkSent}
          disabled={updateContact.isPending}
          className="h-7.75 px-3.5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Mark as sent
        </button>
      </div>
    </aside>
  );
}

export default DesktopPanel;
