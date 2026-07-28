import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  CheckSquareIcon,
  SquareIcon,
  ChatsCircleIcon,
  CopyIcon,
} from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import { AppTable, AppTablePagination } from "@/components/app-table";
import type { AppTableColumn, AppTablePaginationProps } from "@/components/app-table";
import type * as Schemas from "@app/schemas";
import { ContactSourceIntEnum, ContactSourceLabelEnum } from "@app/schemas";
import { StatusBadge } from "./-StatusBadge";
import { ContactDetailPanel } from "./-DesktopPanel";
import { STATUS_OPTIONS } from "./-AddOrEditContactModal";
import CompanySelect from "@/shared/fields/CompanySelect";

type BulkField = "" | "status" | "companyId" | "source";

const SOURCE_OPTIONS: { value: ContactSourceIntEnum; label: string }[] = [
  { value: ContactSourceIntEnum.Apollo, label: ContactSourceLabelEnum.Apollo },
  { value: ContactSourceIntEnum.Manual, label: ContactSourceLabelEnum.Manual },
];

interface Props {
  contacts: Schemas.Contact[];
  isLoading: boolean;
  isError: boolean;
  selectedContact: Schemas.Contact | null;
  onOpenPanel: (id: number) => void;
  onClosePanel: () => void;
  onAddClick: () => void;
  onBulkDelete: (ids: number[]) => Promise<unknown>;
  onBulkUpdate: (
    ids: number[],
    updates: Schemas.BulkUpdateContactsApiRequest["updates"],
  ) => Promise<unknown>;
  isBulkPending: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  pagination: AppTablePaginationProps;
}

