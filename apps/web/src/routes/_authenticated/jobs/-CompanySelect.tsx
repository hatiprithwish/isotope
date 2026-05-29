import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { CaretDownIcon, XIcon } from "@phosphor-icons/react";
import { CompaniesQueries } from "@/routes/_authenticated/companies/-data";

interface Props {
  value: number | null;
  onChange: (companyId: number | null) => void;
  error?: string;
}

export default function CompanySelect({ value, onChange, error }: Props) {
  const { getToken } = useAuth();
  const { data } = useQuery(CompaniesQueries.list(getToken));
  const companies = data?.companies ?? [];

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = companies.find((c) => c.id === value) ?? null;

  const filtered = companies.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(id: number) {
    onChange(id);
    setOpen(false);
    setSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
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
          {selected ? selected.name : "Search companies…"}
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
              placeholder="Search…"
              className="w-full h-8 px-2.5 rounded-md bg-background border border-border text-[12px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2.5 text-[12px] text-(--text-secondary)">
                No companies found.
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  className={[
                    "w-full text-left px-3 py-2 text-[13px] transition-colors",
                    c.id === value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-(--surface-raised)",
                  ].join(" ")}
                >
                  {c.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
