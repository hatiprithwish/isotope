import type { KeyboardEvent, ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { LinkProps } from "@tanstack/react-router";
import { CheckSquareIcon, SquareIcon } from "@phosphor-icons/react";

export const MOBILE_LIST_ROW_CLASS =
  "flex items-center gap-3 py-3.5 px-4 bg-sidebar border-b border-border cursor-pointer active:bg-(--surface-raised)";

interface MobileListRowCheckboxProps {
  selected: boolean;
  onToggle: () => void;
}

/** Select-mode row checkbox — stops propagation so it doesn't also trigger the row's own onClick. */
export function MobileListRowCheckbox({ selected, onToggle }: MobileListRowCheckboxProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className="shrink-0 flex items-center justify-center"
      aria-label={selected ? "Deselect" : "Select"}
    >
      {selected ? (
        <CheckSquareIcon size={18} weight="fill" className="text-primary" />
      ) : (
        <SquareIcon size={18} className="text-muted-foreground" />
      )}
    </button>
  );
}

export function MobileListRowChevron() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-(--text-secondary) shrink-0"
    >
      <path d="M9 6l6 6l-6 6" />
    </svg>
  );
}

interface MobileListRowShellProps {
  /** "button" (select mode — activates on Enter and Space, matching native <button>) or "link" (default row — Enter only, matching native <a>). */
  role: "button" | "link";
  onActivate: () => void;
  children: ReactNode;
}

/** Keyboard-operable row wrapper — a plain <div> with an ARIA role doesn't get native Enter/Space activation for free, so this wires onKeyDown to match what a real <button>/<a> would do. */
export function MobileListRowShell({ role, onActivate, children }: MobileListRowShellProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const activationKeys = role === "button" ? ["Enter", " "] : ["Enter"];
    if (!activationKeys.includes(e.key)) return;
    e.preventDefault();
    onActivate();
  }

  return (
    <div
      className={MOBILE_LIST_ROW_CLASS}
      onClick={onActivate}
      onKeyDown={handleKeyDown}
      role={role}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

interface MobileListRowLinkShellProps {
  to: LinkProps["to"];
  params: LinkProps["params"];
  /** Accessible name for the stretched link, since its visible content is the whole card, not link text — e.g. "Open Jane Doe" */
  label: string;
  children: ReactNode;
}

/**
 * Row wrapper for cards that need a real <a> (native cmd/ctrl-click new tab, right-click copy
 * link, hover URL preview) AND nested interactive children (e.g. copy buttons) — <button> inside
 * <a> is invalid HTML, so the <Link> is stretched to cover the row via absolute positioning
 * ("stretched link" pattern) instead of wrapping the content directly. Row content sits above it
 * with `relative z-10` + `pointer-events-auto` on its own buttons so they stay independently
 * clickable; the link itself stays focusable/tabbable (not aria-hidden) so keyboard/screen-reader
 * users can still reach and activate it, just like the buttons that come after it in tab order.
 */
export function MobileListRowLinkShell({
  to,
  params,
  label,
  children,
}: MobileListRowLinkShellProps) {
  return (
    <div className={`relative ${MOBILE_LIST_ROW_CLASS}`}>
      <Link to={to} params={params} className="absolute inset-0" aria-label={label} />
      <div className="relative z-10 flex items-center gap-3 w-full pointer-events-none [&_button]:pointer-events-auto [&_a:not(:first-child)]:pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