export function DesktopContactsTable({
  contacts,
  isLoading,
  isError,
  selectedContact,
  onOpenPanel,
  onClosePanel,
  onAddClick,
  onBulkDelete,
  onBulkUpdate,
  isBulkPending,
  searchQuery,
  onSearchChange,
  pagination,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [bulkField, setBulkField] = useState<BulkField>("");
  const [bulkValue, setBulkValue] = useState<number | null>(null);

  const allPageIds = contacts.map((c) => c.id);
  const allSelected = allPageIds.length > 0 && allPageIds.every((id) => selectedIds.has(id));
  const someSelected = selectedIds.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allPageIds));
    }
  }

  function toggleOne(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function copyToClipboard(e: React.MouseEvent, value: string, label: string) {
    e.stopPropagation();
    void navigator.clipboard.writeText(value).then(() => {
      toast.success(`${label} copied`);
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setBulkField("");
    setBulkValue(null);
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    try {
      await onBulkDelete(ids);
      clearSelection();
    } catch {
      // error toast already shown by the mutation's onError — keep selection so the user can retry
    }
  }

  function handleBulkFieldChange(field: BulkField) {
    setBulkField(field);
    setBulkValue(null);
  }

  async function handleBulkApply() {
    if (!bulkField || bulkValue == null) return;
    try {
      await onBulkUpdate(Array.from(selectedIds), { [bulkField]: bulkValue });
      clearSelection();
    } catch {
      // error toast already shown by the mutation's onError — keep selection so the user can retry
    }
  }

  const COLUMNS: AppTableColumn<Schemas.Contact>[] = [
    {
      key: "_select",
      header: "",
      cell: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleOne(row.id);
          }}
          className="flex items-center justify-center text-muted-foreground hover:text-foreground"
          aria-label={selectedIds.has(row.id) ? "Deselect row" : "Select row"}
        >
          {selectedIds.has(row.id) ? (
            <CheckSquareIcon size={16} weight="fill" className="text-primary" />
          ) : (
            <SquareIcon size={16} />
          )}
        </button>
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <div>
          <div className="text-[13px] font-medium text-foreground truncate">{row.name}</div>
          <div className="text-[11px] text-(--text-secondary) mt-0.5 truncate">
            {row.designation}
          </div>
        </div>
      ),
    },
    {
      key: "companyName",
      header: "Company",
      cell: (row) => (
        <span className="text-[12px] font-medium text-(--text-secondary) truncate">
          {row.companyName ?? "—"}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (row) => {
        const email = row.email;
        return email ? (
          <button
            type="button"
            onClick={(e) => copyToClipboard(e, email, "Email")}
            className="group flex items-center gap-1.5 min-w-0 text-[12px] text-(--text-secondary) hover:text-foreground"
            title="Copy email"
          >
            <span className="truncate">{row.email}</span>
            <CopyIcon
              size={12}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </button>
        ) : (
          <span className="text-[12px] text-(--text-secondary)">—</span>
        );
      },
    },
    {
      key: "linkedinUrl",
      header: "LinkedIn",
      cell: (row) => {
        const linkedinUrl = row.linkedinUrl;
        return linkedinUrl ? (
          <button
            type="button"
            onClick={(e) => copyToClipboard(e, linkedinUrl, "LinkedIn URL")}
            className="group flex items-center gap-1.5 min-w-0 text-[12px] text-(--text-secondary) hover:text-foreground"
            title="Copy LinkedIn URL"
          >
            <span className="truncate">{linkedinUrl}</span>
            <CopyIcon
              size={12}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </button>
        ) : (
          <span className="text-[12px] text-(--text-secondary)">—</span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (row.status ? <StatusBadge status={row.status} sm /> : null),
    },
  ];

  const toolbarLeft = someSelected ? (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[12px] font-medium text-foreground">{selectedIds.size} selected</span>
      <div className="flex items-center gap-1.5">
        <select
          value={bulkField}
          onChange={(e) => handleBulkFieldChange(e.target.value as BulkField)}
          className="h-6.5 px-2 rounded-md border border-border bg-background text-[12px] text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">Bulk edit…</option>
          <option value="status">Status</option>
          <option value="companyId">Company</option>
          <option value="source">Source</option>
        </select>

        {bulkField === "status" && (
          <select
            value={bulkValue ?? ""}
            onChange={(e) => setBulkValue(e.target.value ? Number(e.target.value) : null)}
            className="h-6.5 px-2 rounded-md border border-border bg-background text-[12px] text-foreground focus:outline-none focus:border-primary"
          >
            <option value="">Select status…</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {bulkField === "source" && (
          <select
            value={bulkValue ?? ""}
            onChange={(e) => setBulkValue(e.target.value ? Number(e.target.value) : null)}
            className="h-6.5 px-2 rounded-md border border-border bg-background text-[12px] text-foreground focus:outline-none focus:border-primary"
          >
            <option value="">Select source…</option>
            {SOURCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}

        {bulkField === "companyId" && (
          <div className="w-48">
            <CompanySelect value={bulkValue} onChange={setBulkValue} />
          </div>
        )}

        {bulkField && (
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={bulkValue == null || isBulkPending}
            onClick={() => void handleBulkApply()}
          >
            Apply
          </Button>
        )}
      </div>
      <Button
        type="button"
        size="xs"
        variant="outline"
        disabled={isBulkPending}
        onClick={() => void handleBulkDelete()}
        className="text-destructive border-destructive/40 hover:bg-destructive/10"
      >
        <TrashIcon size={12} />
        Delete
      </Button>
      <button
        type="button"
        onClick={clearSelection}
        className="text-[12px] text-(--text-secondary) hover:text-foreground underline-offset-2 hover:underline"
      >
        Clear
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleAll}
        className="flex items-center justify-center text-muted-foreground hover:text-foreground"
        aria-label="Select all"
        title="Select all"
      >
        {allSelected ? (
          <CheckSquareIcon size={16} weight="fill" className="text-primary" />
        ) : (
          <SquareIcon size={16} />
        )}
      </button>
      <div className="relative w-56">
        <MagnifyingGlassIcon
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search contacts…"
          className="w-full h-6.5 pl-8 pr-3 rounded-md bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );

  return (
    <div className="hidden md:flex h-full overflow-hidden relative">
      <div className="flex flex-col overflow-hidden flex-1">
        <header className="h-13 px-6 flex items-center border-b border-border bg-sidebar shrink-0">
          <span className="text-base font-semibold text-foreground tracking-tight">Contacts</span>
          <div className="ml-auto flex gap-2 items-center">
            <Button type="button" variant="outline" size="lg" asChild>
              <Link to="/contacts/bulk-log">
                <ChatsCircleIcon size={13} />
                Bulk Log Messages
              </Link>
            </Button>
            <Button type="button" variant="default" size="lg" onClick={onAddClick}>
              <PlusIcon size={13} />
              Add
            </Button>
          </div>
        </header>

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <AppTable<Schemas.Contact>
            columns={COLUMNS}
            data={contacts}
            keyExtractor={(row) => String(row.id)}
            isLoading={isLoading}
            skeletonRows={5}
            errorMsg={isError ? "Failed to load contacts. Please refresh." : undefined}
            onRowClick={(row) =>
              selectedContact?.id === row.id ? onClosePanel() : onOpenPanel(row.id)
            }
            getRowClassName={(row) =>
              row.id === selectedContact?.id ? "bg-sidebar" : "hover:bg-(--surface-raised)"
            }
            emptyState="No contacts yet."
            stickyHeader
            flush
            toolbarLeft={toolbarLeft}
          />
        </div>

        <AppTablePagination {...pagination} />
      </div>

      <ContactDetailPanel
        contactId={selectedContact?.id ?? null}
        contact={selectedContact}
        onClose={onClosePanel}
      />
    </div>
  );
}
