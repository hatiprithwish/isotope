import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { toast } from "sonner";
import { XIcon } from "@phosphor-icons/react";
import { Field, FieldError, FieldLabel } from "@/shadcn/ui/field";
import { Button } from "@/shadcn/ui/button";
import CompanySelect from "@/shared/fields/CompanySelect";
import { useCreateJob, useUpdateJob } from "./-data";
import type * as Schemas from "@app/schemas";

type AddMode = { mode: "add"; job?: never };
type EditMode = { mode: "edit"; job: Schemas.Job };
type Props = (AddMode | EditMode) & { onSuccess: () => void; onClose: () => void };

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  url: z
    .string()
    .min(1, "URL is required.")
    .refine((v) => {
      try {
        new URL(v);
        return true;
      } catch {
        return false;
      }
    }, "Must be a valid URL."),
  companyId: z.number().nullable(),
  description: z.string(),
  location: z.string(),
  salary: z.string(),
  source: z.string(),
});

const inputCls =
  "w-full h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors group-data-[invalid=true]/field:border-destructive";

const labelCls = "text-[12px] font-semibold text-(--text-secondary)";

export default function AddOrEditJobModal({ mode, job, onSuccess, onClose }: Props) {
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();
  const isPending = createJob.isPending || updateJob.isPending;

  const form = useForm({
    defaultValues: {
      title: job?.title ?? "",
      url: job?.url ?? "",
      companyId: job?.companyId ?? null,
      description: job?.description ?? "",
      location: job?.location ?? "",
      salary: job?.salary ?? "",
      source: job?.source ?? "",
    },
    validators: { onSubmit: formSchema },
    onSubmit: ({ value }) => {
      if (mode === "edit") {
        const body: Schemas.UpdateJobApiRequest = {};
        if (value.title) body.title = value.title;
        if (value.url) body.url = value.url;
        body.companyId = value.companyId;
        body.description = value.description || null;
        body.location = value.location || null;
        body.salary = value.salary || null;
        body.source = value.source || null;

        updateJob.mutate(
          { id: job.id, body },
          {
            onSuccess: () => {
              toast.success("Job updated.");
              onSuccess();
            },
          },
        );
      } else {
        const body: Schemas.CreateJobApiRequest = {
          title: value.title,
          url: value.url,
          companyId: value.companyId,
          description: value.description || null,
          location: value.location || null,
          salary: value.salary || null,
          source: value.source || null,
        };
        createJob.mutate(body, {
          onSuccess: () => {
            toast.success("Job added.");
            onSuccess();
          },
        });
      }
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-[15px] font-semibold text-foreground">
            {mode === "add" ? "Add job" : "Edit job"}
          </span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
            <XIcon size={14} />
          </Button>
        </div>

        <div className="px-5 py-5 max-h-[75vh] overflow-y-auto">
          <form
            onSubmit={(e: React.SyntheticEvent) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="flex flex-col gap-4"
          >
            {/* Title */}
            <form.Field name="title">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name} className={labelCls}>
                      Job title <span className="text-destructive">*</span>
                    </FieldLabel>
                    <input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. Senior Software Engineer"
                      aria-invalid={isInvalid}
                      className={inputCls}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            </form.Field>

            {/* URL */}
            <form.Field name="url">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name} className={labelCls}>
                      Job URL <span className="text-destructive">*</span>
                    </FieldLabel>
                    <input
                      id={field.name}
                      type="url"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="https://jobs.example.com/..."
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
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name} className={labelCls}>
                    Company
                  </FieldLabel>
                  <CompanySelect
                    value={field.state.value}
                    onChange={(id) => field.handleChange(id)}
                  />
                </Field>
              )}
            </form.Field>

            {/* Location + Salary */}
            <div className="flex gap-3">
              <form.Field name="location">
                {(field) => (
                  <Field className="flex-1">
                    <FieldLabel htmlFor={field.name} className={labelCls}>
                      Location
                    </FieldLabel>
                    <input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. Remote, Bengaluru"
                      className={inputCls}
                    />
                  </Field>
                )}
              </form.Field>

              <form.Field name="salary">
                {(field) => (
                  <Field className="flex-1">
                    <FieldLabel htmlFor={field.name} className={labelCls}>
                      Salary
                    </FieldLabel>
                    <input
                      id={field.name}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. ₹40–60 LPA"
                      className={inputCls}
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            {/* Source */}
            <form.Field name="source">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name} className={labelCls}>
                    Source
                  </FieldLabel>
                  <input
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g. LinkedIn, Naukri, Referral"
                    className={inputCls}
                  />
                </Field>
              )}
            </form.Field>

            {/* Description */}
            <form.Field name="description">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name} className={labelCls}>
                    Job description
                  </FieldLabel>
                  <textarea
                    id={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Paste the job description here…"
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none"
                  />
                </Field>
              )}
            </form.Field>

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
                  ? mode === "edit"
                    ? "Saving…"
                    : "Adding…"
                  : mode === "edit"
                    ? "Save changes"
                    : "Add job"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
