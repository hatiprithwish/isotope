import { useQuery } from "@tanstack/react-query";
import { InfoIcon } from "@phosphor-icons/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import { StatusChangeNotesQueries } from "./-status-change-notes-data";
import type * as Schemas from "@app/schemas";

interface StatusNoteInfoIconProps {
  entityType: Schemas.StatusChangeEntityTypeEnum;
  entityId: number;
  currentStatus: number;
  getToken: () => Promise<string | null>;
}

/**
 * Small info icon shown next to a status badge when the most recent transition into the
 * current status has a note attached — hover reveals it. Renders nothing otherwise.
 *
 * Each instance fires its own `useQuery` by entityId — fine in a detail panel/page (one
 * mount), but do NOT render this inside a table row (`-DesktopContactsTable`, `-JobsTable`,
 * etc.): a 20-row page would fire 20 separate requests on mount. There is no batch/list-by-ids
 * endpoint yet — add one (e.g. `GET /status-change-notes?entityType=&entityIds=1,2,3`) and a
 * corresponding batched query before using this in any list/table surface.
 */
export function StatusNoteInfoIcon({
  entityType,
  entityId,
  currentStatus,
  getToken,
}: StatusNoteInfoIconProps) {
  const { data } = useQuery(StatusChangeNotesQueries.list(entityType, entityId, getToken));
  const notes = data?.statusChangeNotes ?? [];

  const latestForCurrentStatus = notes
    .filter((entry) => entry.toStatus === currentStatus && entry.note)
    .at(-1);

  if (!latestForCurrentStatus?.note) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center justify-center text-(--text-secondary) hover:text-foreground cursor-help">
          <InfoIcon size={14} />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{latestForCurrentStatus.note}</TooltipContent>
    </Tooltip>
  );
}
