import { createClerkClient } from "@clerk/chrome-extension/background";
import { getTasksForDay } from "@/lib/api";
import { setFollowUpBadge } from "@/lib/badge";
import { getTodayDateKey } from "@/lib/dates";

const BADGE_ALARM = "follow-up-badge";
/**
 * How often the badge is redrawn while the panel is closed. Chrome wakes the worker for the alarm;
 * anything under a minute would fight the worker's idle shutdown for no gain on a count of tasks
 * that change a few times a day.
 */
const BADGE_REFRESH_MINUTES = 5;

const PUBLISHABLE_KEY = import.meta.env.WXT_CLERK_PUBLISHABLE_KEY;
const SYNC_HOST = import.meta.env.WXT_WEB_ORIGIN;

/**
 * Redraws the toolbar badge with today's follow-up count (due today plus overdue — the same number
 * the Follow-ups list shows). The panel's Clerk instance stops refreshing its token once the panel
 * closes, so the worker builds its own from the shared session; `syncHost` is what lets it find
 * the session the web app signed in.
 *
 * A failed fetch leaves the previous number up: a dropped connection must not read as "zero
 * follow-ups". Only a confirmed signed-out state clears it.
 */
async function refreshBadge(): Promise<void> {
  if (!PUBLISHABLE_KEY || !SYNC_HOST) return;

  try {
    const clerk = await createClerkClient({ publishableKey: PUBLISHABLE_KEY, syncHost: SYNC_HOST });
    const token = (await clerk.session?.getToken()) ?? null;

    if (!token) {
      await setFollowUpBadge(0);
      return;
    }

    const response = await getTasksForDay(getTodayDateKey(), token);
    await setFollowUpBadge(response.tasks?.length ?? 0);
  } catch {
    // Keep whatever the badge already shows; the next alarm tries again.
  }
}

export default defineBackground(() => {
  // Clicking the toolbar icon opens the side panel. Without this the action click is a no-op
  // unless a popup is declared, and this extension deliberately has no popup.
  browser.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {
    // Not fatal — the user can still open the panel from Chrome's side-panel menu.
  });

  // Listeners are registered synchronously: Chrome wakes a dead worker for an event only if the
  // listener exists by the time the script finishes its first run.
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === BADGE_ALARM) void refreshBadge();
  });
  browser.runtime.onStartup.addListener(() => void refreshBadge());
  browser.runtime.onInstalled.addListener(() => void refreshBadge());

  // Alarms persist across worker restarts, so only create it when it is missing — re-creating on
  // every wake would push the next tick back each time.
  void browser.alarms.get(BADGE_ALARM).then((existing) => {
    if (!existing)
      void browser.alarms.create(BADGE_ALARM, { periodInMinutes: BADGE_REFRESH_MINUTES });
  });
});
