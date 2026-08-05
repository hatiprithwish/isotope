import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import { Button } from "@/shadcn/ui/button";
import { Textarea } from "@/shadcn/ui/textarea";
import { useCreateStatusChangeNote } from "./-status-change-notes-data";
import type * as Schemas from "@app/schemas";

interface StatusOption {
  value: number;
  label: string;
}

interface StatusChangePopoverProps {
  entityType: Schemas.StatusChangeEntityTypeEnum;
  entityId: number;
  currentStatus: number;
  statusOptions: StatusOption[];
  onStatusChange: (newStatus: number) => Promise<unknown>;
  isPending: boolean;
  /** The badge/button that opens the popover. */
  trigger: React.ReactNode;
  /** Status pre-selected when the popover opens; defaults to currentStatus. */
  initialStatus?: number;
}

export function StatusChangePopover({
  entityType,
  entityId,
  currentStatus,
  statusOptions,
  onStatusChange,
  isPending,
  trigger,
  initialStatus,
}: StatusChangePopoverProps) {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(initialStatus ?? currentStatus);
  const [note, setNote] = useState("");
  const createStatusChangeNote = useCreateStatusChangeNote();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setSelectedStatus(initialStatus ?? currentStatus);
      setNote("");
    }
  }

  async function handleSave() {
    if (selectedStatus !== currentStatus) {
      try {
        await onStatusChange(selectedStatus);
      } catch {
        // status update failed — its own onError toast already fired; skip writing a note
        // that would otherwise claim a transition that never happened.
        return;
      }
      try {
        await createStatusChangeNote.mutateAsync({
          statusChangeNote: {
            entityType,
            entityId,
            fromStatus: currentStatus,
            toStatus: selectedStatus,
            note: note.trim() ? note.trim() : null,
          },
        });
      } catch {
        // note write failed — its own onError toast already fired. The status change itself
        // already succeeded above, so still close rather than strand the user on a popover
        // whose primary action is done and whose "Save" would now be a no-op re-open.
      }
    }
    setOpen(false);
  }

  const busy = isPending || createStatusChangeNote.isPending;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-3.5" align="start">
        <div className="flex flex-col gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-1.5">
              Status
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-md px-2.5 py-1.5 text-[13px] text-foreground outline-none focus:border-primary transition-colors"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-1.5">
              Note (optional)
            </div>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why is the status changing?"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={() => void handleSave()} disabled={busy}>
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
