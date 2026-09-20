import { useEffect, useRef, useState } from "react";
import type * as Schemas from "@app/schemas";
import type { ExtractedProfile, ExtractionSource } from "@/lib/extractProfile";
import { useAiParse, useCaptureContact } from "./data";

const WEB_ORIGIN = import.meta.env.WXT_WEB_ORIGIN;

const FIELD_CLASS =
  "w-full rounded-md border border-input bg-card px-2.5 py-2 text-[13px] text-foreground outline-none focus:border-ring focus:ring-1 focus:ring-ring";
const LABEL_CLASS =
  "mb-1 block text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground";

/** A guessed value is worth flagging; a value read from structured data is not. */
function sourceHint(source: ExtractionSource): string | null {
  if (source === "slug") return "guessed from the profile URL";
  if (source === "ai") return "filled by AI, check it";
  if (source === "none") return "not found on the page";
  // Inferred from where the text sits on the page rather than read from a labelled field.
  if (source === "page-text") return "read from the page text, check it";
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
  // Tracks which inputs the user has typed in, so an AI result that lands mid-edit can fill the
  // untouched fields without overwriting what they are working on. A ref, not state: nothing
  // renders from it, and keeping it out of state keeps the fill effect's deps honest.
  const editedFields = useRef<Record<string, boolean>>({});

  const capture = useCaptureContact();

  // Name and company are the two fields a capture can't proceed without; a missing title is not
  // worth an inference call on its own.
  const needsAi = !profile.name || !profile.companyName;
  const aiParse = useAiParse(profile, needsAi);
  const aiResult = aiParse.data;

  // Fill only what is still blank and still untouched. Functional updates read the latest value
  // without naming it as a dependency, so this runs when the AI result lands and never re-fires
  // to re-fill something the user just cleared.
  useEffect(() => {
    if (!aiResult) return;
    const fillIfBlank =
      (field: "name" | "designation" | "companyName", value: string | null) => (current: string) =>
        value && !current && !editedFields.current[field] ? value : current;

    setName(fillIfBlank("name", aiResult.name));
    setCompanyName(fillIfBlank("companyName", aiResult.companyName));
    setDesignation(fillIfBlank("designation", aiResult.designation));
  }, [aiResult]);

  // Every way the AI step can end must be visible. Failing silently made "it isn't running",
  // "it failed" and "it found nothing" indistinguishable, which is unusable for debugging.
  const aiStatus = ((): { message: string; isError: boolean } | null => {
    if (!needsAi) return null;
    if (!profile.pageText) {
      return {
        message: "Couldn't read this page's text, so AI wasn't run. Fill the blanks manually.",
        isError: false,
      };
    }
    if (aiParse.isFetching) return { message: "Reading the rest with AI…", isError: false };
    if (aiParse.isError) {
      return { message: `AI parse failed: ${aiParse.error.message}`, isError: true };
    }
    if (aiParse.isSuccess && !companyName.trim()) {
      return {
        message: "AI couldn't find a company on this profile. Enter it manually.",
        isError: false,
      };
    }
    return null;
  })();

  const markEdited = (field: string) => {
    editedFields.current[field] = true;
  };

  /** A field the AI supplied and the user hasn't touched is worth flagging as machine-written. */
  const hintFor = (
    field: "name" | "designation" | "companyName",
    value: string,
  ): ExtractionSource => {
    if (aiResult?.[field] && value === aiResult[field] && !profile[field]) return "ai";
    return profile.sources[field];
  };

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
          href={`${WEB_ORIGIN}/contacts?panel=${contact.id}`}
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
          onChange={(event) => {
            markEdited("name");
            setName(event.target.value);
          }}
          autoComplete="off"
        />
        <FieldHint source={hintFor("name", name)} />
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="capture-company">
          Company
        </label>
        <input
          id="capture-company"
          className={FIELD_CLASS}
          value={companyName}
          onChange={(event) => {
            markEdited("companyName");
            setCompanyName(event.target.value);
          }}
          autoComplete="off"
          placeholder="Required"
        />
        <FieldHint source={hintFor("companyName", companyName)} />
      </div>

      <div>
        <label className={LABEL_CLASS} htmlFor="capture-designation">
          Title
        </label>
        <input
          id="capture-designation"
          className={FIELD_CLASS}
          value={designation}
          onChange={(event) => {
            markEdited("designation");
            setDesignation(event.target.value);
          }}
          autoComplete="off"
          placeholder="Optional"
        />
        <FieldHint source={hintFor("designation", designation)} />
      </div>

      {aiStatus && (
        <p
          className={`text-[11px] leading-relaxed ${aiStatus.isError ? "text-destructive" : "text-muted-foreground"}`}
          role={aiStatus.isError ? "alert" : undefined}
        >
          {aiStatus.message}
        </p>
      )}

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
