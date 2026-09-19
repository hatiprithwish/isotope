import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/chrome-extension";
import type * as Schemas from "@app/schemas";
import { extractLinkedInProfile, type ExtractedProfile } from "@/lib/extractProfile";
import { captureContact, checkDuplicate } from "@/lib/api";

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
};

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

      if (!tab?.id || !tab.url) {
        throw new ScanError("Could not read the active tab.");
      }

      if (!PROFILE_URL_PATTERN.test(tab.url)) {
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
