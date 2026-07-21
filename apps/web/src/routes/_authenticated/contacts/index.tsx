import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { z } from "zod";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAddShortcut } from "@/hooks/useAddShortcut";
import { ContactsQueries, useBulkDeleteContacts, useBulkUpdateContacts } from "./-data";
import AddOrEditContactModal from "./-AddOrEditContactModal";
import { MobileContactsList } from "./-MobileContactsList";
import { DesktopContactsTable } from "./-DesktopContactsTable";
import type * as Schemas from "@app/schemas";

const PAGE_SIZE = 20;

const searchSchema = z.object({
  panel: z.number().optional(),
});

export const Route = createFileRoute("/_authenticated/contacts/")({
  validateSearch: searchSchema,
  component: ContactsPage,
});

function ContactsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { panel } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const bulkDeleteMutation = useBulkDeleteContacts();
  const bulkUpdateMutation = useBulkUpdateContacts();

  useAddShortcut(() => setShowAddModal(true));

  const { data, isPending, isError } = useQuery(
    ContactsQueries.list(
      { search: debouncedQuery || undefined, pageNo: currentPage, pageSize: PAGE_SIZE },
      getToken,
    ),
  );
  const contacts = data?.contacts ?? [];
  const totalRecords = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const selectedContact = panel ? (contacts.find((c) => c.id === panel) ?? null) : null;

  function openPanel(id: number) {
    navigate({ search: (prev) => ({ ...prev, panel: id }) });
  }

  function closePanel() {
    navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
  }

  async function handleRefresh() {
    await queryClient.invalidateQueries({ queryKey: ContactsQueries.keys.all() });
  }

  async function handleBulkDelete(ids: number[]) {
    const response = await bulkDeleteMutation.mutateAsync(ids);
    const deletedCount = response.deletedCount ?? ids.length;
    toast.success(`${deletedCount} contact(s) deleted.`);
    if (panel != null && ids.includes(panel)) {
      void navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
    }
    // Clamp so a delete that empties the current (e.g. last) page doesn't strand the user on
    // an out-of-range page that the next fetch would render as permanently empty.
    const remainingPages = Math.max(1, Math.ceil((totalRecords - deletedCount) / PAGE_SIZE));
    setCurrentPage((p) => Math.min(p, remainingPages));
  }

  async function handleBulkUpdate(
    ids: number[],
    updates: Schemas.BulkUpdateContactsApiRequest["updates"],
  ) {
    const response = await bulkUpdateMutation.mutateAsync({ ids, updates });
    toast.success(`${response.updatedCount ?? ids.length} contact(s) updated.`);
  }

  const pagination = {
    totalRecords,
    currentPage,
    itemsPerPage: PAGE_SIZE,
    onPrev: () => setCurrentPage((p) => Math.max(1, p - 1)),
    onNext: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
    onJumpToPage: (page: number) => setCurrentPage(page),
    isLoading: isPending,
    onRefresh: handleRefresh,
    showJumpButtons: true,
  };

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
        onBulkDelete={handleBulkDelete}
        onBulkUpdate={handleBulkUpdate}
        isBulkPending={bulkDeleteMutation.isPending || bulkUpdateMutation.isPending}
        searchQuery={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        pagination={pagination}
      />

      {showAddModal && <AddOrEditContactModal mode="add" onClose={() => setShowAddModal(false)} />}
    </>
  );
}
