import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { toast } from "sonner";
import { BookmarkSimpleIcon, DotsThreeIcon, FloppyDiskIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { ApiError } from "@/providers/apiClient";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shadcn/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/ui/dropdown-menu";
import type * as Schemas from "@app/schemas";
import { SAVED_FILTER_NAME_MAX_LENGTH } from "@app/schemas";
import {
  SavedFiltersQueries,
  useCreateSavedFilter,
  useDeleteSavedFilter,
  useUpdateSavedFilter,
} from "./-saved-filters-data";
import { StatusFilterPopover } from "./-StatusFilterPopover";
import { isCriteriaDirty, type FilterOption } from "./-table-filters";

interface Props {
  entityType: Schemas.SavedFilterEntityTypeIntEnum;
  statusOptions: FilterOption[];
  statuses: number[];
  onStatusesChange: (next: number[]) => void;
  /** Only Companies filters on fit band — omit both to hide the control. */
  fitBandOptions?: FilterOption[];
  fitBands?: number[];
  onFitBandsChange?: (next: number[]) => void;
  activeSavedFilterId: number | null;
  onApplySavedFilter: (savedFilter: Schemas.SavedFilterWithLabel | null) => void;
  /** Rendered as a plain row for embedding in an existing toolbar. */
  className?: string;
}

export function SavedFilterBar({
  entityType,
  statusOptions,
  statuses,
  onStatusesChange,
  fitBandOptions,
  fitBands = [],
  onFitBandsChange,
  activeSavedFilterId,
  onApplySavedFilter,
  className,
}: Props) {
  const { getToken } = useAuth();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Schemas.SavedFilterWithLabel | null>(null);
  const [filterName, setFilterName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const savedFiltersQuery = useQuery(SavedFiltersQueries.list(entityType, getToken));
  const createMutation = useCreateSavedFilter();
  const updateMutation = useUpdateSavedFilter();
  const deleteMutation = useDeleteSavedFilter();

  const savedFilters = savedFiltersQuery.data?.savedFilters ?? [];
  const activeSavedFilter = savedFilters.find((entry) => entry.id === activeSavedFilterId) ?? null;
  const hasSelection = statuses.length > 0 || fitBands.length > 0;

  // A loaded filter whose selection has since been edited can be updated in place.
  const isDirty = activeSavedFilter
    ? isCriteriaDirty(activeSavedFilter.criteria, statuses, fitBands)
    : false;

  function currentCriteria(): Schemas.SavedFilterCriteria {
    const criteria: Schemas.SavedFilterCriteria = {};
    if (statuses.length > 0) criteria.statuses = statuses;
    if (fitBands.length > 0) criteria.fitBands = fitBands;
    return criteria;
  }

  function openSaveDialog() {
    setRenameTarget(null);
    setFilterName("");
    setSaveError(null);
    setSaveDialogOpen(true);
  }

  function openRenameDialog(savedFilter: Schemas.SavedFilterWithLabel) {
    setRenameTarget(savedFilter);
    setFilterName(savedFilter.name);
    setSaveError(null);
    setSaveDialogOpen(true);
  }

  async function handleSaveSubmit() {
    const name = filterName.trim();
    if (!name) return;
    setSaveError(null);

    try {
      if (renameTarget) {
        const response = await updateMutation.mutateAsync({
          id: renameTarget.id,
          body: { savedFilter: { name } },
        });
        // Rename only ever sends `name` — re-apply so the bar reflects the new name and the
        // active filter's `criteria` stays whatever was last persisted (not the live selection,
        // which may include edits the user hasn't chosen to save via "Update filter" yet).
        if (response.savedFilter && renameTarget.id === activeSavedFilterId) {
          onApplySavedFilter(response.savedFilter);
        }
        toast.success("Filter renamed.");
      } else {
        const response = await createMutation.mutateAsync({
          savedFilter: { name, entityType, criteria: currentCriteria() },
        });
        if (response.savedFilter) onApplySavedFilter(response.savedFilter);
        toast.success("Filter saved.");
      }
      setSaveDialogOpen(false);
      setFilterName("");
      setRenameTarget(null);
    } catch (error) {
      // A duplicate name is the one save failure with a specific, actionable fix — show it
      // inline so the user knows to pick a different name instead of retrying the same one
      // forever. Any other failure already surfaced a toast via the mutation's onError.
      if (error instanceof ApiError && error.status === 409) {
        setSaveError(error.body.message ?? "A saved filter with this name already exists.");
      }
    }
  }

  async function handleUpdateCurrent() {
    if (!activeSavedFilter) return;
    try {
      const response = await updateMutation.mutateAsync({
        id: activeSavedFilter.id,
        body: { savedFilter: { criteria: currentCriteria() } },
      });
      if (response.savedFilter) onApplySavedFilter(response.savedFilter);
      toast.success("Filter updated.");
    } catch {
      // error toast already surfaced by the mutation's onError
    }
  }

  async function handleDelete(savedFilter: Schemas.SavedFilterWithLabel) {
    try {
      await deleteMutation.mutateAsync(savedFilter.id);
      if (savedFilter.id === activeSavedFilterId) onApplySavedFilter(null);
      toast.success("Filter deleted.");
    } catch {
      // error toast already surfaced by the mutation's onError
    }
  }

  function handleClearAll() {
    onStatusesChange([]);
    onFitBandsChange?.([]);
    onApplySavedFilter(null);
  }

  return (
    <>
      <div className={className ?? "flex items-center gap-2 flex-wrap"}>
        <StatusFilterPopover
          label="Status"
          options={statusOptions}
          selected={statuses}
          onChange={onStatusesChange}
        />

        {fitBandOptions && onFitBandsChange && (
          <StatusFilterPopover
            label="Fit"
            options={fitBandOptions}
            selected={fitBands}
            onChange={onFitBandsChange}
            searchable={false}
          />
        )}

        {savedFilters.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {savedFilters.map((savedFilter) => {
              const isActive = savedFilter.id === activeSavedFilterId;
              return (
                <div key={savedFilter.id} className="flex items-center">
                  <Button
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="xs"
                    onClick={() => onApplySavedFilter(isActive ? null : savedFilter)}
                    className="rounded-r-none"
                  >
                    <BookmarkSimpleIcon size={11} weight={isActive ? "fill" : "regular"} />
                    {savedFilter.name}
                    {isActive && isDirty && <span className="ml-0.5 text-[10px]">•</span>}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant={isActive ? "default" : "outline"}
                        size="xs"
                        className="rounded-l-none border-l-0 px-1.5"
                        aria-label={`Options for ${savedFilter.name}`}
                      >
                        <DotsThreeIcon size={13} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onSelect={() => openRenameDialog(savedFilter)}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onSelect={() => void handleDelete(savedFilter)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}

        {isDirty && (
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => void handleUpdateCurrent()}
            disabled={updateMutation.isPending}
          >
            <FloppyDiskIcon size={11} />
            Update filter
          </Button>
        )}

        {hasSelection && !activeSavedFilter && (
          <Button type="button" variant="outline" size="xs" onClick={openSaveDialog}>
            <FloppyDiskIcon size={11} />
            Save filter
          </Button>
        )}

        {hasSelection && (
          <Button type="button" variant="ghost" size="xs" onClick={handleClearAll}>
            Clear
          </Button>
        )}
      </div>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{renameTarget ? "Rename filter" : "Save filter"}</DialogTitle>
          </DialogHeader>
          <Input
            value={filterName}
            onChange={(event) => {
              setFilterName(event.target.value);
              setSaveError(null);
            }}
            placeholder="e.g. Active pipeline"
            maxLength={SAVED_FILTER_NAME_MAX_LENGTH}
            autoFocus
            aria-invalid={saveError != null}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleSaveSubmit();
              }
            }}
          />
          {saveError && <p className="text-xs text-destructive">{saveError}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSaveSubmit()}
              disabled={!filterName.trim() || createMutation.isPending || updateMutation.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
