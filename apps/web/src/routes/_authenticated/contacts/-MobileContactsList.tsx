import { MagnifyingGlassIcon, FunnelIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import type * as Schemas from "@app/schemas";
import MobileContactRow from "./-MobileContactRow";

interface Props {
  contacts: Schemas.Contact[];
}

export function MobileContactsList({ contacts }: Props) {
  const draftReady = contacts.filter((c) => c.status === 2);
  const inPipeline = contacts.filter((c) => c.status === 3);
  const other = contacts.filter((c) => c.status !== 2 && c.status !== 3);

  const chips = [
    { label: "All", count: contacts.length, active: true },
    { label: "Draft ready", count: draftReady.length },
    { label: "In pipeline", count: inPipeline.length },
    {
      label: "Needs input",
      count: contacts.filter(
        (c) => c.status === 1 && !c.personalizationNotes && !c.manualPersonalizationNotes,
      ).length,
    },
    { label: "Replied" },
    { label: "Re-engage" },
    { label: "Dead" },
  ];

  return (
    <div className="flex flex-col h-full md:hidden overflow-hidden">
      <header className="h-13 px-4 flex items-center gap-2 bg-background border-b border-border shrink-0">
        <span className="flex-1 text-[17px] font-semibold text-foreground tracking-tight">
          Contacts
        </span>
        <Button type="button" variant="ghost" size="icon">
          <MagnifyingGlassIcon size={18} />
        </Button>
        <Button type="button" variant="ghost" size="icon">
          <FunnelIcon size={18} />
        </Button>
      </header>

      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-border bg-background shrink-0 no-scrollbar">
        {chips.map(({ label, count, active }) => (
          <button
            key={label}
            type="button"
            className={[
              "inline-flex items-center gap-1 h-8 px-3 rounded-full border text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors",
              active
                ? "bg-(--accent-bg,var(--primary)/0.1) border-primary text-primary font-semibold"
                : "bg-sidebar border-border text-(--text-secondary)",
            ].join(" ")}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span
                className={[
                  "inline-flex items-center justify-center min-w-4.5 h-4 px-1 rounded text-[10px] font-semibold",
                  active
                    ? "text-primary opacity-70"
                    : "bg-(--surface-raised) text-(--text-secondary)",
                ].join(" ")}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-sidebar">
        {contacts.length === 0 ? (
          <div className="px-4 py-8 text-center text-(--text-secondary) text-sm">
            No contacts yet.
          </div>
        ) : (
          <>
            {draftReady.length > 0 && (
              <>
                <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
                    Drafts ready · ready to send{" "}
                    <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-(--surface-raised) text-(--text-secondary) text-[10px] font-semibold ml-1">
                      {draftReady.length}
                    </span>
                  </span>
                </div>
                {draftReady.map((co) => (
                  <MobileContactRow key={co.id} contact={co} />
                ))}
              </>
            )}
            {inPipeline.length > 0 && (
              <>
                <div className="px-4 pt-5 pb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
                    In pipeline{" "}
                    <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-(--surface-raised) text-(--text-secondary) text-[10px] font-semibold ml-1">
                      {inPipeline.length}
                    </span>
                  </span>
                </div>
                {inPipeline.map((co) => (
                  <MobileContactRow key={co.id} contact={co} />
                ))}
              </>
            )}
            {other.length > 0 && (
              <>
                <div className="px-4 pt-5 pb-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
                    Other{" "}
                    <span className="inline-flex items-center justify-center min-w-4.5 h-4.5 px-1 rounded-full bg-(--surface-raised) text-(--text-secondary) text-[10px] font-semibold ml-1">
                      {other.length}
                    </span>
                  </span>
                </div>
                {other.map((co) => (
                  <MobileContactRow key={co.id} contact={co} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
