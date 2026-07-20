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

const searchSchema = z.object({
  panel: z.number().optional(),
});

export const Route = createFileRoute("/_authenticated/companies/")({
  validateSearch: searchSchema,
  component: CompaniesPage,
});

function CompaniesPage() {
  const { getToken } = useAuth();
  const { panel } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 300);
  const bulkDeleteMutation = useBulkDeleteCompanies();

  useAddShortcut(() => setShowAddModal(true));

  const { data, isPending, isError } = useQuery(
    CompaniesQueries.list({ search: debouncedQuery || undefined }, getToken),
  );
  const companies = data?.companies ?? [];
  const selectedCompany = panel ? (companies.find((c) => c.id === panel) ?? null) : null;

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
        onSearchChange={setSearchQuery}
      />

      <DesktopCompaniesTable
        companies={companies}
        isLoading={isPending}
        isError={isError}
        selectedCompany={selectedCompany}
        onOpenPanel={openPanel}
        onClosePanel={closePanel}
        onAddClick={() => setShowAddModal(true)}
        onBulkDelete={(ids) => void handleBulkDelete(ids)}
        isBulkPending={bulkDeleteMutation.isPending}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    </>
  );
}
