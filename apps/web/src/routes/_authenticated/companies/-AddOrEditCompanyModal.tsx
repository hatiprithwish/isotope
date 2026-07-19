import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { XIcon } from "@phosphor-icons/react";
import { Field, FieldError, FieldLabel } from "@/shadcn/ui/field";
import { Button } from "@/shadcn/ui/button";
import { useCreateCompany, useUpdateCompany } from "./-data";
import { CompanyStatusIntEnum, CompanyStatusLabelEnum } from "@app/schemas";
import type * as Schemas from "@app/schemas";

type AddMode = { mode: "add"; company?: never };
type EditMode = { mode: "edit"; company: Schemas.Company };
type Props = (AddMode | EditMode) & { onClose: () => void };

const formSchema = z.object({
  name: z.string().min(1, "Company name is required."),
  website: z.string(),
  industry: z.string(),
  size: z.string(),
  location: z.string(),
  status: z.enum(CompanyStatusIntEnum),
});

const STATUS_OPTIONS: { value: CompanyStatusIntEnum; label: string }[] = [
  { value: CompanyStatusIntEnum.WaitingHuman, label: CompanyStatusLabelEnum.WaitingHuman },
  { value: CompanyStatusIntEnum.Accepted, label: CompanyStatusLabelEnum.Accepted },
  { value: CompanyStatusIntEnum.ContactsAdded, label: CompanyStatusLabelEnum.ContactsAdded },
  { value: CompanyStatusIntEnum.RejectedHuman, label: CompanyStatusLabelEnum.RejectedHuman },
  { value: CompanyStatusIntEnum.Interviewed, label: CompanyStatusLabelEnum.Interviewed },
  { value: CompanyStatusIntEnum.Offer, label: CompanyStatusLabelEnum.Offer },
];

const inputCls =
  "h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors w-full group-data-[invalid=true]/field:border-destructive";

const labelCls = "text-[12px] font-semibold text-(--text-secondary)";

export default function AddOrEditCompanyModal({ mode, company, onClose }: Props) {
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const isPending = mode === "add" ? createCompany.isPending : updateCompany.isPending;

  const form = useForm({
    defaultValues: {
      name: company?.name ?? "",
      website: company?.website ?? "",
      industry: company?.industry ?? "",
      size: company?.size ?? "",
      location: company?.location ?? "",
      status: company?.status ?? CompanyStatusIntEnum.WaitingHuman,
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({ value }) => {
      const fields = {
        name: value.name.trim(),
        website: value.website.trim() || null,
        industry: value.industry.trim() || null,
        size: value.size.trim() || null,
        location: value.location.trim() || null,
      };

      if (mode === "add") {
        createCompany.mutate(
          { company: { ...fields, status: CompanyStatusIntEnum.WaitingHuman } },
          { onSuccess: onClose },
        );
      } else {
        updateCompany.mutate(
          { id: company.id, body: { company: { ...fields, status: value.status } } },
          { onSuccess: onClose },
        );
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
            {mode === "add" ? "Add company" : "Edit company"}
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
                    Company name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <input
                    id={field.name}
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g. Razorpay"
                    aria-invalid={isInvalid}
                    className={inputCls}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          {/* Website */}
          <form.Field name="website">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name} className={labelCls}>
                  Website
                </FieldLabel>
                <input
                  id={field.name}
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="razorpay.com"
                  className={inputCls}
                />
              </Field>
            )}
          </form.Field>

          {/* Industry + Size */}
          <div className="flex gap-3">
            <form.Field name="industry">
              {(field) => (
                <Field className="flex-1">
                  <FieldLabel htmlFor={field.name} className={labelCls}>
                    Industry
                  </FieldLabel>
                  <input
                    id={field.name}
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Fintech"
                    className={inputCls}
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="size">
              {(field) => (
                <Field className="flex-1">
                  <FieldLabel htmlFor={field.name} className={labelCls}>
                    Company size
                  </FieldLabel>
                  <input
                    id={field.name}
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="500–1000"
                    className={inputCls}
                  />
                </Field>
              )}
            </form.Field>
          </div>

          {/* Location */}
          <form.Field name="location">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name} className={labelCls}>
                  Location
                </FieldLabel>
                <input
                  id={field.name}
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Bengaluru"
                  className={inputCls}
                />
              </Field>
            )}
          </form.Field>

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
                      field.handleChange(Number(e.target.value) as Schemas.CompanyStatusIntEnum)
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
                  ? "Add company"
                  : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
