import { useState } from "react";
import { SignedIn, SignedOut } from "@clerk/chrome-extension";
import CaptureForm from "./CaptureForm";
import ContactCard from "./ContactCard";
import ContactsPane from "./ContactsPane";
import TasksPane from "./TasksPane";
import ThreadPanel from "./ThreadPanel";
import type { ExtractedThread } from "@/lib/extractThread";
import {
  ScanError,
  useActiveTabMode,
  useContactMatches,
  useProfileScan,
  useRescanOnTabChange,
  useThreadScan,
} from "./data";

const WEB_ORIGIN = import.meta.env.WXT_WEB_ORIGIN;

function Header() {
  return (
    <header className="border-b border-border px-4 py-3">
      <h1 className="text-[15px] font-semibold text-foreground">
        Isotope<sup className="text-[9px] text-primary">13</sup>
      </h1>
    </header>
  );
}

/** A `ScanError` flagged `isWrongPage` is a prompt ("open a profile"), not a failure to report. */
function ScanErrorView({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const isWrongPage = error instanceof ScanError && error.isWrongPage;
  return (
    <div className="flex flex-col gap-3 p-4">
      <p
        className={
          isWrongPage
            ? "text-[13px] leading-relaxed text-muted-foreground"
            : "text-[13px] leading-relaxed text-destructive"
        }
        role={isWrongPage ? undefined : "alert"}
      >
        {error.message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="self-start rounded-md border border-input px-3 py-2 text-[13px] font-medium text-foreground"
      >
        Retry
      </button>
    </div>
  );
}

/**
 * Resolves the conversation's contact before the panel mounts: the panel seeds its "log to" choice
 * from the matches once, so it cannot be handed them late.
 */
function ThreadWithMatches({ thread }: { thread: ExtractedThread }) {
  const matches = useContactMatches(thread.otherName);

  if (matches.isPending) {
    return <p className="p-4 text-[13px] text-muted-foreground">Finding contact…</p>;
  }

  if (matches.isError) {
    return <ScanErrorView error={matches.error} onRetry={() => void matches.refetch()} />;
  }

  return <ThreadPanel thread={thread} matches={matches.data} />;
}

function ThreadPane() {
  const scan = useThreadScan();

  if (scan.isPending) {
    return <p className="p-4 text-[13px] text-muted-foreground">Reading conversation…</p>;
  }

  if (scan.isError) {
    return <ScanErrorView error={scan.error} onRetry={() => void scan.refetch()} />;
  }

  const thread = scan.data;

  // Keyed by page URL *and* contact so moving to another conversation remounts the panel — its
  // "log to" choice is seeded once from props and would otherwise carry over to the wrong person.
  // The contact matters because a chat bubble shares its host page's URL, so two different bubbles
  // on one page differ only by who they are with. Message count is deliberately *not* in the key:
  // the panel polls, so new messages arrive continuously and must not reset the selection.
  return (
    <>
      <div className="flex items-center justify-between px-4 pt-3">
        <p className="text-[11px] text-muted-foreground">
          {thread.messages.length} {thread.messages.length === 1 ? "message" : "messages"} found
        </p>
        <button
          type="button"
          onClick={() => void scan.refetch()}
          className="text-[11px] font-medium text-primary underline underline-offset-2"
        >
          Rescan
        </button>
      </div>
      <ThreadWithMatches key={`${thread.threadUrl}|${thread.otherName}`} thread={thread} />
    </>
  );
}

function CapturePane() {
  const scan = useProfileScan();

  if (scan.isPending) {
    return <p className="p-4 text-[13px] text-muted-foreground">Reading profile…</p>;
  }

  if (scan.isError) {
    return <ScanErrorView error={scan.error} onRetry={() => void scan.refetch()} />;
  }

  const { profile, existing } = scan.data;

  if (existing) {
    return (
      <>
        <p className="px-4 pt-3 text-[13px] font-semibold text-foreground">
          Already in your pipeline
        </p>
        <ContactCard contact={existing} />
      </>
    );
  }

  // Keyed by URL so moving to another profile remounts the form — its fields and the capture
  // mutation are seeded once from props and would otherwise keep the previous person's values.
  return <CaptureForm key={profile.linkedinUrl} profile={profile} />;
}

/**
 * A page that can host a chat bubble. On a profile the user may want either job — capture the
 * person, or log the chat opened over their profile — so both are offered; anywhere else only the
 * conversation applies. An open conversation wins by default: the user opened it deliberately,
 * whereas a profile is merely what the page happens to be.
 */
function LinkedInPanes({ isProfile }: { isProfile: boolean }) {
  const conversation = useThreadScan();
  const [choice, setChoice] = useState<"conversation" | "profile" | null>(null);

  const active = choice ?? (!isProfile || conversation.isSuccess ? "conversation" : "profile");

  return (
    <>
      {isProfile && (
        <div className="flex gap-1 border-b border-border px-4 pt-2" role="tablist">
          {(["conversation", "profile"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active === tab}
              onClick={() => setChoice(tab)}
              className={`rounded-t-md px-3 py-1.5 text-[12px] font-medium ${
                active === tab
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {tab === "conversation" ? "Conversation" : "Profile"}
            </button>
          ))}
        </div>
      )}
      {active === "conversation" ? <ThreadPane /> : <CapturePane />}
    </>
  );
}

/**
 * The panel does two different jobs on two different LinkedIn surfaces, so it picks the pane
 * from the active tab rather than showing both. Only the chosen pane mounts, which is also what
 * keeps the other surface's scan from running — and from injecting into the page — needlessly.
 */
function CapturePanes() {
  const mode = useActiveTabMode();

  if (mode.isPending) {
    return <p className="p-4 text-[13px] text-muted-foreground">Reading tab…</p>;
  }

  if (mode.isError) {
    return <ScanErrorView error={mode.error} onRetry={() => void mode.refetch()} />;
  }

  if (mode.data === "thread") return <ThreadPane />;
  if (mode.data === "profile") return <LinkedInPanes isProfile />;
  if (mode.data === "linkedin") return <LinkedInPanes isProfile={false} />;

  return (
    <p className="p-4 text-[13px] leading-relaxed text-muted-foreground">
      Open a LinkedIn profile to capture it, or a conversation to log its messages.
    </p>
  );
}

const SECTIONS = [
  { id: "capture", label: "Capture" },
  { id: "followups", label: "Follow-ups" },
  { id: "contacts", label: "Contacts" },
] as const;

/**
 * Capture is tied to the LinkedIn tab, but the follow-up list and contact lookup are not — it is the reason to keep the
 * panel open while browsing LinkedIn — so the sections live side by side rather than one replacing the
 * others. The tab-mode and rescan hooks stay here so they keep running whichever section is showing;
 * the sections themselves mount one at a time, so Capture's page polling stops while Follow-ups is up.
 */
function SignedInPanes() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]["id"]>("capture");
  useRescanOnTabChange();

  return (
    <>
      <div className="flex gap-1 border-b border-border px-4 pt-2" role="tablist">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={section === id}
            onClick={() => setSection(id)}
            className={`rounded-t-md px-3 py-1.5 text-[12px] font-medium ${
              section === id ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {section === "capture" && <CapturePanes />}
      {section === "followups" && <TasksPane />}
      {section === "contacts" && <ContactsPane />}
    </>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SignedIn>
        <SignedInPanes />
      </SignedIn>
      <SignedOut>
        <div className="flex flex-col gap-3 p-4">
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Sign in to Isotope in your browser and this panel picks up the same session.
          </p>
          <a
            className="text-[13px] font-medium text-primary underline underline-offset-2"
            href={WEB_ORIGIN}
            target="_blank"
            rel="noreferrer"
          >
            Open Isotope
          </a>
        </div>
      </SignedOut>
    </div>
  );
}
