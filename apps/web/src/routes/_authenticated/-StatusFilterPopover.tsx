import { useState } from "react";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import { Checkbox } from "@/shadcn/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/shadcn/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shadcn/ui/command";
import type { FilterOption } from "./-table-filters";

interface Props {
  /** Shown on the trigger when nothing is selected, e.g. "Status". */
  label: string;
  options: FilterOption[];
  selected: number[];
  onChange: (next: number[]) => void;
  /** Hides the search box for short option lists like fit bands. */
  searchable?: boolean;
}

export function StatusFilterPopover({
  label,
  options,
  selected,
  onChange,
  searchable = true,
}: Props) {
  const [open, setOpen] = useState(false);

  const selectedOptions = options.filter((option) => selected.includes(option.value));
  const hasSelection = selectedOptions.length > 0;

  function toggle(value: number) {
    const next = selected.includes(value)
      ? selected.filter((entry) => entry !== value)
      : [...selected, value];
    onChange(next);
  }

  const triggerText = !hasSelection
    ? label
    : selectedOptions.length === 1
      ? `${label}: ${selectedOptions[0]?.label ?? ""}`
      : `${label}: ${selectedOptions.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className={hasSelection ? "border-primary text-foreground" : "text-(--text-secondary)"}
        >
          {triggerText}
          <CaretDownIcon size={11} className="opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          {searchable && <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />}
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isChecked = selected.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option.value)}
                    className="gap-2"
                  >
                    <Checkbox checked={isChecked} className="pointer-events-none" />
                    <span className="flex-1">{option.label}</span>
                    {isChecked && <CheckIcon size={12} className="text-primary" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {hasSelection && (
          <div className="border-t border-border p-1.5">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="w-full justify-center"
              onClick={() => onChange([])}
            >
              Clear {label.toLowerCase()}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
