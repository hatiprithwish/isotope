import { XIcon } from "@phosphor-icons/react";
import type * as Schemas from "@app/schemas";
import JobEntryForm from "./-JobEntryForm";

interface Props {
  editJob?: Schemas.Job;
  onSuccess: () => void;
  onClose: () => void;
}

export function JobFormModal({ editJob, onSuccess, onClose }: Props) {
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
            {editJob ? "Edit job" : "Add job"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-(--text-secondary) hover:bg-(--surface-raised) hover:text-foreground transition-colors"
          >
            <XIcon size={14} />
          </button>
        </div>
        <div className="px-5 py-5 max-h-[75vh] overflow-y-auto">
          <JobEntryForm initialData={editJob} onSuccess={onSuccess} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
}
