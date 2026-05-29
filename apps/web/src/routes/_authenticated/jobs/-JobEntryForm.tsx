import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { FieldError } from "@/shadcn/ui/field";
import CompanySelect from "./-CompanySelect";
import { useCreateJob, useUpdateJob } from "./-data";
import type * as Schemas from "@app/schemas";

interface Props {
  initialData?: Schemas.Job;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormValues {
  title: string;
  url: string;
  companyId: number | null;
  description: string;
  location: string;
  salary: string;
  source: string;
}

const inputCls =
  "w-full h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors";

const labelCls = "text-[12px] font-semibold text-(--text-secondary)";

export default function JobEntryForm({ initialData, onSuccess, onCancel }: Props) {
  const isEdit = initialData != null;
  const createJob = useCreateJob();
  const updateJob = useUpdateJob();

  const form = useForm<FormValues>({
    defaultValues: {
      title: initialData?.title ?? "",
      url: initialData?.url ?? "",
      companyId: initialData?.companyId ?? null,
      description: initialData?.description ?? "",
      location: initialData?.location ?? "",
      salary: initialData?.salary ?? "",
      source: initialData?.source ?? "",
    },
    onSubmit: async ({ value }) => {
      if (isEdit) {
        const body: Schemas.UpdateJobApiRequest = {};
        if (value.title) body.title = value.title;
        if (value.url) body.url = value.url;
        body.companyId = value.companyId;
        body.description = value.description || null;
        body.location = value.location || null;
        body.salary = value.salary || null;
        body.source = value.source || null;

        updateJob.mutate(
          { id: initialData!.id, body },
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

  const isPending = createJob.isPending || updateJob.isPending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      {/* Title */}
      <form.Field
        name="title"
        validators={{
          onBlur: ({ value }) => (!value.trim() ? "Title is required." : undefined),
          onSubmit: ({ value }) => (!value.trim() ? "Title is required." : undefined),
        }}
      >
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={field.name} className={labelCls}>
                Job title <span className="text-destructive">*</span>
              </label>
              <input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="e.g. Senior Software Engineer"
                aria-invalid={isInvalid}
                className={[inputCls, isInvalid ? "border-destructive" : ""].join(" ")}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          );
        }}
      </form.Field>

      {/* URL */}
      <form.Field
        name="url"
        validators={{
          onBlur: ({ value }) => {
            if (!value.trim()) return "URL is required.";
            try {
              new URL(value);
              return undefined;
            } catch {
              return "Must be a valid URL.";
            }
          },
          onSubmit: ({ value }) => {
            if (!value.trim()) return "URL is required.";
            try {
              new URL(value);
              return undefined;
            } catch {
              return "Must be a valid URL.";
            }
          },
        }}
      >
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={field.name} className={labelCls}>
                Job URL <span className="text-destructive">*</span>
              </label>
              <input
                id={field.name}
                type="url"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="https://jobs.example.com/..."
                aria-invalid={isInvalid}
                className={[inputCls, isInvalid ? "border-destructive" : ""].join(" ")}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          );
        }}
      </form.Field>

      {/* Company */}
      <form.Field name="companyId">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={field.name} className={labelCls}>
              Company
            </label>
            <CompanySelect value={field.state.value} onChange={(id) => field.handleChange(id)} />
          </div>
        )}
      </form.Field>

      {/* Location + Salary */}
      <div className="flex gap-3">
        <form.Field name="location">
          {(field) => (
            <div className="flex flex-col gap-1.5 flex-1">
              <label htmlFor={field.name} className={labelCls}>
                Location
              </label>
              <input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="e.g. Remote, Bengaluru"
                className={inputCls}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="salary">
          {(field) => (
            <div className="flex flex-col gap-1.5 flex-1">
              <label htmlFor={field.name} className={labelCls}>
                Salary
              </label>
              <input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="e.g. ₹40–60 LPA"
                className={inputCls}
              />
            </div>
          )}
        </form.Field>
      </div>

      {/* Source */}
      <form.Field name="source">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={field.name} className={labelCls}>
              Source
            </label>
            <input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="e.g. LinkedIn, Naukri, Referral"
              className={inputCls}
            />
          </div>
        )}
      </form.Field>

      {/* Description */}
      <form.Field name="description">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={field.name} className={labelCls}>
              Job description
            </label>
            <textarea
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Paste the job description here…"
              rows={6}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
        )}
      </form.Field>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            form.reset();
            onCancel();
          }}
          className="h-7.75 px-3.5 rounded-lg text-[13px] font-medium border border-border text-foreground hover:bg-(--surface-raised) transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 h-7.75 px-3.5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? (isEdit ? "Saving…" : "Adding…") : isEdit ? "Save changes" : "Add job"}
        </button>
      </div>
    </form>
  );
}
