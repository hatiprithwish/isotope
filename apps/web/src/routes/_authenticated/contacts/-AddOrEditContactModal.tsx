import { useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { z } from "zod";
import { InfoIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import { Field, FieldError, FieldLabel } from "@/shadcn/ui/field";
import { Button } from "@/shadcn/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shadcn/ui/tooltip";
import CompanySelect from "@/shared/fields/CompanySelect";
import Utilities from "@/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { ContactsQueries, useCreateContact, useUpdateContact } from "./-data";
import { ContactStatusIntEnum, ContactStatusLabelEnum, ContactSourceIntEnum } from "@app/schemas";
import type * as Schemas from "@app/schemas";

type AddMode = { mode: "add"; contact?: never };
type EditMode = { mode: "edit"; contact: Schemas.Contact };
type Props = (AddMode | EditMode) & { onClose: () => void };

const LAST_CONTACT_DEFAULTS_KEY = "isotope:lastContactDefaults";

interface LastContactDefaults {
  companyId: string;
  designation: string;
}

function readLastContactDefaults(): LastContactDefaults {
  try {
    const raw = localStorage.getItem(LAST_CONTACT_DEFAULTS_KEY);
    if (!raw) return { companyId: "", designation: "" };
    const parsed = JSON.parse(raw) as Partial<LastContactDefaults>;
    return {
      companyId: parsed.companyId ?? "",
      designation: parsed.designation ?? "",
    };
  } catch {
    return { companyId: "", designation: "" };
  }
}

function writeLastContactDefaults(defaults: LastContactDefaults): void {
  try {
    localStorage.setItem(LAST_CONTACT_DEFAULTS_KEY, JSON.stringify(defaults));
  } catch {
    // localStorage unavailable (e.g. private browsing) — safe to ignore
  }
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  companyId: z.string().min(1, "Company is required."),
  designation: z.string(),
  email: z.string().refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: "Must be a valid email.",
  }),
  linkedinUrl: z.string(),
  status: z.enum(ContactStatusIntEnum),
});

export const STATUS_OPTIONS: { value: ContactStatusIntEnum; label: string }[] = [
  { value: ContactStatusIntEnum.NotStarted, label: ContactStatusLabelEnum.NotStarted },
  { value: ContactStatusIntEnum.DraftReady, label: ContactStatusLabelEnum.DraftReady },
  { value: ContactStatusIntEnum.InPipeline, label: ContactStatusLabelEnum.InPipeline },
  { value: ContactStatusIntEnum.Replied, label: ContactStatusLabelEnum.Replied },
  { value: ContactStatusIntEnum.Closed, label: ContactStatusLabelEnum.Closed },
  { value: ContactStatusIntEnum.Dead, label: ContactStatusLabelEnum.Dead },
  { value: ContactStatusIntEnum.ReEngage, label: ContactStatusLabelEnum.ReEngage },
  { value: ContactStatusIntEnum.Failed, label: ContactStatusLabelEnum.Failed },
];

const inputCls =
  "h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors w-full group-data-[invalid=true]/field:border-destructive";

const labelCls = "text-[12px] font-semibold text-(--text-secondary)";

