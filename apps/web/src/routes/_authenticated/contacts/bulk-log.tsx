import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ContactHistoryChannelEnum,
  ContactHistoryDirectionEnum,
  BULK_LOG_CONTACT_HISTORY_MAX_ENTRIES,
} from "@app/schemas";
import type * as Schemas from "@app/schemas";
import { Button } from "@/shadcn/ui/button";
import { useResolveMessageTemplatesBulk, useBulkLogContactHistory } from "./-data";
import { BulkLogContactSearch } from "./-BulkLogContactSearch";
import { BulkLogRow, type BulkLogRowState } from "./-BulkLogRow";

export const Route = createFileRoute("/_authenticated/contacts/bulk-log")({
  head: () => ({ meta: [{ title: "Bulk log messages · Isotope" }] }),
  component: BulkLogPage,
});

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function BulkLogPage() {
  const navigate = useNavigate();
  const resolveTemplatesBulk = useResolveMessageTemplatesBulk();
  const bulkLog = useBulkLogContactHistory();

  const [rows, setRows] = useState<BulkLogRowState[]>([]);
  const [batchDirection, setBatchDirection] = useState<ContactHistoryDirectionEnum>(
    ContactHistoryDirectionEnum.Me,
  );
  const [batchChannel, setBatchChannel] = useState<ContactHistoryChannelEnum>(
    ContactHistoryChannelEnum.Email,
  );
  const [batchSentAt, setBatchSentAt] = useState(() => todayIso());

  const excludeIds = new Set(rows.map((r) => r.contact.id));
  const activeRows = rows.filter((r) => !r.skipped);
  const canSubmit = activeRows.length > 0 && activeRows.every((r) => r.body.trim().length > 0);
  const remainingCapacity = BULK_LOG_CONTACT_HISTORY_MAX_ENTRIES - rows.length;

  function patchRow(contactId: number, patch: Partial<BulkLogRowState>) {
    setRows((prev) => prev.map((r) => (r.contact.id === contactId ? { ...r, ...patch } : r)));
  }

  async function handleAdd(contacts: Schemas.Contact[]) {
    if (contacts.length === 0) return;

    setRows((prev) => [
      ...prev,
      ...contacts.map((contact, i) => ({
        contact,
        direction: batchDirection,
        channel: batchChannel,
        sentAt: batchSentAt,
        body: "",
        skipped: false,
        expanded: prev.length === 0 && i === 0,
        directionTouched: false,
        channelTouched: false,
        templateStatus: "pending" as const,
        isAmbiguousMatch: false,
      })),
    ]);

    try {
      const response = await resolveTemplatesBulk.mutateAsync({
        contactIds: contacts.map((c) => c.id),
      });
      for (const contact of contacts) {
        const result = response.results?.find((r) => r.contactId === contact.id);
        patchRow(contact.id, {
          body: result?.renderedBody ?? "",
          templateStatus: result?.renderedBody ? "resolved" : "none",
          isAmbiguousMatch: result?.isAmbiguousMatch ?? false,
        });
      }
    } catch {
      // useResolveMessageTemplatesBulk's own onError already toasted — just stop these rows from
      // being stuck on "Loading default template…" forever; the user can still write a body or skip.
      for (const contact of contacts) {
        patchRow(contact.id, { templateStatus: "none" });
      }
    }
  }

  function handleBatchDirectionChange(direction: ContactHistoryDirectionEnum) {
    setBatchDirection(direction);
    setRows((prev) => prev.map((r) => (r.directionTouched ? r : { ...r, direction })));
  }

  function handleBatchChannelChange(channel: ContactHistoryChannelEnum) {
    setBatchChannel(channel);
    setRows((prev) => prev.map((r) => (r.channelTouched ? r : { ...r, channel })));
  }

  function handleBatchSentAtChange(sentAt: string) {
    setBatchSentAt(sentAt);
    setRows((prev) => prev.map((r) => ({ ...r, sentAt })));
  }

  async function handleSubmit() {
    const entries = activeRows.map((r) => ({
      contactId: r.contact.id,
      direction: r.direction,
      channel: r.channel,
      body: r.body.trim(),
      sentAt: r.sentAt,
    }));

    let response: Schemas.BulkLogContactHistoryApiResponse;
    try {
      response = await bulkLog.mutateAsync({ entries });
    } catch {
      // A batch where every entry failed now rejects (isSuccess: false) — useBulkLogContactHistory's
      // own onError already toasted, so just stop here instead of throwing past this function.
      return;
    }

    const results = response.results ?? [];
    const failed = results.filter((r) => !r.isSuccess);

    if (failed.length === 0) {
      toast.success(`Logged ${results.length} message${results.length === 1 ? "" : "s"}.`);
      navigate({ to: "/contacts" });
      return;
    }

    if (failed.length === results.length) {
      toast.error("Failed to log any messages. Please try again.");
      return;
    }

    toast.warning(
      `Logged ${results.length - failed.length} of ${results.length} messages — ${failed.length} failed and stayed in this batch.`,
    );
    // Drop only rows that were actually submitted and succeeded — skipped rows were never in
    // `results` at all, so they must be kept too, not just the failed ones.
    const succeededIds = new Set(results.filter((r) => r.isSuccess).map((r) => r.contactId));
    setRows((prev) => prev.filter((r) => !succeededIds.has(r.contact.id)));
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-sidebar shrink-0">
        <Link to="/contacts" className="text-[12px] text-(--text-secondary) hover:text-foreground">
          Contacts
        </Link>
        <span className="text-[12px] text-(--text-secondary)">/</span>
        <span className="text-[12px] font-medium text-foreground">Bulk log messages</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Log messages in bulk</h1>
            <p className="text-[12px] text-(--text-secondary) mt-0.5">
              {rows.length > 0
                ? `${rows.length} of ${BULK_LOG_CONTACT_HISTORY_MAX_ENTRIES} contacts added · each prefilled from their own next-step template`
                : `Search below to add contacts to this batch (up to ${BULK_LOG_CONTACT_HISTORY_MAX_ENTRIES}).`}
            </p>
          </div>

          <div className="border border-border rounded-lg overflow-hidden bg-card">
            <div className="flex items-center gap-2 flex-wrap px-4 py-2.5 border-b border-border bg-(--surface-raised) text-[12px] text-(--text-secondary)">
              <span>Apply to all rows:</span>
              <div className="flex rounded-lg border border-border overflow-hidden text-[10.5px] font-semibold">
                {(
                  [
                    [ContactHistoryDirectionEnum.Me, "Me"],
                    [ContactHistoryDirectionEnum.Contact, "Contact"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleBatchDirectionChange(value)}
                    className={[
                      "h-5.5 px-2.5 transition-colors",
                      batchDirection === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-(--text-secondary) hover:bg-background",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex rounded-lg border border-border overflow-hidden text-[10.5px] font-semibold">
                {(
                  [
                    [ContactHistoryChannelEnum.Email, "Email"],
                    [ContactHistoryChannelEnum.LinkedIn, "LinkedIn"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleBatchChannelChange(value)}
                    className={[
                      "h-5.5 px-2.5 transition-colors",
                      batchChannel === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-(--text-secondary) hover:bg-background",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="date"
                value={batchSentAt}
                onChange={(e) => handleBatchSentAtChange(e.target.value)}
                className="h-6.5 px-2 rounded-md border border-border bg-card text-[11.5px] text-foreground outline-none focus:border-primary transition-colors scheme-light dark:scheme-dark"
              />
              <span className="ml-auto text-[11px]">Per-row overrides below take priority</span>
            </div>

            {rows.length > 0 && (
              <div>
                {rows.map((row) => (
                  <BulkLogRow
                    key={row.contact.id}
                    row={row}
                    onChange={(patch) => patchRow(row.contact.id, patch)}
                    onToggleExpanded={() => patchRow(row.contact.id, { expanded: !row.expanded })}
                    onToggleSkipped={() => patchRow(row.contact.id, { skipped: !row.skipped })}
                  />
                ))}
              </div>
            )}

            {rows.length === 0 && (
              <div className="px-5 py-8 text-center text-[13px] text-(--text-secondary)">
                No contacts added yet.
              </div>
            )}

            <div className="p-3 border-t border-border">
              <BulkLogContactSearch
                excludeIds={excludeIds}
                remainingCapacity={remainingCapacity}
                onAdd={handleAdd}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border border-border rounded-lg bg-card">
            <span className="text-[12px] text-(--text-secondary)">
              <b className="text-foreground font-semibold">{activeRows.length}</b> will be logged
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
            <div className="ml-auto flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/contacts" })}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit || bulkLog.isPending}
              >
                {bulkLog.isPending
                  ? "Logging…"
                  : `Log ${activeRows.length} message${activeRows.length === 1 ? "" : "s"}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
