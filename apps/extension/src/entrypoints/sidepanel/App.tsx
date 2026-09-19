import { SignedIn, SignedOut } from "@clerk/chrome-extension";
import CaptureForm from "./CaptureForm";
import { ScanError, useProfileScan } from "./data";

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

function CapturePane() {
  const scan = useProfileScan();

  if (scan.isPending) {
    return <p className="p-4 text-[13px] text-muted-foreground">Reading profile…</p>;
  }

  if (scan.isError) {
    const isWrongPage = scan.error instanceof ScanError && scan.error.isWrongPage;
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
          {scan.error.message}
        </p>
        <button
          type="button"
          onClick={() => void scan.refetch()}
          className="self-start rounded-md border border-input px-3 py-2 text-[13px] font-medium text-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  const { profile, existing } = scan.data;

  if (existing) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <p className="text-[13px] font-semibold text-foreground">Already in your pipeline</p>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {existing.name}
          {existing.companyName ? ` · ${existing.companyName}` : ""} · {existing.statusLabel}
        </p>
        <a
          className="text-[13px] font-medium text-primary underline underline-offset-2"
          href={`${WEB_ORIGIN}/contacts/${existing.id}`}
          target="_blank"
          rel="noreferrer"
        >
          Open in Isotope
        </a>
      </div>
    );
  }

  return <CaptureForm profile={profile} />;
}

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SignedIn>
        <CapturePane />
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
