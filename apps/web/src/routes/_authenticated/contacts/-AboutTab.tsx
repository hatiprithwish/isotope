import * as Schemas from "@app/schemas";
import { CompanyContext } from "./-CompanyContext";
import { StatusChangeHistory } from "../-StatusChangeHistory";

interface AboutTabProps {
  contact: Schemas.Contact;
  getToken: () => Promise<string | null>;
  statusLabel: (status: number) => string;
}

export function AboutTab({ contact, getToken, statusLabel }: AboutTabProps) {
  return (
    <div className="flex flex-col">
      <CompanyContext companyId={contact.companyId} contactId={contact.id} />

      <StatusChangeHistory
        entityType={Schemas.StatusChangeEntityTypeEnum.Contact}
        entityId={contact.id}
        getToken={getToken}
        statusLabel={statusLabel}
      />

      <div className="px-5 py-4.5 border-b border-border">
        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
          Details
        </div>
        <div className="bg-sidebar border border-border rounded-lg p-3.5 flex flex-col gap-2">
          {[
            {
              label: "Source",
              value: contact.source === Schemas.ContactSourceIntEnum.Manual ? "Manual" : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-[13px] text-(--text-secondary)">{label}</span>
              <span className="text-[13px] font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
