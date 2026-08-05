import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";

interface Props {
  searchQuery: string;
  mobileSearch: boolean;
  /** Shared status filter + saved filter controls — identical to the desktop table's. */
  filterBar: React.ReactNode;
  onSearchToggle: () => void;
  onSearchChange: (v: string) => void;
}

export function MobileJobsHeader({
  searchQuery,
  mobileSearch,
  filterBar,
  onSearchToggle,
  onSearchChange,
}: Props) {
  return (
    <header className="px-4 pt-4 pb-0 bg-background shrink-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[22px] font-semibold text-foreground tracking-tight">Jobs</span>
        <Button type="button" variant="ghost" size="icon" onClick={onSearchToggle}>
          <MagnifyingGlassIcon size={18} />
        </Button>
      </div>

      {mobileSearch && (
        <div className="relative mb-3">
          <MagnifyingGlassIcon
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            autoFocus
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search jobs…"
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap pb-3">{filterBar}</div>
    </header>
  );
}
