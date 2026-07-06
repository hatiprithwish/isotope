import { BriefcaseIcon, BuildingsIcon, ClipboardTextIcon, UserIcon } from "@phosphor-icons/react";

export default class HomeUtils {
  static readonly NAV_ITEMS = [
    { id: "tasks", label: "Tasks", icon: ClipboardTextIcon, href: "/tasks" },
    { id: "jobs", label: "Jobs", icon: BriefcaseIcon, href: "/jobs" },
    { id: "companies", label: "Companies", icon: BuildingsIcon, href: "/companies" },
    { id: "contacts", label: "Contacts", icon: UserIcon, href: "/contacts" },
  ] as const;
}
