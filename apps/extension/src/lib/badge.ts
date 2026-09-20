/** Wine red — the panel's `--destructive`. Read on the toolbar icon as "something is owed". */
const BADGE_COLOR = "#9F1239";
/** The badge is ~4 characters wide; anything longer is clipped. */
const BADGE_MAX_COUNT = 99;

/**
 * Shows how many follow-ups are pending on the toolbar icon; zero clears it. Shared by the panel
 * (instant update while it is open) and the background worker (timed update while it is closed),
 * so the two can never disagree about how the number looks.
 *
 * Never throws: a badge that fails to draw is cosmetic and must not fail the fetch that fed it.
 */
export async function setFollowUpBadge(count: number): Promise<void> {
  try {
    const text = count <= 0 ? "" : count > BADGE_MAX_COUNT ? `${BADGE_MAX_COUNT}+` : String(count);
    await browser.action.setBadgeText({ text });
    await browser.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
  } catch {
    // Nothing to do: the next refresh redraws it.
  }
}
