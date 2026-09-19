import { useState } from "react";
import type * as Schemas from "@app/schemas";
import type { ExtractedProfile, ExtractionSource } from "@/lib/extractProfile";
import { useCaptureContact } from "./data";

const WEB_ORIGIN = import.meta.env.WXT_WEB_ORIGIN;

const FIELD_CLASS =
  "w-full rounded-md border border-input bg-card px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring";
const LABEL_CLASS =
  "mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground";

/** A guessed value is worth flagging; a value read from structured data is not. */
function sourceHint(source: ExtractionSource): string | null {
  if (source === "slug") return "guessed from the profile URL";
  if (source === "none") return "not found on the page";
  return null;
}

function FieldHint({ source }: { source: ExtractionSource }) {
  const hint = sourceHint(source);
  if (!hint) return null;
  return <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>;
}

export default function CaptureForm({ profile }: { profile: ExtractedProfile }) {
  const [name, setName] = useState(profile.name);
  const [companyName, setCompanyName] = useState(profile.companyName);
  const [designation, setDesignation] = useState(profile.designation);

  const capture = useCaptureContact();

  const trimmedName = name.trim();
  const trimmedCompany = companyName.trim();
  // Company is required because capture creates it when it doesn't exist — an empty or wrong
  // value silently pollutes the companies list, which is costlier than asking the user to type it.
  const canSubmit = Boolean(trimmedName && trimmedCompany) && !capture.isPending;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;

    const payload: Schemas.CaptureContactApiRequest = {
      name: trimmedName,
      companyName: trimmedCompany,
      linkedinUrl: profile.linkedinUrl,
      designation: designation.trim() || null,
    };
    capture.mutate(payload);
  };

  if (capture.isSuccess && capture.data.contact) {
    const contact = capture.data.contact;
    return (
      <div className="flex flex-col gap-3 p-4">
        <p className="text-[13px] font-semibold text-foreground">
          {capture.data.isDuplicate ? "Already in your pipeline" : "Added to Isotope"}
        </p>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {contact.name}
          {contact.companyName ? ` · ${contact.companyName}` : ""}
          {capture.data.isNewCompany ? " · new company created" : ""}
        </p>
        <a
          className="text-[13px] font-medium text-primary underline underline-offset-2"
          href={`${WEB_ORIGIN}/contacts/${contact.id}`}
          target="_blank"
          rel="noreferrer"
        >
          Open in Isotope
        </a>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-3 p-4" onSubmit={handleSubmit}>
      <div>
        <label className={LABEL_CLASS} htmlFor="capture-name">
          Name
        </label>
        <input
          id="capture-name"
          className={FIELD_CLASS}
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="off"
        />
        <FieldHint source={profile.sources.name} />
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="capture-company">
          Company
        </label>
        <input
          id="capture-company"
          className={FIELD_CLASS}
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          autoComplete="off"
          placeholder="Required"
        />
        <FieldHint source={profile.sources.companyName} />
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="capture-designation">
          Title
        </label>
        <input
          id="capture-designation"
          className={FIELD_CLASS}
          value={designation}
          onChange={(event) => setDesignation(event.target.value)}
          autoComplete="off"
          placeholder="Optional"
        />
        <FieldHint source={profile.sources.designation} />
      </div>

      <p className="truncate text-[11px] text-muted-foreground" title={profile.linkedinUrl}>
        {profile.linkedinUrl}
      </p>

      {capture.isError && (
        <p className="text-[13px] leading-relaxed text-destructive" role="alert">
          {capture.error.message}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="rounded-md bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground disabled:opacity-50"
      >
        {capture.isPending ? "Adding…" : "Add to Isotope"}
      </button>
    </form>
  );
}
