import type * as Schemas from "@app/schemas";
import { Button } from "@/shadcn/ui/button";

export function DraftTab({ contact }: { contact: Schemas.Contact }) {
  if (!contact.draftSubject && !contact.draftBody) {
    return (
      <div className="px-5 py-8 text-center text-(--text-secondary) text-sm">
        No draft yet. AI will generate one overnight.
      </div>
    );
  }

  return (
    <div className="px-5 py-4.5 flex flex-col gap-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) flex items-center gap-1.5">
        <span className="text-(--warning) text-[13px]">✦</span>
        Touch {contact.sequencePosition ?? 1} · {contact.abVariable ?? "Email"}
      </div>

      {contact.draftSubject && (
        <div className="bg-background border border-border rounded-lg px-3.5 py-3 relative">
          <div className="text-[13px] font-medium text-foreground pr-14 leading-snug">
            {contact.draftSubject}
          </div>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="absolute top-2.5 right-2.5"
            onClick={() => navigator.clipboard.writeText(contact.draftSubject ?? "")}
          >
            Copy
          </Button>
        </div>
      )}

      {contact.draftBody && (
        <div className="bg-background border border-border rounded-lg px-3.5 py-3 relative">
          <pre className="text-[13px] leading-[1.75] text-foreground whitespace-pre-wrap font-sans pr-16">
            {contact.draftBody}
          </pre>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="absolute top-2.5 right-2.5"
            onClick={() => navigator.clipboard.writeText(contact.draftBody ?? "")}
          >
            Copy body
          </Button>
        </div>
      )}

      {contact.personalizationNotes && (
        <div className="border-b border-border pt-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2 flex items-center gap-1.5">
            <span className="text-(--warning) text-[13px]">✦</span>
            Context used in draft
          </div>
          <div className="bg-(--ai-bg,var(--warning-bg)) border border-border border-l-[3px] border-l-(--ai-border,var(--warning)) rounded-r-lg px-3.5 py-3 text-[12px] leading-[1.65] text-(--text-secondary)">
            {contact.personalizationNotes}
          </div>
        </div>
      )}

      {contact.abVariant && (
        <div className="bg-(--surface-raised) border-l-[3px] border-primary rounded-r-lg px-3.5 py-3 text-[13px] leading-[1.55] text-(--text-secondary)">
          <strong className="text-primary font-semibold">Variant {contact.abVariant}</strong>
          {contact.abVariable && ` · ${contact.abVariable}`}
        </div>
      )}
    </div>
  );
}
