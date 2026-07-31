import {
  BriefcaseIcon,
  BuildingsIcon,
  ClipboardTextIcon,
  GearSixIcon,
  UserIcon,
} from "@phosphor-icons/react";

export default class HomeUtils {
  static readonly NAV_ITEMS = [
    { id: "tasks", label: "Tasks", icon: ClipboardTextIcon, href: "/tasks" },
    { id: "jobs", label: "Jobs", icon: BriefcaseIcon, href: "/jobs" },
    { id: "companies", label: "Companies", icon: BuildingsIcon, href: "/companies" },
    { id: "contacts", label: "Contacts", icon: UserIcon, href: "/contacts" },
  ] as const;

  // Secondary items: linked directly on desktop (sidebar footer), grouped under
  // MobileTabBar's "More" sheet on mobile since the tab bar only has room for primary items.
  // Notes is intentionally excluded — it's an internal/LLM-context feature, not user-facing.
  static readonly MORE_NAV_ITEMS = [
    { id: "settings", label: "Settings", icon: GearSixIcon, href: "/settings" },
  ] as const;
}
