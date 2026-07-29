export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

/** Monday-first week containing the given date. */
export function getWeekDates(date: Date): Date[] {
  const dayOfWeek = (date.getDay() + 6) % 7; // 0 = Monday
  const monday = addDays(date, -dayOfWeek);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function getWeekdayLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** "4 July, 2026" — day-first, per the design spec. */
export function formatSectionDate(date: Date): string {
  return `${date.getDate()} ${date.toLocaleDateString("en-US", { month: "long" })}, ${date.getFullYear()}`;
}

/** "4 Jul" — compact inline form for rows in a mixed-date list (search results, Past tasks). */
export function formatRowDate(dateKey: string): string {
  const date = fromDateKey(dateKey);
  return `${date.getDate()} ${date.toLocaleDateString("en-US", { month: "short" })}`;
}

export function getSectionLabel(dateKey: string, todayKey: string): string {
  const today = fromDateKey(todayKey);
  const date = fromDateKey(dateKey);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "long" });
}
