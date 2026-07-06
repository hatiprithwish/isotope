import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { z } from "zod";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const bulkDeleteMutation = useBulkDeleteContacts();

  const { data, isPending, isError } = useQuery(
    ContactsQueries.list({ search: debouncedQuery || undefined }, getToken),
  );
  const contacts = data?.contacts ?? [];
  const selectedContact = panel ? (contacts.find((c) => c.id === panel) ?? null) : null;

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
      <MobileContactsList
        contacts={contacts}
        isLoading={isPending}
        isError={isError}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <DesktopContactsTable
        contacts={contacts}
        isLoading={isPending}
        isError={isError}
        selectedContact={selectedContact}
        onOpenPanel={openPanel}
        onClosePanel={closePanel}
        onAddClick={() => setShowAddModal(true)}
        onBulkDelete={(ids) => void handleBulkDelete(ids)}
        isBulkPending={bulkDeleteMutation.isPending}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {showAddModal && <AddOrEditContactModal mode="add" onClose={() => setShowAddModal(false)} />}
    </>
  );
}
