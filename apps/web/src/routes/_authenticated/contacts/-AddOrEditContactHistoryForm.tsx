import { useEffect, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowElbowDownLeftIcon } from "@phosphor-icons/react";
import { ContactHistoryChannelEnum, ContactHistoryDirectionEnum } from "@app/schemas";
import { Field, FieldError } from "@/shadcn/ui/field";
import { Button } from "@/shadcn/ui/button";
import type * as Schemas from "@app/schemas";
import { useCreateContactHistory, useUpdateContactHistory, ContactsQueries } from "./-data";

const formSchema = z.object({
  body: z.string().min(1, "Message body is required."),
  sentAt: z.string().min(1, "Date is required."),
});

type AddMode = {
  mode: "add";
  entry?: never;
  onDone?: never;
  onSaved: () => void;
  getToken: () => Promise<string | null>;
};
type EditMode = {
  mode: "edit";
  entry: Schemas.ContactHistory;
  onDone: () => void;
  onSaved?: never;
  getToken?: never;
};
type Props = (AddMode | EditMode) & { contactId: number };

export function AddOrEditContactHistoryForm({
  mode,
  contactId,
  entry,
  onDone,
  onSaved,
  getToken,
}: Props) {
  const createHistory = useCreateContactHistory();
  const updateHistory = useUpdateContactHistory();

  const templateQuery = useQuery({
    ...ContactsQueries.messageTemplate(contactId, getToken ?? (() => Promise.resolve(null))),
    enabled: mode === "add",
  });
  const resolved = templateQuery.data;
  const hasTemplate = mode === "add" && !!resolved?.renderedBody;

  const [direction, setDirection] = useState<ContactHistoryDirectionEnum>(
    ContactHistoryDirectionEnum.Me,
  );
  const [channel, setChannel] = useState<ContactHistoryChannelEnum>(
    ContactHistoryChannelEnum.Email,
  );
  // Tracks the template body last auto-seeded into the field, so a later template change
  // (e.g. deleting a history entry reverts the resolved step) can re-seed — but only while the
  // field still holds exactly what was auto-seeded, never clobbering a manual edit.
  const lastSeededBody = useRef<string | null>(null);
  const [todayIsoDate] = useState(() => new Date().toISOString().slice(0, 10));

  const form = useForm({
    defaultValues: {
      body: entry?.body ?? "",
      sentAt: entry ? entry.sentAt.slice(0, 10) : todayIsoDate,
    },
    validators: { onSubmit: formSchema },
    onSubmit: ({ value }) => {
      if (mode === "add") {
        createHistory.mutate(
          {
            contactId,
            body: { direction, channel, body: value.body.trim(), sentAt: value.sentAt },
          },
          {
            onSuccess: () => {
              form.reset();
              // By now useCreateContactHistory's own onSuccess (data.ts) has already awaited the
              // messageTemplate invalidation/refetch, so `resolved` here already reflects the next
              // step's template — that refetch may have already re-fired the seeding effect against
              // the pre-reset body, so re-seed explicitly instead of relying on the effect to fire
              // again (its only dependency, `resolved`, won't change again on its own).
              const nextBody = resolved?.renderedBody;
              lastSeededBody.current = nextBody ?? null;
              if (nextBody) form.setFieldValue("body", nextBody);
              onSaved();
            },
          },
        );
      } else {
        updateHistory.mutate(
          { contactId, historyId: entry.id, body: { body: value.body, sentAt: value.sentAt } },
          { onSuccess: onDone },
        );
      }
    },
  });

  const isPending = mode === "add" ? createHistory.isPending : updateHistory.isPending;

  // Seed the body from the resolved template whenever it loads or changes — but only while the
  // field is empty, or still holds exactly what was auto-seeded last time (so re-resolving after
  // a history edit/delete shifts the step correctly), never clobbering a manual edit. A ref (not
  // state) guards this since it's an imperative sync into TanStack Form's own store, not
  // something that should itself trigger a React re-render.
  useEffect(() => {
    if (mode !== "add" || !hasTemplate || !resolved?.renderedBody) return;
    const currentBody = form.getFieldValue("body");
    if (currentBody === "" || currentBody === lastSeededBody.current) {
      lastSeededBody.current = resolved.renderedBody;
      form.setFieldValue("body", resolved.renderedBody);
    }
  }, [mode, hasTemplate, resolved, form]);

  return (
    <form
      onSubmit={(e: React.SyntheticEvent) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className={[
        "flex flex-col gap-3",
        mode === "add" ? "pt-3 border-t border-border" : "w-full",
      ].join(" ")}
    >
      {/* Direction + Channel toggles + Date — add mode only */}
      {mode === "add" && (
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden text-[12px] font-medium">
            {[
              { value: ContactHistoryDirectionEnum.Me, label: "Me" },
              { value: ContactHistoryDirectionEnum.Contact, label: "Contact" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDirection(opt.value)}
                className={[
                  "h-7 px-3 transition-colors",
                  direction === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-(--text-secondary) hover:bg-(--surface-raised)",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden text-[12px] font-medium">
            {[
              { value: ContactHistoryChannelEnum.Email, label: "Email" },
              { value: ContactHistoryChannelEnum.LinkedIn, label: "LinkedIn" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setChannel(opt.value)}
                className={[
                  "h-7 px-3 transition-colors",
                  channel === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "text-(--text-secondary) hover:bg-(--surface-raised)",
                ].join(" ")}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <form.Field name="sentAt">
            {(field) => (
              <input
                id={field.name}
                type="date"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="h-7 px-2 rounded-lg border border-border bg-background text-[12px] text-foreground outline-none focus:border-primary transition-colors ml-auto scheme-light dark:scheme-dark"
              />
            )}
          </form.Field>
        </div>
      )}

      {/* Date — edit mode only */}
      {mode === "edit" && (
        <form.Field name="sentAt">
          {(field) => (
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-(--text-secondary)">Date</span>
              <input
                id={field.name}
                type="date"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                className="h-7 px-2 rounded-lg border border-border bg-background text-[12px] text-foreground outline-none focus:border-primary transition-colors self-start scheme-light dark:scheme-dark"
              />
            </div>
          )}
        </form.Field>
      )}

      {/* Body */}
      <form.Field name="body">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              {mode === "add" && !templateQuery.isPending && !hasTemplate && (
                <p className="text-[12px] text-(--text-secondary) mb-1.5">
                  No default message template set.{" "}
                  <Link to="/settings" className="text-primary hover:underline">
                    Configure in Settings →
                  </Link>
                </p>
              )}
              {mode === "add" && resolved?.isAmbiguousMatch && (
                <p className="text-[12px] text-(--warning-text) mb-1.5">
                  This company has multiple job types listed, so we used your default template
                  instead of guessing.
                </p>
              )}
              <textarea
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    form.handleSubmit();
                  }
                }}
                placeholder="Type the message body… (Enter to submit, Shift+Enter for a new line)"
                rows={3}
                aria-invalid={isInvalid}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground leading-[1.65] resize-none outline-none focus:border-primary transition-colors placeholder:text-muted-foreground group-data-[invalid=true]/field:border-destructive"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      </form.Field>

      {/* Actions */}
      {mode === "add" ? (
        <Button type="submit" size="default" disabled={isPending} className="self-end gap-1.5">
          {isPending ? (
            "Saving…"
          ) : (
            <>
              Log message
              <ArrowElbowDownLeftIcon size={13} />
            </>
          )}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="default" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" size="default" disabled={isPending} className="gap-1.5">
            {isPending ? (
              "Saving…"
            ) : (
              <>
                Save
                <ArrowElbowDownLeftIcon size={13} />
              </>
            )}
          </Button>
        </div>
      )}
    </form>
  );
}
