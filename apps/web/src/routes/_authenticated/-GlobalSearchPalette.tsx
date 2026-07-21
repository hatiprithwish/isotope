import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { BriefcaseIcon, BuildingsIcon, NoteIcon, UserIcon } from "@phosphor-icons/react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/ui/command";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useGlobalSearchShortcut } from "@/hooks/useGlobalSearchShortcut";
import { SearchEntityType, type SearchResultItem } from "@app/schemas";
import { SearchQueries } from "./-search-data";

const ENTITY_LABELS: Record<SearchEntityType, string> = {
  [SearchEntityType.Company]: "Companies",
  [SearchEntityType.Job]: "Jobs",
  [SearchEntityType.Contact]: "Contacts",
  [SearchEntityType.Note]: "Notes",
};

const ENTITY_ICONS: Record<SearchEntityType, typeof BuildingsIcon> = {
  [SearchEntityType.Company]: BuildingsIcon,
  [SearchEntityType.Job]: BriefcaseIcon,
  [SearchEntityType.Contact]: UserIcon,
  [SearchEntityType.Note]: NoteIcon,
};

function resultRoute(result: SearchResultItem): {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
} {
  switch (result.entityType) {
    case SearchEntityType.Company:
      return { to: "/companies", search: { panel: result.entityId } };
    case SearchEntityType.Job:
      return { to: "/jobs/$jobId", params: { jobId: String(result.entityId) } };
    case SearchEntityType.Contact:
      return { to: "/contacts/$contactId", params: { contactId: String(result.entityId) } };
    case SearchEntityType.Note:
      return { to: "/notes/$noteId", params: { noteId: String(result.entityId) } };
  }
}

export function GlobalSearchPalette() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);

  useGlobalSearchShortcut(() => setOpen((prev) => !prev));

  const { data, isPending, isError } = useQuery(SearchQueries.results(debouncedQuery, getToken));
  const results = data?.results ?? [];

  const grouped = results.reduce<Partial<Record<SearchEntityType, SearchResultItem[]>>>(
    (acc, result) => {
      const bucket = acc[result.entityType] ?? [];
      bucket.push(result);
      acc[result.entityType] = bucket;
      return acc;
    },
    {},
  );

  function handleClose(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setQuery("");
  }

  function handleSelect(result: SearchResultItem) {
    const route = resultRoute(result);
    void navigate(route);
    handleClose(false);
  }

  return (
    <CommandDialog open={open} onOpenChange={handleClose} className="sm:max-w-2xl">
      {/* DEV_NOTE: shouldFilter=false — results are already ranked server-side via FTS5 bm25(); cmdk's client fuzzy-filter would otherwise re-filter/hide valid matches whose item `value` doesn't fuzzy-match the raw query. */}
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search companies, jobs, contacts, notes…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.length === 0 && <CommandEmpty>Start typing to search.</CommandEmpty>}

          {query.length > 0 && isPending && <CommandEmpty>Searching…</CommandEmpty>}

          {query.length > 0 && !isPending && isError && (
            <CommandEmpty>Failed to search. Please try again.</CommandEmpty>
          )}

          {query.length > 0 && !isPending && !isError && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {(Object.keys(grouped) as SearchEntityType[]).map((entityType) => {
            const Icon = ENTITY_ICONS[entityType];
            return (
              <CommandGroup key={entityType} heading={ENTITY_LABELS[entityType]}>
                {grouped[entityType]?.map((result) => (
                  <CommandItem
                    key={`${result.entityType}-${result.entityId}`}
                    value={`${result.entityType}-${result.entityId}`}
                    onSelect={() => handleSelect(result)}
                  >
                    <Icon className="size-3.5 shrink-0 opacity-70" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{result.title}</span>
                      {result.snippet && (
                        <span
                          className="truncate text-[0.625rem] text-muted-foreground [&_mark]:bg-transparent [&_mark]:font-medium [&_mark]:text-foreground"
                          // DEV_NOTE: snippet HTML comes from our own SQLite snippet() call (server-controlled <mark> tags only, no user HTML) — not raw user input.
                          dangerouslySetInnerHTML={{ __html: result.snippet }}
                        />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
