import { useState } from "react";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { ArrowLeftIcon, PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import { ContactsQueries, useUpdateContact, useDeleteContact } from "../-data";
import { StatusBadge } from "../-StatusBadge";
import { DraftTab } from "../-DraftTab";
import { HistoryTab } from "../-HistoryTab";
import { AboutTab } from "../-AboutTab";
import AddOrEditContactModal from "../-AddOrEditContactModal";
import Utilities from "@/utils";

export const Route = createFileRoute("/_authenticated/contacts/$contactId/")({
  component: ContactDetailPage,
});

type Tab = "draft" | "history" | "about";

function ContactDetailPage() {
  const { contactId } = Route.useParams();
  const { getToken } = useAuth();
  const router = useRouter();
  const navigate = useNavigate();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const [activeTab, setActiveTab] = useState<Tab>("draft");
  const [showEditModal, setShowEditModal] = useState(false);

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

  function handleDelete() {
    deleteContact.mutateAsync(contact!.id).then(() => navigate({ to: "/contacts" }));
  }

  return (
    <>
      {showEditModal && (
        <AddOrEditContactModal
          mode="edit"
          contact={contact}
          onClose={() => setShowEditModal(false)}
        />
      )}
      <div className="flex flex-col h-full overflow-hidden bg-background">
        <header className="h-13 px-4 flex items-center gap-2 border-b border-border bg-background shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            onClick={() => router.history.back()}
            className="-ml-2"
          >
            <ArrowLeftIcon size={20} />
          </Button>
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
                  {contact.companyName && (
                    <span className="text-primary">{contact.companyName}</span>
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-0.5 items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowEditModal(true)}
              title="Edit contact"
            >
              <PencilSimpleIcon size={16} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleteContact.isPending}
              title="Delete contact"
              className="hover:bg-(--danger-bg) hover:text-(--danger)"
            >
              <TrashIcon size={16} />
            </Button>
            <StatusBadge status={contact.status} />
          </div>
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
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={handleMarkDead}
            disabled={updateContact.isPending}
            className="text-(--danger) hover:bg-(--danger-bg) hover:text-(--danger)"
          >
            Mark dead
          </Button>
          <Button
            type="button"
            size="lg"
            onClick={handleMarkSent}
            disabled={updateContact.isPending}
            className="flex-1"
          >
            Mark as sent
          </Button>
        </div>
      </div>
    </>
  );
}
