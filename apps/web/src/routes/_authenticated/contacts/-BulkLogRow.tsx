import { TrashIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { ContactHistoryChannelEnum, ContactHistoryDirectionEnum } from "@app/schemas";
import type * as Schemas from "@app/schemas";
import { Link } from "@tanstack/react-router";
import Utilities from "@/utils";
import { StatusBadge } from "./-StatusBadge";

export interface BulkLogRowState {
  contact: Schemas.Contact;
  direction: ContactHistoryDirectionEnum;
  channel: ContactHistoryChannelEnum;
  sentAt: string;
  body: string;
  skipped: boolean;
  expanded: boolean;
  /** Set once the user edits direction/channel directly on this row — blocks future batch-level cascades. */
  directionTouched: boolean;
  channelTouched: boolean;
  templateStatus: "pending" | "resolved" | "none";
  isAmbiguousMatch: boolean;
}

interface Props {
  row: BulkLogRowState;
  onChange: (patch: Partial<BulkLogRowState>) => void;
  onToggleExpanded: () => void;
  onToggleSkipped: () => void;
}

function previewLine(body: string): string {
  const firstLine = body.split("\n").find((line) => line.trim().length > 0);
  return firstLine ?? "";
}

export function BulkLogRow({ row, onChange, onToggleExpanded, onToggleSkipped }: Props) {
  const { contact } = row;
  const preview = row.body ? previewLine(row.body) : "";

  return (
    <div
      className={[
        "border-b border-border last:border-b-0 transition-colors",
        row.skipped ? "opacity-45" : "",
      ].join(" ")}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpanded}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpanded();
          }
        }}
        className={[
          "grid grid-cols-[34px_1fr_auto_28px] items-center gap-2.5 px-5 py-2.5 cursor-pointer",
          row.expanded ? "bg-(--surface-raised)" : "hover:bg-(--surface-raised)",
        ].join(" ")}
      >
        <span className="w-7.5 h-7.5 rounded-full inline-flex items-center justify-center font-semibold shrink-0 text-[11px] bg-(--surface-raised) text-(--text-secondary) border border-border">
          {Utilities.getInitials(contact.name)}
        </span>

        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[13px] font-semibold text-foreground truncate">
              {contact.name}
            </span>
            <span className="text-[11.5px] text-(--text-secondary) truncate">
              {[contact.designation, contact.companyName].filter(Boolean).join(" · ")}
            </span>
          </div>
          <div className="mt-0.5 text-[12px] text-(--text-secondary) truncate">
            {row.skipped ? (
              <em className="not-italic">Skipped — won't be logged</em>
            ) : row.templateStatus === "pending" ? (
              "Loading default template…"
            ) : preview ? (
              preview
            ) : (
              <em className="not-italic text-muted-foreground">
                No default template for this step — write one below
              </em>
            )}
          </div>
        </div>

        <StatusBadge status={contact.status} sm />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSkipped();
          }}
          title={row.skipped ? "Restore contact" : "Skip this contact"}
          className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-(--danger-bg) hover:text-(--danger) transition-colors"
        >
          {row.skipped ? <ArrowCounterClockwiseIcon size={14} /> : <TrashIcon size={14} />}
        </button>
      </div>

      {row.expanded && (
        <div className="px-5 pb-4 pl-15.5">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                  onClick={() => onChange({ direction: value, directionTouched: true })}
                  className={[
                    "h-5 px-2 transition-colors",
                    row.direction === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-(--text-secondary) hover:bg-(--surface-raised)",
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
                  onClick={() => onChange({ channel: value, channelTouched: true })}
                  className={[
                    "h-5 px-2 transition-colors",
                    row.channel === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-(--text-secondary) hover:bg-(--surface-raised)",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              type="date"
              value={row.sentAt}
              onChange={(e) => onChange({ sentAt: e.target.value })}
              className="ml-auto h-6.5 px-2 rounded-md border border-border bg-card text-[11.5px] text-foreground outline-none focus:border-primary transition-colors scheme-light dark:scheme-dark"
            />
          </div>

          <textarea
            value={row.body}
            onChange={(e) => onChange({ body: e.target.value })}
            placeholder="Type the message body…"
            rows={4}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[12.5px] leading-[1.65] text-foreground resize-y outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
          />

          {row.isAmbiguousMatch && (
            <p className="mt-1.5 text-[11px] text-(--warning-text)">
              This company has multiple job types listed, so we used your default template instead
              of guessing.
            </p>
          )}
          {row.templateStatus === "none" && !row.body && (
            <p className="mt-1.5 text-[11px] text-(--text-secondary)">
              No default message template set.{" "}
              <Link to="/settings" className="text-primary hover:underline">
                Configure in Settings →
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
