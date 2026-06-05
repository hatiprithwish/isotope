import { useEffect, useState } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { useNavigate } from "@tanstack/react-router";
import type * as Schemas from "@app/schemas";
import { ArrowsOutSimpleIcon, PencilSimpleIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import { StatusBadge } from "./-StatusBadge";
import { useUpdateContact, useDeleteContact } from "./-data";
import Utilities from "@/utils";
import { DraftTab } from "./-DraftTab";
import { HistoryTab } from "./-HistoryTab";
import { AboutTab } from "./-AboutTab";
import AddOrEditContactModal from "./-AddOrEditContactModal";
import { Drawer, DrawerContent, DrawerOverlay, DrawerPortal } from "@/shadcn/ui/drawer";

type Tab = "draft" | "history" | "about";

function Avatar({ name }: { name: string }) {
  return (
    <span className="w-9 h-9 rounded-full inline-flex items-center justify-center font-semibold shrink-0 text-[13px] bg-(--surface-raised) text-(--text-secondary)">
      {Utilities.getInitials(name)}
    </span>
  );
}

function ContactPanelContent({
  contact,
  onClose,
}: {
  contact: Schemas.Contact;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("draft");
  const [showEditModal, setShowEditModal] = useState(false);
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

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

  function handleDelete() {
    deleteContact.mutateAsync(contact.id).then(onClose);
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
                onClick={() =>
                  navigate({
                    to: "/contacts/$contactId",
                    params: { contactId: String(contact.id) },
                  })
                }
                title="Open full page"
              >
                <ArrowsOutSimpleIcon size={14} />
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

        <div className="px-5 py-3.5 border-t border-border bg-card flex gap-2 shrink-0">
          <div className="flex-1" />
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
          >
            Mark as sent
          </Button>
        </div>
      </div>
    </>
  );
}

interface ContactDetailPanelProps {
  contactId: number | null;
  contact: Schemas.Contact | null;
  onClose: () => void;
}

export function ContactDetailPanel({ contactId, contact, onClose }: ContactDetailPanelProps) {
  const isOpen = contactId != null && contact != null;

  return (
    <aside
      className={[
        "hidden md:flex flex-col absolute inset-y-0 right-0 border-l border-border shadow-xl z-20 overflow-hidden",
        "transition-all duration-200 ease-out",
        isOpen ? "w-1/3" : "w-0 border-l-0",
      ].join(" ")}
      aria-hidden={!isOpen}
    >
      {isOpen && <ContactPanelContent contact={contact} onClose={onClose} />}
    </aside>
  );
}

export function ContactDetailMobileDrawer({
  contactId,
  contact,
  onClose,
}: ContactDetailPanelProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isOpen = contactId != null && contact != null && isMobile;

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      direction="bottom"
    >
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent className="h-[90vh] w-full p-0 bg-card border-t border-border rounded-t-xl">
          {isOpen && <ContactPanelContent contact={contact} onClose={onClose} />}
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
