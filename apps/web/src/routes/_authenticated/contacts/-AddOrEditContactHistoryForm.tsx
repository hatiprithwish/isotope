import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { ContactHistoryChannelEnum, ContactHistoryDirectionEnum } from "@app/schemas";
import { Field, FieldError } from "@/shadcn/ui/field";
import { Button } from "@/shadcn/ui/button";
import type * as Schemas from "@app/schemas";
import { useCreateContactHistory, useUpdateContactHistory } from "./-data";

const formSchema = z.object({
  body: z.string().min(1, "Message body is required."),
  sentAt: z.string().min(1, "Date is required."),
});

type AddMode = { mode: "add"; entry?: never; onDone?: never; onSaved: () => void };
type EditMode = {
  mode: "edit";
  entry: Schemas.ContactHistory;
  onDone: () => void;
  onSaved?: never;
};
type Props = (AddMode | EditMode) & { contactId: number };

export function AddOrEditContactHistoryForm({ mode, contactId, entry, onDone, onSaved }: Props) {
  const createHistory = useCreateContactHistory();
  const updateHistory = useUpdateContactHistory();

  const [direction, setDirection] = useState<ContactHistoryDirectionEnum>(
    ContactHistoryDirectionEnum.Me,
  );
  const [channel, setChannel] = useState<ContactHistoryChannelEnum>(
    ContactHistoryChannelEnum.Email,
  );

  const form = useForm({
    defaultValues: {
      body: entry?.body ?? "",
      sentAt: entry ? entry.sentAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
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
              <textarea
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Type the message body…"
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
        <Button type="submit" size="default" disabled={isPending} className="self-end">
          {isPending ? "Saving…" : "Log message"}
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="default" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" size="default" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </form>
  );
}
