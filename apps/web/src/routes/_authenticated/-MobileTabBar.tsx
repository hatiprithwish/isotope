import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth, useClerk } from "@clerk/tanstack-react-start";
import { DotsThreeIcon, SignOutIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
} from "@/shadcn/ui/drawer";
import { apiClient } from "@/providers/apiClient";
import HomeUtils from "./-utils";

export function MobileTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const [moreOpen, setMoreOpen] = useState(false);

  const moreActive = HomeUtils.MORE_NAV_ITEMS.some(
    ({ href }) => pathname === href || pathname.startsWith(href + "/"),
  );

  async function handleSignOut() {
    try {
      await apiClient("/auth/sign-out", getToken, { method: "POST" });
    } catch {
      // Session revocation failed on server — still sign out client-side
      toast.error("Sign out encountered an issue. Clearing session locally.");
    } finally {
      await signOut();
      navigate({ to: "/auth/sign-in" });
    }
  }

  return (
    <>
      <nav className="h-16 w-full shrink-0 grid grid-cols-5 bg-sidebar border-t border-border">
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
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className={[
            "flex flex-col items-center justify-center gap-1",
            "text-xxs font-medium",
            moreActive ? "text-primary" : "text-(--text-secondary)",
          ].join(" ")}
        >
          <DotsThreeIcon size={20} weight={moreActive ? "bold" : "regular"} />
          More
        </button>
      </nav>

      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerPortal>
          <DrawerOverlay />
          <DrawerContent className="p-0 bg-card border-t border-border rounded-t-xl">
            <DrawerTitle className="px-4 pt-2 pb-1">More</DrawerTitle>
            <nav className="flex flex-col gap-1 p-2 pb-6">
              {HomeUtils.MORE_NAV_ITEMS.map(({ id, label, icon: Icon, href }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={id}
                    to={href}
                    onClick={() => setMoreOpen(false)}
                    className={[
                      "flex items-center gap-3 py-2.5 px-3 rounded-lg",
                      "text-sm font-medium",
                      active ? "bg-surface text-foreground" : "text-(--text-secondary)",
                    ].join(" ")}
                  >
                    <Icon size={18} weight={active ? "bold" : "regular"} />
                    {label}
                  </Link>
                );
              })}
              <div className="h-px bg-border my-1 mx-3" />
              <button
                type="button"
                onClick={() => {
                  setMoreOpen(false);
                  void handleSignOut();
                }}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-medium text-(--text-secondary)"
              >
                <SignOutIcon size={18} weight="regular" />
                Sign out
              </button>
            </nav>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </>
  );
}
