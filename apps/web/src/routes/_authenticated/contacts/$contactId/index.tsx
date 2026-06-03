import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { ContactsQueries, useUpdateContact } from "../-data";
import { StatusBadge } from "../-StatusBadge";
import { DraftTab } from "../-DraftTab";
import { HistoryTab } from "../-HistoryTab";
import { AboutTab } from "../-AboutTab";
import Utilities from "@/utils";

export const Route = createFileRoute("/_authenticated/contacts/$contactId/")({
  component: ContactDetailPage,
});

type Tab = "draft" | "history" | "about";

function ContactDetailPage() {
  const { contactId } = Route.useParams();
  const { getToken } = useAuth();
  const router = useRouter();
  const updateContact = useUpdateContact();
  const [activeTab, setActiveTab] = useState<Tab>("draft");

  const { data, isPending, isError } = useQuery(
    ContactsQueries.detail(Number(contactId), getToken),
  );
  const contact = data?.contact;

  if (isPending) return <div className="p-6 text-(--text-secondary) text-sm">Loading...</div>;
  if (isError || !contact)
    return <div className="p-6 text-(--text-secondary) text-sm">Contact not found.</div>;

  const tabs: { id: Tab; label: string }[] = [
    { id: "draft", label: "✦ Draft" },
    { id: "history", label: "History" },
    { id: "about", label: "About" },
  ];

  function handleMarkSent() {
    updateContact.mutate({ id: contact!.id, body: { contact: { status: 3 } } });
  }

  function handleMarkDead() {
    updateContact.mutate({
      id: contact!.id,
      body: { contact: { status: 6, deadAt: new Date().toISOString() } },
    });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <header className="h-13 px-4 flex items-center gap-2 border-b border-border bg-background shrink-0">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-(--text-secondary) hover:bg-(--surface-raised) -ml-2"
        >
          <ArrowLeftIcon size={20} />
        </button>
        <div className="flex items-center gap-2.5 grow min-w-0">
          <span className="w-7 h-7 rounded-full inline-flex items-center justify-center text-[11px] font-semibold shrink-0 bg-(--surface-raised) text-(--text-secondary)">
            {Utilities.getInitials(contact.name)}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-semibold text-foreground truncate leading-snug">
              {contact.name}
            </span>
            {(contact.designation || contact.companyName) && (
              <span className="text-xs text-(--text-secondary) leading-none mt-0.5 truncate">
                {contact.designation}
                {contact.designation && contact.companyName && " · "}
                {contact.companyName && <span className="text-primary">{contact.companyName}</span>}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={contact.status} />
      </header>

      <div className="flex border-b border-border bg-background shrink-0 px-1">
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

      <div className="px-4 py-3 border-t border-border bg-background flex gap-2 shrink-0">
        <button
          type="button"
          onClick={handleMarkDead}
          disabled={updateContact.isPending}
          className="h-10 px-4 rounded-[10px] text-sm font-medium text-(--danger) border border-transparent hover:bg-(--danger-bg) transition-colors disabled:opacity-50"
        >
          Mark dead
        </button>
        <button
          type="button"
          onClick={handleMarkSent}
          disabled={updateContact.isPending}
          className="flex-1 h-10 px-4 rounded-[10px] text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Mark as sent
        </button>
      </div>
    </div>
  );
}
