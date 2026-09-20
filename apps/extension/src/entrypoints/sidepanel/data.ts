import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/chrome-extension";
import type * as Schemas from "@app/schemas";
import { extractLinkedInProfile, type ExtractedProfile } from "@/lib/extractProfile";
import { extractLinkedInThread, type ExtractedThread } from "@/lib/extractThread";
import {
  bulkLogHistory,
  captureContact,
  checkDuplicate,
  getContactHistory,
  getMessageTemplates,
  getTasksForDay,
  parseProfile,
  searchContacts,
} from "@/lib/api";

const PROFILE_URL_PATTERN = /^https:\/\/(www\.)?linkedin\.com\/in\/[^/]+/i;
/** Quiet period after the last tab event before the page is re-read. */
const RESCAN_SETTLE_MS = 800;
/**
 * How often an open conversation is re-read. Sending or receiving a message changes nothing the
 * panel can observe from outside the page — no tab event, no URL change, no focus change — so the
 * only way to see it is to look again. Only runs while the panel is open and visible.
 */
const THREAD_POLL_MS = 2500;
const THREAD_URL_PATTERN = /^https:\/\/(www\.)?linkedin\.com\/messaging\/thread\/[^/]+/i;
const LINKEDIN_URL_PATTERN = /^https:\/\/(www\.)?linkedin\.com\//i;

export interface ScanResult {
  profile: ExtractedProfile;
  /** The contact this profile already maps to, or null when it is new to the pipeline. */
  existing: Schemas.Contact | null;
}

export class ScanError extends Error {
  /** True when the user simply isn't on a profile page — a prompt, not a failure to report. */
  readonly isWrongPage: boolean;

  constructor(message: string, isWrongPage = false) {
    super(message);
    this.name = "ScanError";
    this.isWrongPage = isWrongPage;
  }
}

export const captureKeys = {
  scan: () => ["scan"] as const,
  aiParse: (linkedinUrl: string) => ["ai-parse", linkedinUrl] as const,
};

export const threadKeys = {
  mode: () => ["active-tab-mode"] as const,
  scan: () => ["thread-scan"] as const,
  matches: (name: string) => ["thread-matches", name] as const,
  logged: (contactId: number) => ["thread-logged", contactId] as const,
};

export const taskKeys = {
  all: () => ["tasks-today"] as const,
  today: (dateKey: string) => ["tasks-today", dateKey] as const,
  templates: () => ["message-templates"] as const,
};

/**
 * Which LinkedIn surface the user is on — decides which pane the panel shows. "linkedin" is any
 * other LinkedIn page: a chat bubble can float over the feed, a company page or a search, so a
 * conversation can be open anywhere and the URL alone cannot say.
 */
export type PanelMode = "profile" | "thread" | "linkedin" | "other";

/**
 * The panel is a single window that outlives every tab switch, so the surface it should show is
 * a piece of live state, not something read once on open. Re-read alongside the scans by
 * `useRescanOnTabChange`.
 */
export function useActiveTabMode() {
  return useQuery<PanelMode, Error>({
    queryKey: threadKeys.mode(),
    queryFn: async () => {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      // `tab.url` is only populated for origins in host_permissions, so anywhere else it is
      // undefined — which is exactly "not a surface we handle".
      if (!tab?.url) return "other";
      if (THREAD_URL_PATTERN.test(tab.url)) return "thread";
      if (PROFILE_URL_PATTERN.test(tab.url)) return "profile";
      if (LINKEDIN_URL_PATTERN.test(tab.url)) return "linkedin";
      return "other";
    },
  });
}

/**
 * AI fallback, run only when deterministic extraction left a field blank. Keyed and cached by
 * profile URL with a non-zero gcTime so returning to a tab re-renders from cache instead of
 * paying for the same profile twice — the panel's other queries deliberately don't cache.
 */
export function useAiParse(profile: ExtractedProfile | undefined, enabled: boolean) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: captureKeys.aiParse(profile?.linkedinUrl ?? ""),
    enabled: Boolean(isSignedIn) && enabled && Boolean(profile?.pageText),
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      if (!profile) throw new Error("No profile to parse");
      const response = await parseProfile(
        { pageText: profile.pageText, linkedinUrl: profile.linkedinUrl },
        await getToken(),
      );
      return response.parsed ?? null;
    },
  });
}

/**
 * Reads the profile out of the active tab and asks the API whether it is already a contact.
 * Both halves run in one query because the duplicate lookup is meaningless without the URL the
 * scan produces, and the panel has nothing to show until both are known.
 */
