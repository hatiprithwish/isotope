import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/chrome-extension";
import type * as Schemas from "@app/schemas";
import { extractLinkedInProfile, type ExtractedProfile } from "@/lib/extractProfile";
import { captureContact, checkDuplicate, parseProfile } from "@/lib/api";

const PROFILE_URL_PATTERN = /^https:\/\/(www\.)?linkedin\.com\/in\/[^/]+/i;

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
    const rescan = () => {
      void queryClient.invalidateQueries({ queryKey: captureKeys.scan() });
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
    return () => {
      browser.tabs.onActivated.removeListener(rescan);
      browser.tabs.onUpdated.removeListener(onUpdated);
    };
  }, [queryClient]);
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
