import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate, useBlocker, Link } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { toast } from "sonner";
import { ContactSourceIntEnum, BULK_CREATE_CONTACTS_MAX_ENTRIES } from "@app/schemas";
import type * as Schemas from "@app/schemas";
import { PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import { ApiError } from "@/providers/apiClient";
import { useBulkCreateContacts } from "./-data";
import { BulkAddRow, makeEmptyRow, type BulkAddRowState } from "./-BulkAddRow";
import { MobileBulkAddCard } from "./-MobileBulkAddCard";

export const Route = createFileRoute("/_authenticated/contacts/bulk-add")({
  head: () => ({ meta: [{ title: "Bulk add contacts · Isotope" }] }),
  component: BulkAddPage,
});

function BulkAddPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const bulkCreate = useBulkCreateContacts();

  const [rows, setRows] = useState<BulkAddRowState[]>(() => [makeEmptyRow()]);
  const submitSucceededRef = useRef(false);

  const activeRows = rows.filter((r) => !r.skipped);
  const canSubmit =
    activeRows.length > 0 && activeRows.every((r) => r.name.trim() && r.companyId != null);
  const remainingCapacity = BULK_CREATE_CONTACTS_MAX_ENTRIES - rows.length;

  useBlocker({
    shouldBlockFn: () => {
      if (submitSucceededRef.current) return false;
      const hasUnsavedData = rows.some(
        (r) =>
          r.name.trim() ||
          r.companyId != null ||
          r.designation.trim() ||
          r.email.trim() ||
          r.linkedinUrl.trim(),
      );
      if (!hasUnsavedData) return false;
      return !window.confirm("You have unsaved contacts. Leave this page and discard them?");
    },
    enableBeforeUnload: () => {
      if (submitSucceededRef.current) return false;
      return rows.some(
        (r) =>
          r.name.trim() ||
          r.companyId != null ||
          r.designation.trim() ||
          r.email.trim() ||
          r.linkedinUrl.trim(),
      );
    },
  });

  function patchRow(rowId: string, patch: Partial<BulkAddRowState>) {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)));
  }

  function handleToggleSkipped(rowId: string) {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, skipped: !r.skipped } : r)));
  }

  function handleDeleteRow(rowId: string) {
    setRows((prev) => {
      const remaining = prev.filter((r) => r.rowId !== rowId);
      return remaining.length > 0 ? remaining : [makeEmptyRow()];
    });
  }

  const handleAddRow = useCallback(() => {
    setRows((prev) => {
      if (prev.length >= BULK_CREATE_CONTACTS_MAX_ENTRIES) return prev;
      const lastFilled = [...prev]
        .reverse()
        .find((r) => r.companyId != null || r.designation.trim());
      return [
        ...prev,
        makeEmptyRow({
          companyId: lastFilled?.companyId ?? null,
          companyName: lastFilled?.companyName ?? null,
          designation: lastFilled?.designation ?? "",
        }),
      ];
    });
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        handleAddRow();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAddRow]);

  async function handleSubmit() {
    const entries = activeRows.map((r) => ({
      tempId: r.rowId,
      name: r.name.trim(),
      companyId: r.companyId as number,
      designation: r.designation.trim() || null,
      email: r.email.trim() || null,
      linkedinUrl: r.linkedinUrl.trim() || null,
      status: r.status,
      source: ContactSourceIntEnum.Manual,
    }));

    let response: Schemas.BulkCreateContactsApiResponse;
    try {
      response = await bulkCreate.mutateAsync({ entries });
    } catch (error) {
      // POST /contacts/bulk always returns 201 with a results array — apiClient still throws
      // because body.isSuccess is false when every entry fails, but that ApiError carries the
      // same results we need below, so a total-failure batch is handled here, not treated as an
      // opaque network/server error. Only bail out (relying on useBulkCreateContacts' own
      // onError toast) when the thrown error has no usable results at all.
      if (!(error instanceof ApiError) || !("results" in error.body)) return;
      response = error.body as Schemas.BulkCreateContactsApiResponse;
    }

    const results = response.results ?? [];
    const failed = results.filter((r) => !r.isSuccess);

    if (failed.length === 0) {
      toast.success(`Added ${results.length} contact${results.length === 1 ? "" : "s"}.`);
      submitSucceededRef.current = true;
      navigate({ to: "/contacts" });
      return;
    }

    if (failed.length === results.length) {
      toast.error("Failed to add any contacts. Please try again.");
      return;
    }

    toast.warning(
      `Added ${results.length - failed.length} of ${results.length} contacts — ${failed.length} failed and stayed in this batch.`,
    );
    const succeededIds = new Set(results.filter((r) => r.isSuccess).map((r) => r.tempId));
    setRows((prev) => {
      const remaining = prev.filter((r) => !succeededIds.has(r.rowId));
      return remaining.length > 0 ? remaining : [makeEmptyRow()];
    });
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-sidebar shrink-0">
        <Link to="/contacts" className="text-[12px] text-(--text-secondary) hover:text-foreground">
          Contacts
        </Link>
        <span className="text-[12px] text-(--text-secondary)">/</span>
        <span className="text-[12px] font-medium text-foreground">Bulk add contacts</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-330 mx-auto px-4 md:px-6 py-6 flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Add contacts in bulk</h1>
            <p className="text-[12px] text-(--text-secondary) mt-0.5">
              {`${rows.length} of ${BULK_CREATE_CONTACTS_MAX_ENTRIES} rows · Company and Title prefill from your last entry`}
            </p>
          </div>

          <div className="hidden md:block border border-border rounded-lg bg-card">
            <table className="w-full border-collapse table-fixed">
              <colgroup>
                <col className="w-7" />
                <col className="w-[14%]" />
                <col className="w-[15%]" />
                <col className="w-[14%]" />
                <col className="w-[16%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-8" />
                <col className="w-8" />
              </colgroup>
              <thead>
                <tr className="bg-(--surface-raised) border-b border-border">
                  <th className="pl-3 py-2 rounded-tl-lg" />
                  <th className="p-1.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-(--text-secondary)">
                    Name *
                  </th>
                  <th className="p-1.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-(--text-secondary)">
                    Company *
                  </th>
                  <th className="p-1.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-(--text-secondary)">
                    Title
                  </th>
                  <th className="p-1.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-(--text-secondary)">
                    Email
                  </th>
                  <th className="p-1.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-(--text-secondary)">
                    LinkedIn URL
                  </th>
                  <th className="p-1.5 text-left text-[10.5px] font-semibold uppercase tracking-wider text-(--text-secondary)">
                    Status
                  </th>
                  <th className="p-1.5" />
                  <th className="p-1.5 rounded-tr-lg" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <BulkAddRow
                    key={row.rowId}
                    row={row}
                    index={index}
                    onChange={(patch) => patchRow(row.rowId, patch)}
                    onToggleSkipped={() => handleToggleSkipped(row.rowId)}
                    onDelete={() => handleDeleteRow(row.rowId)}
                    getToken={getToken}
                  />
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-3 py-2.5 border-t border-border bg-(--surface-raised) rounded-b-lg">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                disabled={remainingCapacity <= 0}
              >
                <PlusIcon size={12} /> Add row
              </Button>
              <span className="text-[12px] text-(--text-secondary)">
                {rows.length} / {BULK_CREATE_CONTACTS_MAX_ENTRIES} rows
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {rows.map((row, index) => (
              <MobileBulkAddCard
                key={row.rowId}
                row={row}
                index={index}
                onChange={(patch) => patchRow(row.rowId, patch)}
                onToggleSkipped={() => handleToggleSkipped(row.rowId)}
                onDelete={() => handleDeleteRow(row.rowId)}
                getToken={getToken}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              disabled={remainingCapacity <= 0}
              className="w-full"
            >
              <PlusIcon size={12} /> Add row ({rows.length} / {BULK_CREATE_CONTACTS_MAX_ENTRIES})
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3 px-4 py-3 border border-border rounded-lg bg-card">
            <span className="text-[12px] text-(--text-secondary)">
              <b className="text-foreground font-semibold">{activeRows.length}</b> will be added
              {rows.length !== activeRows.length && (
                <>
                  {" "}
                  ·{" "}
                  <b className="text-foreground font-semibold">
                    {rows.length - activeRows.length}
                  </b>{" "}
                  skipped
                </>
              )}
            </span>
            <div className="md:ml-auto flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 md:flex-none"
                onClick={() => navigate({ to: "/contacts" })}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 md:flex-none"
                onClick={handleSubmit}
                disabled={!canSubmit || bulkCreate.isPending}
              >
                {bulkCreate.isPending
                  ? "Adding…"
                  : `Add ${activeRows.length} contact${activeRows.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
