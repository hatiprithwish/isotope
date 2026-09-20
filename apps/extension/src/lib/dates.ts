/**
 * Local-calendar YYYY-MM-DD — the same key the web Tasks page sends for "today". Lives here rather
 * than in the panel's `data.ts` because the background worker needs it too, and that file pulls in
 * React and Clerk's React hooks.
 */
export function getTodayDateKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
