import { useState } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import type * as Schemas from "@app/schemas";
import { Drawer, DrawerContent, DrawerOverlay, DrawerPortal } from "@/shadcn/ui/drawer";
import { useIsMobile } from "@/hooks/useIsMobile";
import { PanelPlaceholder } from "../-PanelPlaceholder";
import { ContactDetailContent, type ContactDetailTab } from "./-ContactDetailContent";
import { ContactsQueries } from "./-data";

interface ContactDetailPanelProps {
  /** The contact to show, from `?panel=<id>`. The panel fetches it itself, so it never depends on the list page. */
  contactId: number | null;
  /** A list row already in hand, shown instantly while the detail query loads. Optional. */
  contact?: Schemas.Contact | null;
  onClose: () => void;
}

/**
 * The detail query is the source of truth: the list row (`rowContact`) is only a placeholder, since
 * it goes stale after mutations that invalidate `keys.detail` but not `keys.list` (e.g.
 * logging/editing/deleting history, which can change status/follow-up state).
 */
function useLiveContact(contactId: number, rowContact: Schemas.Contact | null | undefined) {
  const { getToken } = useAuth();
  const { data, isError } = useQuery({
    ...ContactsQueries.detail(contactId, getToken),
    placeholderData: rowContact ? { isSuccess: true, contact: rowContact } : undefined,
  });
  return { contact: data?.contact ?? rowContact ?? null, isError };
}

function ContactPanelBody({
  contactId,
  contact: rowContact,
  onClose,
}: ContactDetailPanelProps & { contactId: number }) {
  const [activeTab, setActiveTab] = useState<ContactDetailTab>("history");
  const { getToken } = useAuth();
  const { contact, isError } = useLiveContact(contactId, rowContact);

  if (!contact)
    return <PanelPlaceholder entityLabel="Contact" isError={isError} onClose={onClose} />;

  return (
    <ContactDetailContent
      contact={contact}
      getToken={getToken}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onClose={onClose}
      onDeleted={onClose}
    />
  );
}

export function ContactDetailPanel({ contactId, contact, onClose }: ContactDetailPanelProps) {
  const isOpen = contactId != null;

  return (
    <aside
      className={[
        "hidden md:flex flex-col absolute inset-y-0 right-0 border-l border-border shadow-xl z-20 overflow-hidden",
        "transition-all duration-200 ease-out",
        isOpen ? "w-1/3" : "w-0 border-l-0",
      ].join(" ")}
      aria-hidden={!isOpen}
    >
      {isOpen && <ContactPanelBody contactId={contactId} contact={contact} onClose={onClose} />}
    </aside>
  );
}

export function ContactDetailMobileDrawer({
  contactId,
  contact,
  onClose,
}: ContactDetailPanelProps) {
  const isMobile = useIsMobile();
  const isOpen = contactId != null && isMobile;

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
          {isOpen && <ContactPanelBody contactId={contactId} contact={contact} onClose={onClose} />}
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
