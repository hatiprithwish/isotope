import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { z } from "zod";
import { toast } from "sonner";
import { ContactsQueries, useBulkDeleteContacts } from "./-data";
import AddOrEditContactModal from "./-AddOrEditContactModal";
import { MobileContactsList } from "./-MobileContactsList";
import { DesktopContactsTable } from "./-DesktopContactsTable";

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
  const bulkDeleteMutation = useBulkDeleteContacts();

  const { data, isPending, isError } = useQuery(ContactsQueries.list(getToken));
  const contacts = data?.contacts ?? [];
  const selectedContact = panel ? (contacts.find((c) => c.id === panel) ?? null) : null;

  if (isPending) return <div className="p-6 text-(--text-secondary) text-sm">Loading...</div>;
  if (isError)
    return <div className="p-6 text-(--text-secondary) text-sm">Failed to load contacts.</div>;

  function openPanel(id: number) {
    navigate({ search: (prev) => ({ ...prev, panel: id }) });
  }

  function closePanel() {
    navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
  }

  async function handleBulkDelete(ids: number[]) {
    const response = await bulkDeleteMutation.mutateAsync(ids);
    toast.success(`${response.deletedCount ?? ids.length} contact(s) deleted.`);
    if (panel != null && ids.includes(panel)) {
      void navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
    }
  }

  return (
    <>
      <MobileContactsList contacts={contacts} />

      <DesktopContactsTable
        contacts={contacts}
        selectedContact={selectedContact}
        onOpenPanel={openPanel}
        onClosePanel={closePanel}
        onAddClick={() => setShowAddModal(true)}
        onBulkDelete={(ids) => void handleBulkDelete(ids)}
        isBulkPending={bulkDeleteMutation.isPending}
      />

      {showAddModal && <AddOrEditContactModal mode="add" onClose={() => setShowAddModal(false)} />}
    </>
  );
}
