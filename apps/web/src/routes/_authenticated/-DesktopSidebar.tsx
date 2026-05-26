import { Link, useRouterState } from "@tanstack/react-router";
import { useUser } from "@clerk/tanstack-react-start";
import { GearSixIcon } from "@phosphor-icons/react";
import HomeUtils from "./-utils";
import Utilities from "@/utils";

export function DesktopSidebar() {
  const { user } = useUser();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const name = user?.fullName ?? "";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initials = name ? Utilities.getInitials(name) : "?";

  return (
    <aside className="w-48 shrink-0 bg-sidebar border-r border-border flex flex-col p-4 px-3">
      {/* Logo */}
      <div className="flex items-center gap-1.5 px-2.5 pt-1.5 pb-5.5">
        <span className="font-semibold leading-none tracking-[-0.012em] text-foreground">
          Isotope
          <sup className="text-xxxs font-semibold text-primary align-super ml-0.5">¹³</sup>
        </span>
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col gap-0.5">
        {HomeUtils.NAV_ITEMS.map(({ id, label, icon: Icon, href }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={id}
              to={href}
              className={[
                "flex items-center gap-2.25 py-1.75 px-2.5 rounded-lg",
                "text-xs font-medium leading-none border",
                "transition-colors duration-120",
                active
                  ? "bg-surface border-border text-foreground"
                  : "border-transparent text-(--text-secondary) hover:text-foreground",
              ].join(" ")}
            >
              <Icon size={16} weight={active ? "bold" : "regular"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Push settings + user to bottom */}
      <div className="grow" />

      {/* Divider */}
      <div className="h-px bg-border mx-1.5 my-3.5" />

      {/* Settings */}
      <Link
        to="/settings"
        className={[
          "flex items-center gap-2.25 py-1.75 px-2.5 rounded-lg",
          "text-xs font-medium leading-none border",
          "transition-colors duration-120",
          pathname.startsWith("/settings")
            ? "bg-surface border-border text-foreground"
            : "border-transparent text-(--text-secondary) hover:text-foreground",
        ].join(" ")}
      >
        <GearSixIcon size={16} weight={pathname.startsWith("/settings") ? "bold" : "regular"} />
        Settings
      </Link>

      {/* User row */}
      <div className="flex items-center gap-2 py-1.75 px-2.5 mt-0.5">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-xxs font-semibold shrink-0"
          style={{ background: "var(--accent-bg)", color: "var(--accent-text)" }}
        >
          {initials}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-medium leading-snug text-foreground truncate">{name}</span>
          <span className="text-xxs leading-none text-muted-foreground mt-0.5 truncate">
            {email}
          </span>
        </div>
      </div>
    </aside>
  );
}