export function useProfileScan() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<ScanResult, Error>({
    queryKey: captureKeys.scan(),
    enabled: Boolean(isSignedIn),
    queryFn: async () => {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) {
        throw new ScanError("Could not read the active tab.");
      }

      // `tab.url` is only populated for origins in host_permissions, so on any other site it is
      // undefined — that is "not on a profile page", not a failure to read the tab.
      if (!tab.url || !PROFILE_URL_PATTERN.test(tab.url)) {
        throw new ScanError("Open a LinkedIn profile to capture it.", true);
      }

      const [injection] = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractLinkedInProfile,
      });

      const profile = injection?.result;
      if (!profile) {
        throw new ScanError("Could not read this page. Try reloading the profile.");
      }

      const duplicateResponse = await checkDuplicate(profile.linkedinUrl, await getToken());

      return { profile, existing: duplicateResponse.match ?? null };
    },
  });
}

/**
 * A side panel outlives tab switches and in-page navigation, so a scan taken on open goes stale
 * the moment the user moves to another profile. Re-run it whenever the active tab changes or
 * finishes navigating; LinkedIn is an SPA, so profile-to-profile moves surface as a URL change
 * with no page load.
 */
export function useRescanOnTabChange() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // LinkedIn changes the URL before it has finished rendering the new page — a thread paints its
    // newest message first and fills in the rest. Scanning on the URL event alone reads that
    // half-built DOM, so the scan waits for the events to go quiet. Trailing debounce: every new
    // event restarts the wait.
    let settleTimer: ReturnType<typeof setTimeout> | undefined;
    // Each key is invalidated by name rather than invalidating everything: the AI-parse cache is
    // deliberately `staleTime: Infinity`, and a blanket invalidate would refetch — and re-bill —
    // it on every tab switch.
    const rescan = () => {
      void queryClient.invalidateQueries({ queryKey: threadKeys.mode() });
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: captureKeys.scan() });
        void queryClient.invalidateQueries({ queryKey: threadKeys.scan() });
      }, RESCAN_SETTLE_MS);
    };
    const onUpdated = (
      _tabId: number,
      changeInfo: { url?: string; status?: string },
      tab: { active?: boolean },
    ) => {
      if (tab.active && (changeInfo.url || changeInfo.status === "complete")) rescan();
    };

    browser.tabs.onActivated.addListener(rescan);
    browser.tabs.onUpdated.addListener(onUpdated);
    // Opening a chat bubble changes neither the URL nor the active tab, so no tab event says a
    // conversation appeared. But the user has to click into this panel to log it, and that focus is
    // the signal: re-read the page then.
    window.addEventListener("focus", rescan);
    return () => {
      clearTimeout(settleTimer);
      window.removeEventListener("focus", rescan);
      browser.tabs.onActivated.removeListener(rescan);
      browser.tabs.onUpdated.removeListener(onUpdated);
    };
  }, [queryClient]);
}

/**
 * Reads the open conversation out of the active tab, and re-reads it every few seconds so a message
 * sent or received while the panel is open shows up without the user having to prompt a rescan.
 *
 * Deliberately page-only: contact matching lives in `useContactMatches`, keyed by name, so a poll
 * that finds the same conversation costs one in-page script and no API call.
 */
export function useThreadScan() {
  const { isSignedIn } = useAuth();

  return useQuery<ExtractedThread, Error>({
    queryKey: threadKeys.scan(),
    enabled: Boolean(isSignedIn),
    refetchInterval: THREAD_POLL_MS,
    queryFn: async () => {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

      if (!tab?.id) throw new ScanError("Could not read the active tab.");
      if (!tab.url || !LINKEDIN_URL_PATTERN.test(tab.url)) {
        throw new ScanError("Open LinkedIn to log a conversation.", true);
      }

      const [injection] = await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractLinkedInThread,
      });

      const thread = injection?.result;
      if (!thread) {
        throw new ScanError("Could not read this conversation. Try reloading the page.");
      }
      if (!thread.messages.length) {
        // No name means no conversation was found at all; a name with no messages means one is
        // open but empty (or its messages have not loaded yet). Checked first so the direction
        // error below can never mask "there is nothing open".
        throw new ScanError(
          thread.otherName
            ? "No messages found in this conversation yet."
            : "Open a LinkedIn conversation to log its messages.",
          true,
        );
      }
      // Without a way to tell which messages are the user's, every one would be filed as inbound.
      // Better to stop than to log backwards.
      if (!thread.isDirectionKnown) {
        throw new ScanError(
          "Could not tell which messages are yours. Reload LinkedIn and try again.",
        );
      }
      // The contact is matched by this name, so a missing one must stop the scan: offering an
      // empty picker reads as "not in Isotope", which sends the user off to capture a duplicate.
      if (!thread.otherName) {
        throw new ScanError("Could not tell who this conversation is with. Reload and try again.");
      }

      return thread;
    },
  });
}

