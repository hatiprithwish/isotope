import { useEffect, useState } from "react";
import { useAuth } from "@clerk/tanstack-react-start";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type * as Schemas from "@app/schemas";
import { Drawer, DrawerContent, DrawerOverlay, DrawerPortal } from "@/shadcn/ui/drawer";
import { ContactDetailContent, type ContactDetailTab } from "./-ContactDetailContent";
import { ContactsQueries } from "./-data";

interface ContactDetailPanelProps {
  contactId: number | null;
  contact: Schemas.Contact | null;
  onClose: () => void;
}

/**
 * The list-page row (`contact` prop) is only refetched when the list query is invalidated,
 * so it goes stale after mutations that invalidate `keys.detail` but not `keys.list` (e.g.
 * logging/editing/deleting history, which can change status/nextTouchDueAt). Fetching the
 * detail query here too — seeded with the row as a placeholder so there's no loading flash —
 * makes the panel self-heal on those invalidations instead of relying on the list row.
 */
function useLiveContact(contactId: number | null, rowContact: Schemas.Contact | null) {
  const { getToken } = useAuth();
  const { data } = useQuery({
    ...ContactsQueries.detail(contactId ?? 0, getToken),
    enabled: contactId != null,
    placeholderData: rowContact ? { isSuccess: true, contact: rowContact } : undefined,
  });
  return data?.contact ?? rowContact;
}

export function ContactDetailPanel({
  contactId,
  contact: rowContact,
  onClose,
}: ContactDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<ContactDetailTab>("history");
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const contact = useLiveContact(contactId, rowContact);
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
      {isOpen && (
        <ContactDetailContent
          contact={contact}
          getToken={getToken}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={onClose}
          onExpand={() =>
            navigate({ to: "/contacts/$contactId", params: { contactId: String(contact.id) } })
          }
          onDeleted={onClose}
        />
      )}
    </aside>
  );
}

export function ContactDetailMobileDrawer({
  contactId,
  contact: rowContact,
  onClose,
}: ContactDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<ContactDetailTab>("history");
  const { getToken } = useAuth();
  const contact = useLiveContact(contactId, rowContact);
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
          {isOpen && (
            <ContactDetailContent
              contact={contact}
              getToken={getToken}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onClose={onClose}
              onDeleted={onClose}
            />
          )}
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
