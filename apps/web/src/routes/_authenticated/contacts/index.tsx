import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { z } from "zod";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAddShortcut } from "@/hooks/useAddShortcut";
import { ContactsQueries, useBulkDeleteContacts, useBulkUpdateContacts } from "./-data";
import { MobileContactsList } from "./-MobileContactsList";
import { DesktopContactsTable } from "./-DesktopContactsTable";
import { useBulkCreateStatusChangeNotes } from "../-status-change-notes-data";
import {
  StatusChangeEntityTypeEnum,
  ContactStatusIntEnum,
  ContactStatusLabelEnum,
  SavedFilterEntityTypeIntEnum,
} from "@app/schemas";
import type * as Schemas from "@app/schemas";
import { SavedFilterBar } from "../-SavedFilterBar";
import { parseFilterParam, serializeFilterParam, type FilterOption } from "../-table-filters";

const PAGE_SIZE = 20;

const searchSchema = z.object({
  panel: z.number().optional(),
  statuses: z.string().optional(),
  savedFilter: z.number().optional(),
});

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: ContactStatusIntEnum.NotStarted, label: ContactStatusLabelEnum.NotStarted },
  { value: ContactStatusIntEnum.DraftReady, label: ContactStatusLabelEnum.DraftReady },
  { value: ContactStatusIntEnum.InPipeline, label: ContactStatusLabelEnum.InPipeline },
  { value: ContactStatusIntEnum.Replied, label: ContactStatusLabelEnum.Replied },
  { value: ContactStatusIntEnum.Closed, label: ContactStatusLabelEnum.Closed },
  { value: ContactStatusIntEnum.Dead, label: ContactStatusLabelEnum.Dead },
  { value: ContactStatusIntEnum.ReEngage, label: ContactStatusLabelEnum.ReEngage },
  { value: ContactStatusIntEnum.Failed, label: ContactStatusLabelEnum.Failed },
];

export const Route = createFileRoute("/_authenticated/contacts/")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Contacts · Isotope" }] }),
  component: ContactsPage,
});

function ContactsPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { panel, statuses: statusesParam, savedFilter } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const statuses = parseFilterParam(statusesParam);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const bulkDeleteMutation = useBulkDeleteContacts();
  const bulkUpdateMutation = useBulkUpdateContacts();
  const bulkCreateStatusChangeNotes = useBulkCreateStatusChangeNotes();

  useAddShortcut(() => navigate({ to: "/contacts/bulk-add" }));

  const { data, isPending, isError } = useQuery(
    ContactsQueries.list(
      {
        search: debouncedQuery || undefined,
        statuses: statuses.length > 0 ? statuses : undefined,
        pageNo: currentPage,
        pageSize: PAGE_SIZE,
      },
      getToken,
    ),
  );
  const contacts = data?.contacts ?? [];
  const totalRecords = data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const selectedContact = panel ? (contacts.find((c) => c.id === panel) ?? null) : null;

  function handleStatusesChange(next: number[]) {
    setCurrentPage(1);
    void navigate({ search: (prev) => ({ ...prev, statuses: serializeFilterParam(next) }) });
  }

  function handleApplySavedFilter(applied: Schemas.SavedFilterWithLabel | null) {
    setCurrentPage(1);
    void navigate({
      search: (prev) => ({
        ...prev,
        statuses: applied ? serializeFilterParam(applied.criteria.statuses ?? []) : undefined,
        savedFilter: applied?.id,
      }),
    });
  }

  const filterBar = (
    <SavedFilterBar
      entityType={SavedFilterEntityTypeIntEnum.Contact}
      statusOptions={STATUS_FILTER_OPTIONS}
      statuses={statuses}
      onStatusesChange={handleStatusesChange}
      activeSavedFilterId={savedFilter ?? null}
      onApplySavedFilter={handleApplySavedFilter}
    />
  );

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
    statusNote: string | null,
  ) {
    const response = await bulkUpdateMutation.mutateAsync({ ids, updates });
    toast.success(`${response.updatedCount ?? ids.length} contact(s) updated.`);
    // Only the ids the DAL actually confirmed updated — not the raw request list, which may
    // include ids that matched no row (wrong owner, already deleted, stale client state).
    const updatedIds = response.updatedIds ?? [];
    if (updates.status != null && updatedIds.length > 0) {
      await bulkCreateStatusChangeNotes.mutateAsync({
        entityType: StatusChangeEntityTypeEnum.Contact,
        entityIds: updatedIds,
        toStatus: updates.status,
        note: statusNote,
      });
    }
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
        filterBar={filterBar}
        onSearchChange={setSearchQuery}
        onAddClick={() => navigate({ to: "/contacts/bulk-add" })}
        onBulkDelete={handleBulkDelete}
        onBulkUpdate={handleBulkUpdate}
        isBulkPending={bulkDeleteMutation.isPending || bulkUpdateMutation.isPending}
      />

      <DesktopContactsTable
        contacts={contacts}
        isLoading={isPending}
        isError={isError}
        selectedContact={selectedContact}
        onOpenPanel={openPanel}
        onClosePanel={closePanel}
        onAddClick={() => navigate({ to: "/contacts/bulk-add" })}
        onBulkDelete={handleBulkDelete}
        onBulkUpdate={handleBulkUpdate}
        isBulkPending={bulkDeleteMutation.isPending || bulkUpdateMutation.isPending}
        searchQuery={searchQuery}
        filterBar={filterBar}
        onSearchChange={(v) => {
          setSearchQuery(v);
          setCurrentPage(1);
        }}
        pagination={pagination}
      />
    </>
  );
}
