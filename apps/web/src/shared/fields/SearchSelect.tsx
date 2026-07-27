import { useState, useRef, useEffect } from "react";
import { CaretDownIcon, XIcon } from "@phosphor-icons/react";

interface Option {
  id: number;
  label: string;
}

interface Props {
  value: number | null;
  options: Option[];
  /** `label` is the selected option's label (or the newly-created entry's typed name on create) — pass it through so callers don't need a separate, possibly-stale lookup by id. */
  onChange: (id: number | null, label?: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  /** When provided, an option to create a new entry from the current search text is offered. Must resolve to the new option's id, or throw — SearchSelect stays open on throw so the user can retry; the caller is responsible for toasting the error. */
  onCreateNew?: (label: string) => Promise<number>;
  createNewLabel?: (search: string) => string;
}

export default function SearchSelect({
  value,
  options,
  onChange,
  onBlur,
  error,
  placeholder = "Search…",
  onCreateNew,
  createNewLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value) ?? null;

  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  const trimmedSearch = search.trim();
  const hasExactMatch = options.some((o) => o.label.toLowerCase() === trimmedSearch.toLowerCase());
  const showCreateNew = Boolean(onCreateNew) && trimmedSearch.length > 0 && !hasExactMatch;

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
        onBlur?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onBlur]);

  function handleSelect(id: number) {
    const label = options.find((o) => o.id === id)?.label;
    onChange(id, label);
    setOpen(false);
    setSearch("");
    onBlur?.();
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    onBlur?.();
  }

  async function handleCreateNew() {
    if (!onCreateNew || !trimmedSearch || creating) return;
    setCreating(true);
    try {
      const newId = await onCreateNew(trimmedSearch);
      onChange(newId, trimmedSearch);
      setOpen(false);
      setSearch("");
      onBlur?.();
    } catch {
      // Caller's own mutation onError already toasts — keep the dropdown open so the user can retry.
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "w-full h-9 px-3 rounded-lg bg-background border text-[13px] text-left flex items-center justify-between gap-2 outline-none transition-colors",
          error ? "border-destructive" : "border-border focus:border-primary",
        ].join(" ")}
      >
        <span className={selected ? "text-foreground truncate" : "text-muted-foreground"}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {selected && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e as unknown as React.MouseEvent)}
              className="w-4 h-4 flex items-center justify-center rounded text-(--text-secondary) hover:text-foreground"
            >
              <XIcon size={11} />
            </span>
          )}
          <CaretDownIcon
            size={12}
            className={[
              "text-(--text-secondary) transition-transform",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="p-1.5 border-b border-border">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                // Enter selects the top filtered match instead of falling through to submit
                // whatever form this select happens to be embedded in.
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  if (filtered.length > 0) {
                    handleSelect(filtered[0].id);
                  } else if (showCreateNew) {
                    void handleCreateNew();
                  }
                } else if (e.key === "Escape") {
                  e.stopPropagation();
                  setOpen(false);
                  setSearch("");
                  onBlur?.();
                }
              }}
              placeholder="Search…"
              className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && !showCreateNew && (
              <div className="px-3 py-2.5 text-[12px] text-(--text-secondary)">
                No results found.
              </div>
            )}
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => handleSelect(o.id)}
                className={[
                  "w-full text-left px-3 py-2 text-[13px] transition-colors",
                  o.id === value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-(--surface-raised)",
                ].join(" ")}
              >
                {o.label}
              </button>
            ))}
          </div>
          {showCreateNew && (
            <button
              type="button"
              disabled={creating}
              onClick={() => void handleCreateNew()}
              className="w-full text-left px-3 py-2 text-[12.5px] font-medium text-primary border-t border-border hover:bg-(--surface-raised) transition-colors disabled:opacity-50"
            >
              {creating
                ? "Creating…"
                : (createNewLabel?.(trimmedSearch) ?? `Create "${trimmedSearch}"`)}
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
