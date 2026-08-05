import * as Schemas from "@app/schemas";
import { useState } from "react";
import Utilities from "@/utils";
import { CompanyContext } from "./-CompanyContext";
import { StatusChangeHistory } from "../-StatusChangeHistory";

function Avatar({ name }: { name: string }) {
  return (
    <span className="w-9 h-9 rounded-full inline-flex items-center justify-center font-semibold shrink-0 text-[13px] bg-(--surface-raised) text-(--text-secondary)">
      {Utilities.getInitials(name)}
    </span>
  );
}

interface AboutTabProps {
  contact: Schemas.Contact;
  getToken: () => Promise<string | null>;
  statusLabel: (status: number) => string;
}

export function AboutTab({ contact, getToken, statusLabel }: AboutTabProps) {
  const [emailCopied, setEmailCopied] = useState(false);

  const copyEmail = () => {
    if (!contact.email) return;
    void navigator.clipboard.writeText(contact.email);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  return (
    <div className="flex flex-col">
      <div className="px-5 py-4.5 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar name={contact.name} />
          <div className="min-w-0">
            <div className="text-base font-semibold text-foreground">{contact.name}</div>
            {contact.designation && (
              <div className="text-[12px] text-(--text-secondary) mt-0.5">
                {contact.designation}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-border overflow-hidden">
        {contact.email && (
          <button
            type="button"
            onClick={copyEmail}
            className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-border hover:bg-(--surface-raised) transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-foreground truncate">
                {contact.email}
              </div>
              <div className="text-[11px] text-(--text-secondary) mt-0.5">
                {emailCopied ? "Copied successfully" : "Work email"}
              </div>
            </div>
            <span className="w-7 h-7 flex items-center justify-center rounded-md text-(--text-secondary) shrink-0">
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 9m0 2a2 2 0 0 1 2 -2h7a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-7a2 2 0 0 1 -2 -2z" />
                <path d="M5 15h-1a2 2 0 0 1 -2 -2v-7a2 2 0 0 1 2 -2h7a2 2 0 0 1 2 2v1" />
              </svg>
            </span>
          </button>
        )}
        {contact.linkedinUrl && (
          <a
            href={Utilities.toHref(contact.linkedinUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-(--surface-raised) transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-foreground truncate">
                {contact.linkedinUrl}
              </div>
              {contact.linkedinConnected && (
                <div className="text-[11px] text-(--success-text) mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-(--success)" />
                  Connection accepted
                </div>
              )}
            </div>
            <span className="w-7 h-7 flex items-center justify-center rounded-md text-(--text-secondary) shrink-0">
              <svg
                width={14}
                height={14}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" />
                <path d="M11 13l9 -9M15 4h5v5" />
              </svg>
            </span>
          </a>
        )}
      </div>

      <div className="px-5 py-4.5 border-b border-border">
        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
          Sequence
        </div>
        <div className="bg-sidebar border border-border rounded-lg p-3.5 flex flex-col gap-2">
          {[
            {
              label: "Touch",
              value: contact.sequencePosition != null ? `${contact.sequencePosition} of 3` : "—",
            },
            { label: "A/B", value: contact.abVariant ? `Variant ${contact.abVariant}` : "—" },
            { label: "Variable", value: contact.abVariable ?? "—" },
            {
              label: "Source",
              value: contact.source === 1 ? "Apollo" : contact.source === 2 ? "Manual" : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[13px] text-(--text-secondary)">{label}</span>
              <span className="text-[13px] font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-4.5 border-b border-border">
        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
          Notes
        </div>
        <textarea
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground leading-[1.65] resize-none outline-none focus:border-primary transition-colors min-h-18"
          defaultValue={contact.notes ?? ""}
          placeholder="Add a note…"
          rows={3}
        />
      </div>

      <CompanyContext companyId={contact.companyId} contactId={contact.id} />

      <StatusChangeHistory
        entityType={Schemas.StatusChangeEntityTypeEnum.Contact}
        entityId={contact.id}
        getToken={getToken}
        statusLabel={statusLabel}
      />
    </div>
  );
}