/**
 * The user's contacts whose name matches the conversation's other participant. Matches by *name*:
 * LinkedIn's messaging UI links participants by opaque member URN (`ACoAAD…`), never by the
 * `/in/<slug>` that `duplicate-check` keys on, so there is no URL to match with. Cached by name so
 * the thread poll never re-asks for a person it already resolved.
 */
export function useContactMatches(name: string) {
  const { getToken } = useAuth();

  return useQuery<Schemas.Contact[], Error>({
    queryKey: threadKeys.matches(name),
    queryFn: async () => (await searchContacts(name, await getToken())).contacts ?? [],
  });
}

/**
 * Body text and minute-of-send, for every LinkedIn message already on a contact. Re-logging the
 * same thread is the obvious way to use this panel twice, and nothing server-side rejects a
 * duplicate — so the panel pre-unchecks what it recognises.
 */
export function useLoggedFingerprints(contactId: number | null) {
  const { getToken } = useAuth();

  return useQuery<Set<string>, Error>({
    queryKey: threadKeys.logged(contactId ?? 0),
    enabled: contactId !== null,
    queryFn: async () => {
      if (contactId === null) return new Set<string>();
      const response = await getContactHistory(contactId, await getToken());
      const fingerprints = new Set<string>();
      for (const entry of response.history ?? []) {
        if (entry.deletedAt) continue;
        fingerprints.add(buildMessageFingerprint(entry.sentAt, entry.body));
      }
      return fingerprints;
    },
  });
}

/**
 * Identity of a logged message, to the minute. LinkedIn renders no seconds, so a re-scan of the
 * same thread produces the same minute; the body is whitespace-normalised because the page's
 * line wrapping is not stable across renders.
 */
export function buildMessageFingerprint(sentAt: string | null, body: string): string {
  const minute = sentAt ? new Date(sentAt).toISOString().slice(0, 16) : "";
  return `${minute}|${body.replace(/\s+/g, " ").trim().toLowerCase()}`;
}

export function useLogMessages() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation<
    Schemas.BulkLogContactHistoryApiResponse,
    Error,
    Schemas.BulkLogContactHistoryApiRequest
  >({
    mutationFn: async (payload) => await bulkLogHistory(payload, await getToken()),
    onSuccess: (_response, payload) => {
      // What was just logged is now part of the contact's history, so the fingerprints the panel
      // de-duplicates against are stale.
      const contactId = payload.entries[0]?.contactId;
      if (contactId !== undefined) {
        void queryClient.invalidateQueries({ queryKey: threadKeys.logged(contactId) });
      }
      // Logging an outbound message completes the contact's active follow-up and schedules the
      // next one, so the Follow-ups list is stale whichever pane the message was logged from.
      void queryClient.invalidateQueries({ queryKey: taskKeys.all() });
    },
  });
}

export function useCaptureContact() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<Schemas.CaptureContactApiResponse, Error, Schemas.CaptureContactApiRequest>({
    mutationFn: async (payload) => await captureContact(payload, await getToken()),
    onSuccess: (response) => {
      // Re-running the scan is what flips the panel into its "already in pipeline" state.
      queryClient.setQueryData<ScanResult>(captureKeys.scan(), (previous) =>
        previous && response.contact ? { ...previous, existing: response.contact } : previous,
      );
    },
  });
}

/** Local-calendar YYYY-MM-DD — the same key the web Tasks page sends for "today". */
function getTodayDateKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Follow-ups due today plus everything overdue. Unlike the panel's page scans this is worth a short
 * cache: switching between the Capture and Follow-ups tabs remounts the pane, and it should show
 * the last list at once while a fresh one loads. Refetched on panel focus because tasks are
 * completed in the web app, and coming back to the panel is the moment the list goes stale.
 */
export function useTasksForToday() {
  const { getToken, isSignedIn } = useAuth();
  const dateKey = getTodayDateKey();

  return useQuery<Schemas.TaskWithMeta[], Error>({
    queryKey: taskKeys.today(dateKey),
    enabled: Boolean(isSignedIn),
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => (await getTasksForDay(dateKey, await getToken())).tasks ?? [],
  });
}

/**
 * All saved templates, for rendering each follow-up's message. Refetched on panel focus for the
 * same reason as the task list: templates are edited in the web app.
 */
export function useMessageTemplates() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery<Schemas.MessageTemplate[], Error>({
    queryKey: taskKeys.templates(),
    enabled: Boolean(isSignedIn),
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => (await getMessageTemplates(await getToken())).templates ?? [],
  });
}
