import { createContext, use, useEffect, useState } from "react";

interface SidebarProviderProps {
  children: React.ReactNode;
  storageKey?: string;
}

interface SidebarProviderState {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const SidebarProviderContext = createContext<SidebarProviderState | undefined>(undefined);

export function SidebarProvider({
  children,
  storageKey = "isotope-sidebar-collapsed",
}: SidebarProviderProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Read persisted state after mount only — the initial render must match the
  // server-rendered (expanded) markup, or hydration mismatches on the sidebar's width/classes.
  useEffect(() => {
    // One-time sync from localStorage (an external system) after mount, required to keep SSR markup stable.
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-x/set-state-in-effect
    if (localStorage.getItem(storageKey) === "true") setCollapsed(true);
  }, [storageKey]);

  return (
    <SidebarProviderContext
      value={{
        collapsed,
        toggleCollapsed: () => {
          setCollapsed((prev) => {
            const next = !prev;
            if (typeof window !== "undefined") localStorage.setItem(storageKey, String(next));
            return next;
          });
        },
      }}
    >
      {children}
    </SidebarProviderContext>
  );
}

export function useSidebar() {
  const context = use(SidebarProviderContext);
  if (context === undefined) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
}
