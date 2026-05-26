import { Link, useRouterState } from "@tanstack/react-router";
import HomeUtils from "./-utils";

export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="h-16 w-full shrink-0 grid grid-cols-4 bg-sidebar border-t border-border">
      {HomeUtils.NAV_ITEMS.map(({ id, label, icon: Icon, href }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={id}
            to={href}
            className={[
              "flex flex-col items-center justify-center gap-1",
              "text-xxs font-medium",
              active ? "text-primary" : "text-(--text-secondary)",
            ].join(" ")}
          >
            <Icon size={20} weight={active ? "bold" : "regular"} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
