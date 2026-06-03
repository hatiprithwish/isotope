import { useState } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { useNavigate } from "@tanstack/react-router";
import type * as Schemas from "@app/schemas";
import { ArrowsOutSimpleIcon, XIcon } from "@phosphor-icons/react";
import { StatusBadge } from "./-StatusBadge";
import { useUpdateContact } from "./-data";
import Utilities from "@/utils";
import { DraftTab } from "./-DraftTab";
import { HistoryTab } from "./-HistoryTab";
import { AboutTab } from "./-AboutTab";

type Tab = "draft" | "history" | "about";

function Avatar({ name }: { name: string }) {
  return (
    <span className="w-9 h-9 rounded-full inline-flex items-center justify-center font-semibold shrink-0 text-[13px] bg-(--surface-raised) text-(--text-secondary)">
      {Utilities.getInitials(name)}
    </span>
  );
}

function DesktopPanel({ contact, onClose }: { contact: Schemas.Contact; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>("draft");
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const updateContact = useUpdateContact();

  const tabs: { id: Tab; label: string }[] = [
    { id: "draft", label: "✦ Draft" },
    { id: "history", label: "History" },
    { id: "about", label: "About" },
  ];

  function handleMarkSent() {
    updateContact.mutate({ id: contact.id, body: { contact: { status: 3 } } });
  }

  function handleMarkDead() {
    updateContact.mutate({
      id: contact.id,
      body: { contact: { status: 6, deadAt: new Date().toISOString() } },
    });
  }

  return (
    <aside className="bg-sidebar border-l border-border flex flex-col h-full overflow-hidden">
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
                navigate({ to: "/contacts/$contactId", params: { contactId: String(contact.id) } })
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

      <div className="flex border-b border-border bg-sidebar shrink-0 px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              "h-9.5 px-3.5 text-[12px] border-b-2 transition-colors -mb-px",
              activeTab === tab.id
                ? "font-semibold text-foreground border-primary"
                : "font-normal text-(--text-secondary) border-transparent hover:text-foreground",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "draft" && <DraftTab contact={contact} />}
        {activeTab === "history" && <HistoryTab contact={contact} getToken={getToken} />}
        {activeTab === "about" && <AboutTab contact={contact} onMarkDead={handleMarkDead} />}
      </div>

      <div className="px-5 py-3.5 border-t border-border bg-sidebar flex gap-2 shrink-0">
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
