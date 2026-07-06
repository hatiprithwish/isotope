import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { XIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { Field, FieldError, FieldLabel } from "@/shadcn/ui/field";
import { Button } from "@/shadcn/ui/button";
import { useCreateContact, useUpdateContact } from "./-data";
import { CompaniesQueries } from "../companies/-data";
import { ContactStatusIntEnum, ContactSourceIntEnum } from "@app/schemas";
import type * as Schemas from "@app/schemas";

type AddMode = { mode: "add"; contact?: never };
type EditMode = { mode: "edit"; contact: Schemas.Contact };
type Props = (AddMode | EditMode) & { onClose: () => void };

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  companyId: z.string().min(1, "Company is required."),
  designation: z.string(),
  email: z.string().refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: "Must be a valid email.",
  }),
  linkedinUrl: z.string(),
});

const inputCls =
  "h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors w-full group-data-[invalid=true]/field:border-destructive";

const labelCls = "text-[12px] font-semibold text-(--text-secondary)";

export default function AddOrEditContactModal({ mode, contact, onClose }: Props) {
  const { getToken } = useAuth();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  const { data: companiesData } = useQuery(CompaniesQueries.list({}, getToken));
  const companies = companiesData?.companies ?? [];

  const isPending = mode === "add" ? createContact.isPending : updateContact.isPending;

  const form = useForm({
    defaultValues: {
      name: contact?.name ?? "",
      companyId: contact?.companyId != null ? String(contact.companyId) : "",
      designation: contact?.designation ?? "",
      email: contact?.email ?? "",
      linkedinUrl: contact?.linkedinUrl ?? "",
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
          { onSuccess: onClose },
        );
      } else {
        updateContact.mutate({ id: contact.id, body: { contact: fields } }, { onSuccess: onClose });
      }
    },
  });

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
                  <FieldLabel htmlFor={field.name} className={labelCls}>
                    Name <span className="text-destructive">*</span>
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
                  <FieldLabel htmlFor={field.name} className={labelCls}>
                    Company <span className="text-destructive">*</span>
                  </FieldLabel>
                  <select
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                    className={inputCls}
                  >
                    <option value="">Select company…</option>
                    {companies.map((co) => (
                      <option key={co.id} value={co.id}>
                        {co.name}
                      </option>
                    ))}
                  </select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
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
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="linkedin.com/in/…"
                    className={inputCls}
                  />
                </Field>
              )}
            </form.Field>
          </div>

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
