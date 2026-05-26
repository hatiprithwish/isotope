import { BriefcaseIcon, BuildingsIcon, HouseIcon, UserIcon } from "@phosphor-icons/react";

export default class HomeUtils {
  static readonly NAV_ITEMS = [
    { id: "today", label: "Today", icon: HouseIcon, href: "/today" },
    { id: "companies", label: "Companies", icon: BuildingsIcon, href: "/companies" },
    { id: "contacts", label: "Contacts", icon: UserIcon, href: "/contacts" },
    { id: "jobs", label: "Jobs", icon: BriefcaseIcon, href: "/jobs" },
  ] as const;
}
