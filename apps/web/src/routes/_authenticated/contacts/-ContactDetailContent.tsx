import { useState } from "react";
import type * as Schemas from "@app/schemas";
import {
  ArrowLeftIcon,
  ArrowsOutSimpleIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import { StatusBadge } from "./-StatusBadge";
import { useDeleteContact } from "./-data";
import Utilities from "@/utils";
import { DraftTab } from "./-DraftTab";
import { HistoryTab } from "./-HistoryTab";
import { AboutTab } from "./-AboutTab";
import AddOrEditContactModal from "./-AddOrEditContactModal";

export type ContactDetailTab = "history" | "about" | "draft";

const TABS: { id: ContactDetailTab; label: string }[] = [
  { id: "history", label: "History" },
  { id: "about", label: "About" },
  { id: "draft", label: "✦ Draft" },
];

function Avatar({ name }: { name: string }) {
  return (
    <span className="w-9 h-9 rounded-full inline-flex items-center justify-center font-semibold shrink-0 text-[13px] bg-(--surface-raised) text-(--text-secondary)">
      {Utilities.getInitials(name)}
    </span>
  );
}

interface ContactDetailContentProps {
  contact: Schemas.Contact;
  getToken: () => Promise<string | null>;
  activeTab: ContactDetailTab;
  onTabChange: (tab: ContactDetailTab) => void;
  /** Present in the slide-out panel; absent on the full page route. */
  onClose?: () => void;
  /** Present in the slide-out panel to jump to the full page route; absent on the full page route. */
  onExpand?: () => void;
  /** Present on the full page route to navigate back; absent in the slide-out panel. */
  onBack?: () => void;
  /** Called after a successful delete so each surface can navigate/close appropriately. */
  onDeleted: () => void;
}

export function ContactDetailContent({
  contact,
  getToken,
  activeTab,
  onTabChange,
  onClose,
  onExpand,
  onBack,
  onDeleted,
}: ContactDetailContentProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const deleteContact = useDeleteContact();

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
              {onBack && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  onClick={onBack}
                  className="-ml-2 shrink-0"
                >
                  <ArrowLeftIcon size={20} />
                </Button>
              )}
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
              {onExpand && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onExpand}
                  title="Open full page"
                >
                  <ArrowsOutSimpleIcon size={14} />
                </Button>
              )}
              {onClose && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClose}
                  title="Close panel"
                >
                  <XIcon size={14} />
                </Button>
              )}
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
          {activeTab === "draft" && <DraftTab contact={contact} />}
          {activeTab === "history" && <HistoryTab contact={contact} getToken={getToken} />}
          {activeTab === "about" && <AboutTab contact={contact} />}
        </div>
      </div>
    </>
  );
}
