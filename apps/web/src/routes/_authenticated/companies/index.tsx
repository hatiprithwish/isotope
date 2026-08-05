import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAddShortcut } from "@/hooks/useAddShortcut";
import { CompaniesQueries, useBulkDeleteCompanies } from "./-data";
import AddOrEditCompanyModal from "./-AddOrEditCompanyModal";
import { MobileCompaniesList } from "./-MobileCompaniesList";
import { DesktopCompaniesTable } from "./-DesktopCompaniesTable";
import {
  CompanyStatusIntEnum,
  CompanyStatusLabelEnum,
  CompanyFitBandIntEnum,
  CompanyFitBandLabelEnum,
  SavedFilterEntityTypeIntEnum,
} from "@app/schemas";
import type * as Schemas from "@app/schemas";
import { SavedFilterBar } from "../-SavedFilterBar";
import { parseFilterParam, serializeFilterParam, type FilterOption } from "../-table-filters";

const searchSchema = z.object({
  panel: z.number().optional(),
  statuses: z.string().optional(),
  fitBands: z.string().optional(),
  savedFilter: z.number().optional(),
});

const STATUS_FILTER_OPTIONS: FilterOption[] = [
  { value: CompanyStatusIntEnum.WaitingHuman, label: CompanyStatusLabelEnum.WaitingHuman },
  { value: CompanyStatusIntEnum.Accepted, label: CompanyStatusLabelEnum.Accepted },
  { value: CompanyStatusIntEnum.ContactsAdded, label: CompanyStatusLabelEnum.ContactsAdded },
  { value: CompanyStatusIntEnum.RejectedHuman, label: CompanyStatusLabelEnum.RejectedHuman },
  { value: CompanyStatusIntEnum.Interviewed, label: CompanyStatusLabelEnum.Interviewed },
  { value: CompanyStatusIntEnum.Offer, label: CompanyStatusLabelEnum.Offer },
];

const FIT_BAND_FILTER_OPTIONS: FilterOption[] = [
  { value: CompanyFitBandIntEnum.StrongFit, label: CompanyFitBandLabelEnum.StrongFit },
  { value: CompanyFitBandIntEnum.ConditionalFit, label: CompanyFitBandLabelEnum.ConditionalFit },
  { value: CompanyFitBandIntEnum.WeakFit, label: CompanyFitBandLabelEnum.WeakFit },
  { value: CompanyFitBandIntEnum.Disqualified, label: CompanyFitBandLabelEnum.Disqualified },
];

export const Route = createFileRoute("/_authenticated/companies/")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Companies · Isotope" }] }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { getToken } = useAuth();
  const {
    panel,
    statuses: statusesParam,
    fitBands: fitBandsParam,
    savedFilter,
  } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const statuses = parseFilterParam(statusesParam);
  const fitBands = parseFilterParam(fitBandsParam);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const bulkDeleteMutation = useBulkDeleteCompanies();

  useAddShortcut(() => setShowAddModal(true));

  const { data, isPending, isError } = useQuery(
    CompaniesQueries.list(
      {
        search: debouncedQuery || undefined,
        statuses: statuses.length > 0 ? statuses : undefined,
        fitBands: fitBands.length > 0 ? fitBands : undefined,
      },
      getToken,
    ),
  );
  const companies = data?.companies ?? [];
  const selectedCompany = panel ? (companies.find((c) => c.id === panel) ?? null) : null;

  function handleStatusesChange(next: number[]) {
    void navigate({ search: (prev) => ({ ...prev, statuses: serializeFilterParam(next) }) });
  }

  function handleFitBandsChange(next: number[]) {
    void navigate({ search: (prev) => ({ ...prev, fitBands: serializeFilterParam(next) }) });
  }

  function handleApplySavedFilter(applied: Schemas.SavedFilterWithLabel | null) {
    void navigate({
      search: (prev) => ({
        ...prev,
        statuses: applied ? serializeFilterParam(applied.criteria.statuses ?? []) : undefined,
        fitBands: applied ? serializeFilterParam(applied.criteria.fitBands ?? []) : undefined,
        savedFilter: applied?.id,
      }),
    });
  }

  const filterBar = (
    <SavedFilterBar
      entityType={SavedFilterEntityTypeIntEnum.Company}
      statusOptions={STATUS_FILTER_OPTIONS}
      statuses={statuses}
      onStatusesChange={handleStatusesChange}
      fitBandOptions={FIT_BAND_FILTER_OPTIONS}
      fitBands={fitBands}
      onFitBandsChange={handleFitBandsChange}
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

  async function handleBulkDelete(ids: number[]) {
    const response = await bulkDeleteMutation.mutateAsync(ids);
    toast.success(`${response.deletedCount ?? ids.length} company(s) deleted.`);
    if (panel != null && ids.includes(panel)) {
      void navigate({ search: (prev) => ({ ...prev, panel: undefined }) });
    }
  }

  return (
    <>
      {showAddModal && <AddOrEditCompanyModal mode="add" onClose={() => setShowAddModal(false)} />}

      <MobileCompaniesList
        companies={companies}
        isLoading={isPending}
        isError={isError}
        onAddClick={() => setShowAddModal(true)}
        searchQuery={searchQuery}
        filterBar={filterBar}
        onSearchChange={setSearchQuery}
        onBulkDelete={handleBulkDelete}
        isBulkPending={bulkDeleteMutation.isPending}
      />

      <DesktopCompaniesTable
        companies={companies}
        isLoading={isPending}
        isError={isError}
        selectedCompany={selectedCompany}
        onOpenPanel={openPanel}
        onClosePanel={closePanel}
        onAddClick={() => setShowAddModal(true)}
        onBulkDelete={handleBulkDelete}
        isBulkPending={bulkDeleteMutation.isPending}
        searchQuery={searchQuery}
        filterBar={filterBar}
        onSearchChange={setSearchQuery}
      />
    </>
  );
}
