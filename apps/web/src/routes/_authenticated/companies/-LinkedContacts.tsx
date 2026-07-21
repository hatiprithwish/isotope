import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useNavigate } from "@tanstack/react-router";
import { UserIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import { CompaniesQueries } from "./-data";
import Utilities from "@/utils";

interface Props {
  companyId: number;
}

export function LinkedContacts({ companyId }: Props) {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { data } = useQuery(CompaniesQueries.companyContacts(companyId, getToken));
  const linkedContacts = data?.contacts ?? [];

  return (
    <div className="px-5 py-4.5 border-b border-border">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary)">
          Contacts{linkedContacts.length > 0 && ` · ${linkedContacts.length}`}
        </div>
        <Button
          type="button"
          variant="link"
          size="xs"
          className="text-primary p-0 h-auto"
          onClick={() => navigate({ to: "/contacts" })}
        >
          Add contact
        </Button>
      </div>
      {linkedContacts.length === 0 ? (
        <div className="flex items-center gap-2 py-2 text-[13px] text-(--text-secondary)">
          <UserIcon size={14} className="opacity-40" />
          No contacts yet
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {linkedContacts.map((contact, i) => (
            <button
              key={contact.id}
              type="button"
              onClick={() =>
                navigate({
                  to: "/contacts/$contactId",
                  params: { contactId: String(contact.id) },
                })
              }
              className={[
                "flex items-center gap-2.5 py-2 w-full text-left hover:bg-(--surface-raised) -mx-1 px-1 rounded-md transition-colors",
                i < linkedContacts.length - 1 ? "border-b border-border" : "",
              ].join(" ")}
            >
              <span className="w-6 h-6 rounded-full inline-flex items-center justify-center text-[10px] font-semibold bg-(--accent-bg) text-(--accent-text) shrink-0">
                {Utilities.getInitials(contact.name)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium text-foreground truncate">
                  {contact.name}
                </div>
                {contact.designation && (
                  <div className="text-[11px] text-(--text-secondary) truncate">
                    {contact.designation}
                  </div>
                )}
              </div>
              <span
                className={[
                  "inline-flex items-center h-4.5 px-1.5 rounded-[5px] text-[10px] font-semibold shrink-0",
                  contact.status === 2
                    ? "bg-(--accent-bg) text-(--accent-text)"
                    : contact.status === 3 || contact.status === 4
                      ? "bg-(--pipeline-bg) text-(--pipeline-text)"
                      : contact.status === 5
                        ? "bg-(--success-bg) text-(--success-text)"
                        : "bg-(--surface-raised) text-(--text-secondary)",
                ].join(" ")}
              >
                {contact.statusLabel}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
