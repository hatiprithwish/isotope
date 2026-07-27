import { useForm } from "@tanstack/react-form";
import { ArrowElbowDownLeftIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import { Input } from "@/shadcn/ui/input";
import { Textarea } from "@/shadcn/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/shadcn/ui/field";
import * as Schemas from "@app/schemas";

interface NoteFormProps {
  currentTitle: string;
  currentBody?: string | null;
  onSubmit: (value: { title: string; body?: string | null }) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function NoteForm({
  currentTitle,
  currentBody,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: NoteFormProps) {
  const defaultValues: Schemas.NoteBase = {
    title: currentTitle,
    body: currentBody,
  };

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: Schemas.ZNoteBase,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <form.Field name="title">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Title</FieldLabel>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                aria-invalid={isInvalid}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="body">
        {(field) => {
          const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Body</FieldLabel>
              <Textarea
                id={field.name}
                value={field.state.value ?? ""}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    form.handleSubmit();
                  }
                }}
                aria-invalid={isInvalid}
                rows={6}
                placeholder="Enter to save, Shift+Enter for a new line"
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          );
        }}
      </form.Field>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            form.reset();
            onCancel();
          }}
        >
          Cancel
        </Button>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting ? (
                "Saving..."
              ) : (
                <>
                  {submitLabel}
                  <ArrowElbowDownLeftIcon size={13} />
                </>
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
