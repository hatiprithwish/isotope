import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Schemas from "@app/schemas"; // runtime `import *`: consumes CONTACT_HISTORY_CHANNEL_LABEL_MAP alongside types.
import {
  ArrowSquareOutIcon,
  CheckIcon,
  CopyIcon,
  EnvelopeSimpleIcon,
  LinkedinLogoIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import { StatusBadge } from "./-StatusBadge";
import { ContactsQueries, useDeleteContact, useUpdateContact } from "./-data";
import Utilities from "@/utils";
import { HistoryTab } from "./-HistoryTab";
import { AboutTab } from "./-AboutTab";
import { NotesTab } from "./-NotesTab";
import AddOrEditContactModal, { STATUS_OPTIONS } from "./-AddOrEditContactModal";
import { StatusChangePopover } from "../-StatusChangePopover";
import { StatusNoteInfoIcon } from "../-StatusNoteInfoIcon";

export type ContactDetailTab = "history" | "about" | "notes";

const TABS: { id: ContactDetailTab; label: string }[] = [
  { id: "history", label: "History" },
  { id: "about", label: "About" },
  { id: "notes", label: "Notes" },
];

function Avatar({ name }: { name: string }) {
  return (
    <span className="w-9 h-9 rounded-full inline-flex items-center justify-center font-semibold shrink-0 text-[13px] bg-(--surface-raised) text-(--text-secondary)">
      {Utilities.getInitials(name)}
    </span>
  );
}

function ContactLinks({ contact }: { contact: Schemas.Contact }) {
  const [emailCopied, setEmailCopied] = useState(false);

  if (!contact.email && !contact.linkedinUrl) return null;

  const copyEmail = () => {
    if (!contact.email) return;
    void navigator.clipboard.writeText(contact.email);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-0.5 mt-2.5 -mx-2">
      {contact.email && (
        <button
          type="button"
          onClick={copyEmail}
          title="Copy email"
          className="flex items-center gap-2 h-7 px-2 rounded-md text-left hover:bg-(--surface-raised) transition-colors"
        >
          <EnvelopeSimpleIcon size={14} className="text-(--text-secondary) shrink-0" />
          <span className="flex-1 min-w-0 text-[13px] text-foreground truncate">
            {contact.email}
          </span>
          {emailCopied ? (
            <span className="flex items-center gap-1 text-[11px] text-(--success-text) shrink-0">
              <CheckIcon size={12} weight="bold" />
              Copied
            </span>
          ) : (
            <CopyIcon size={14} className="text-(--text-secondary) shrink-0" />
          )}
        </button>
      )}
      {contact.linkedinUrl && (
        <a
          href={Utilities.toHref(contact.linkedinUrl)}
          target="_blank"
          rel="noopener noreferrer"
          title="Open LinkedIn profile"
          className="flex items-center gap-2 h-7 px-2 rounded-md hover:bg-(--surface-raised) transition-colors"
        >
          <LinkedinLogoIcon size={14} className="text-(--text-secondary) shrink-0" />
          <span className="flex-1 min-w-0 text-[13px] text-foreground truncate">
            {contact.linkedinUrl}
          </span>
          {contact.linkedinConnected && (
            <span className="flex items-center gap-1 text-[11px] text-(--success-text) shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-(--success)" />
              Connected
            </span>
          )}
          <ArrowSquareOutIcon size={14} className="text-(--text-secondary) shrink-0" />
        </a>
      )}
    </div>
  );
}

interface ContactDetailContentProps {
  contact: Schemas.Contact;
  getToken: () => Promise<string | null>;
  activeTab: ContactDetailTab;
  onTabChange: (tab: ContactDetailTab) => void;
  onClose: () => void;
  /** Called after a successful delete so the surface can close itself. */
  onDeleted: () => void;
}

export function ContactDetailContent({
  contact,
  getToken,
  activeTab,
  onTabChange,
  onClose,
  onDeleted,
}: ContactDetailContentProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const deleteContact = useDeleteContact();
  const updateContact = useUpdateContact();

  function handleStatusChange(newStatus: number) {
    return updateContact.mutateAsync({
      id: contact.id,
      body: { contact: { status: newStatus as Schemas.ContactStatusIntEnum } },
    });
  }

  function statusLabel(status: number) {
    return (
      Schemas.contactStatusIntToLabel[status as Schemas.ContactStatusIntEnum] ?? String(status)
    );
  }

  // Shares HistoryTab's query key, so mounting both never double-fetches.
  const { data: historyData } = useQuery(ContactsQueries.history(contact.id, getToken));
  const sentHistory = (historyData?.history ?? []).filter((h) =>
    Schemas.CONTACT_HISTORY_SENT_TYPES.includes(h.type),
  );
  const lastSent = sentHistory[sentHistory.length - 1];
  const touchLabel = lastSent
    ? `Touch ${lastSent.sequencePosition ?? 0} · ${Schemas.CONTACT_HISTORY_CHANNEL_LABEL_MAP[lastSent.channel]}`
    : "No messages yet";

  function handleDelete() {
    deleteContact.mutateAsync(contact.id).then(onDeleted);
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
      <div className="flex flex-col h-full overflow-hidden bg-card">
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
                  {contact.companyName && (
                    <span className="text-primary">{contact.companyName}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-0.5 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowEditModal(true)}
                title="Edit contact"
              >
                <PencilSimpleIcon size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleDelete}
                disabled={deleteContact.isPending}
                title="Delete contact"
                className="hover:bg-(--danger-bg) hover:text-(--danger)"
              >
                <TrashIcon size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                title="Close panel"
              >
                <XIcon size={14} />
              </Button>
            </div>
          </div>
          <div className="flex gap-2 items-center mt-3 flex-wrap">
            <StatusChangePopover
              entityType={Schemas.StatusChangeEntityTypeEnum.Contact}
              entityId={contact.id}
              currentStatus={contact.status}
              statusOptions={STATUS_OPTIONS}
              onStatusChange={handleStatusChange}
              isPending={updateContact.isPending}
              trigger={
                <button type="button" className="cursor-pointer">
                  <StatusBadge status={contact.status} />
                </button>
              }
            />
            <StatusNoteInfoIcon
              entityType={Schemas.StatusChangeEntityTypeEnum.Contact}
              entityId={contact.id}
              currentStatus={contact.status}
              getToken={getToken}
            />
            <span className="ml-auto text-[11px] text-(--text-secondary)">{touchLabel}</span>
          </div>
          <ContactLinks contact={contact} />
        </div>

        <div className="flex border-b border-border bg-card shrink-0 px-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
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
          {activeTab === "history" && <HistoryTab contact={contact} getToken={getToken} />}
          {activeTab === "about" && (
            <AboutTab contact={contact} getToken={getToken} statusLabel={statusLabel} />
          )}
          {activeTab === "notes" && <NotesTab key={contact.id} contact={contact} />}
        </div>
      </div>
    </>
  );
}
