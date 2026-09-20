import { XIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";

interface PanelPlaceholderProps {
  /** Entity noun for the not-found message, e.g. "Contact". */
  entityLabel: string;
  isError: boolean;
  onClose: () => void;
}

/**
 * Shown inside a detail panel/drawer while its entity (opened by `?panel=<id>`) is still loading,
 * or when the id can't be fetched (deleted, wrong id, another user's).
 */
export function PanelPlaceholder({ entityLabel, isError, onClose }: PanelPlaceholderProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-card">
      <div className="flex items-center justify-end px-5 pt-4 pb-3.5 border-b border-border shrink-0">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} title="Close panel">
          <XIcon size={14} />
        </Button>
      </div>
      {isError ? (
        <div className="m-5 px-4 py-3 rounded-lg bg-(--danger-bg) border border-destructive text-[13px] text-(--danger-text)">
          {entityLabel} not found.
        </div>
      ) : (
        <div className="p-5 flex flex-col gap-3">
          <div className="h-4 w-1/2 rounded bg-(--surface-raised) animate-pulse" />
          <div className="h-3 w-1/3 rounded bg-(--surface-raised) animate-pulse" />
          <div className="h-3 w-2/3 rounded bg-(--surface-raised) animate-pulse" />
        </div>
      )}
    </div>
  );
}