export default function AddOrEditContactModal({ mode, contact, onClose }: Props) {
  const { getToken } = useAuth();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  const isPending = mode === "add" ? createContact.isPending : updateContact.isPending;
  const lastAutofilledName = useRef("");

  const lastDefaults = mode === "add" ? readLastContactDefaults() : null;

  const form = useForm({
    defaultValues: {
      name: contact?.name ?? "",
      companyId:
        contact?.companyId != null ? String(contact.companyId) : (lastDefaults?.companyId ?? ""),
      designation: contact?.designation ?? lastDefaults?.designation ?? "",
      email: contact?.email ?? "",
      linkedinUrl: contact?.linkedinUrl ?? "",
      status: contact?.status ?? ContactStatusIntEnum.NotStarted,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({ value }) => {
      const fields = {
        name: value.name.trim(),
        companyId: Number(value.companyId),
        designation: value.designation.trim() || null,
        email: value.email.trim() || null,
        linkedinUrl: value.linkedinUrl.trim() || null,
      };

      if (mode === "add") {
        createContact.mutate(
          {
            contact: {
              ...fields,
              status: ContactStatusIntEnum.NotStarted,
              source: ContactSourceIntEnum.Manual,
            },
          },
          {
            onSuccess: () => {
              writeLastContactDefaults({
                companyId: value.companyId,
                designation: value.designation.trim(),
              });
              onClose();
            },
          },
        );
      } else {
        updateContact.mutate(
          { id: contact.id, body: { contact: { ...fields, status: value.status } } },
          { onSuccess: onClose },
        );
      }
    },
  });

  const maybeAutofillName = (email: string, linkedinUrl: string) => {
    const currentName = form.getFieldValue("name").trim();
    if (currentName && currentName !== lastAutofilledName.current) return;

    const guess = Utilities.guessNameFromEmailOrLinkedin(email, linkedinUrl);
    if (guess) {
      lastAutofilledName.current = guess;
      form.setFieldValue("name", guess);
    }
  };

  const excludeId = mode === "edit" ? contact.id : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-[15px] font-semibold text-foreground">
            {mode === "add" ? "Add contact" : "Edit contact"}
          </span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
            <XIcon size={14} />
          </Button>
        </div>

        <form
          onSubmit={(e: React.SyntheticEvent) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="px-5 py-5 flex flex-col gap-4"
        >
          {/* Name */}
          <form.Field name="name">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel
                    htmlFor={field.name}
                    className={`${labelCls} inline-flex items-center gap-1`}
                  >
                    Name <span className="text-destructive">*</span>
                    <Tooltip>
                      <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <InfoIcon className="h-3 w-3 text-gray-500 hover:text-gray-400 cursor-pointer" />
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs text-xs">
                        Paste an email or LinkedIn URL below and we&apos;ll fill in the name for
                        you.
                      </TooltipContent>
                    </Tooltip>
                  </FieldLabel>
                  <input
                    id={field.name}
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g. Priya Sharma"
                    aria-invalid={isInvalid}
                    className={inputCls}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          {/* Company */}
          <form.Field name="companyId">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel
                    htmlFor={field.name}
                    className={`${labelCls} inline-flex items-center gap-1`}
                  >
                    Company <span className="text-destructive">*</span>
                    {mode === "add" && (
                      <Tooltip>
                        <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <InfoIcon className="h-3 w-3 text-gray-500 hover:text-gray-400 cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs text-xs">
                          Defaults to the company and title you used last time — change either if
                          this contact is different.
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </FieldLabel>
                  <CompanySelect
                    value={field.state.value ? Number(field.state.value) : null}
                    onChange={(id) => field.handleChange(id != null ? String(id) : "")}
                    onBlur={field.handleBlur}
                    error={isInvalid ? field.state.meta.errors[0]?.message : undefined}
                  />
                </Field>
              );
            }}
          </form.Field>

          {/* Title */}
          <form.Field name="designation">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name} className={labelCls}>
                  Title
                </FieldLabel>
                <input
                  id={field.name}
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="e.g. Engineering Manager"
                  className={inputCls}
                />
              </Field>
            )}
          </form.Field>

          {/* Email + LinkedIn */}
          <div className="flex gap-3">
            <form.Field name="email">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid} className="flex-1">
                    <FieldLabel htmlFor={field.name} className={labelCls}>
                      Email
                    </FieldLabel>
                    <input
                      id={field.name}
                      type="email"
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                        maybeAutofillName(e.target.value, form.getFieldValue("linkedinUrl"));
                      }}
                      onBlur={(e) => {
                        field.handleBlur();
                        maybeAutofillName(e.target.value, form.getFieldValue("linkedinUrl"));
                      }}
                      placeholder="priya@example.com"
                      aria-invalid={isInvalid}
                      className={inputCls}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="linkedinUrl">
              {(field) => (
                <Field className="flex-1">
                  <FieldLabel htmlFor={field.name} className={labelCls}>
                    LinkedIn
                  </FieldLabel>
                  <input
                    id={field.name}
                    type="text"
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      maybeAutofillName(form.getFieldValue("email"), e.target.value);
                    }}
                    onBlur={(e) => {
                      field.handleBlur();
                      maybeAutofillName(form.getFieldValue("email"), e.target.value);
                    }}
                    placeholder="linkedin.com/in/…"
                    className={inputCls}
                  />
                </Field>
              )}
            </form.Field>
          </div>

          <form.Subscribe selector={(state) => [state.values.email, state.values.linkedinUrl]}>
            {([email, linkedinUrl]) => (
              <DuplicateContactWarning
                email={email}
                linkedinUrl={linkedinUrl}
                excludeId={excludeId}
                getToken={getToken}
              />
            )}
          </form.Subscribe>

          {/* Status */}
          {mode === "edit" && (
            <form.Field name="status">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name} className={labelCls}>
                    Status
                  </FieldLabel>
                  <select
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) =>
                      field.handleChange(Number(e.target.value) as Schemas.ContactStatusIntEnum)
                    }
                    onBlur={field.handleBlur}
                    className={inputCls}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </form.Field>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => {
                form.reset();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={isPending} className="flex-1">
              {isPending
                ? mode === "add"
                  ? "Adding…"
                  : "Saving…"
                : mode === "add"
                  ? "Add contact"
                  : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DuplicateContactWarning({
  email,
  linkedinUrl,
  excludeId,
  getToken,
}: {
  email: string;
  linkedinUrl: string;
  excludeId?: number;
  getToken: () => Promise<string | null>;
}) {
  const debouncedEmail = useDebouncedValue(email.trim(), 400);
  const debouncedLinkedinUrl = useDebouncedValue(linkedinUrl.trim(), 400);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);

  const { data } = useQuery({
    ...ContactsQueries.duplicateCheck(
      { email: debouncedEmail || null, linkedinUrl: debouncedLinkedinUrl || null, excludeId },
      getToken,
    ),
    enabled: Boolean(debouncedEmail || debouncedLinkedinUrl),
  });

  const match = data?.match;
  // Keyed by the triggering values, not just match.id — so dismissing one warning doesn't
  // permanently suppress a later, different-value match that happens to resolve to the same contact.
  const matchKey = match ? `${match.id}:${debouncedEmail}:${debouncedLinkedinUrl}` : null;
  if (!match || matchKey === dismissedKey) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
      <WarningIcon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <div className="flex-1">
        Possible match:{" "}
        <a
          href={`/contacts/${match.id}`}
          target="_blank"
          rel="noreferrer"
          className="font-semibold underline underline-offset-2"
        >
          {match.name}
        </a>
        {match.companyName ? ` at ${match.companyName}` : ""} — check before adding another.
      </div>
      <button
        type="button"
        onClick={() => setDismissedKey(matchKey)}
        className="shrink-0 text-amber-700/70 hover:text-amber-700 dark:text-amber-400/70 dark:hover:text-amber-400"
      >
        Dismiss
      </button>
    </div>
  );
}
