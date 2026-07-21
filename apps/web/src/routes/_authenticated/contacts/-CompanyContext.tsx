import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useNavigate } from "@tanstack/react-router";
import { BriefcaseIcon, BuildingsIcon, UserIcon } from "@phosphor-icons/react";
import { CompaniesQueries } from "../companies/-data";
import { StatusBadge as CompanyStatusBadge } from "../companies/-StatusBadge";
import { JobStatusBadge } from "../jobs/-JobStatusBadge";
import { JobsQueries } from "../jobs/-data";
import { StatusBadge as ContactStatusBadge } from "./-StatusBadge";
import Utilities from "@/utils";

interface Props {
  companyId: number;
  contactId: number;
}

export function CompanyContext({ companyId, contactId }: Props) {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { data: companyData } = useQuery(CompaniesQueries.detail(companyId, getToken));
  const { data: jobsData } = useQuery(JobsQueries.byCompany(companyId, getToken));
  const { data: contactsData } = useQuery(CompaniesQueries.companyContacts(companyId, getToken));

  const company = companyData?.company;
  const jobs = jobsData?.jobs ?? [];
  const otherContacts = (contactsData?.contacts ?? []).filter((c) => c.id !== contactId);

  return (
    <>
      {/* Company summary */}
      <div className="px-5 py-4.5 border-b border-border">
        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
          Company
        </div>
        {!company ? (
          <div className="flex items-center gap-2 py-2 text-[13px] text-(--text-secondary)">
            <BuildingsIcon size={14} className="opacity-40" />
            Loading company…
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              navigate({ to: "/companies/$companyId", params: { companyId: String(company.id) } })
            }
            className="w-full text-left bg-sidebar border border-border rounded-lg p-3.5 hover:bg-(--surface-raised) transition-colors"
          >
            <div className="text-[13px] font-semibold text-foreground truncate">{company.name}</div>
            {(company.industry || company.location) && (
              <div className="text-[11px] text-(--text-secondary) mt-0.5 truncate">
                {company.industry}
                {company.industry && company.location && " · "}
                {company.location}
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <CompanyStatusBadge status={company.status} sm />
              {company.fitBand != null && <CompanyStatusBadge fit={company.fitBand} sm />}
            </div>
          </button>
        )}
      </div>

      {/* Jobs at this company */}
      <div className="px-5 py-4.5 border-b border-border">
        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
          Jobs{jobs.length > 0 && ` · ${jobs.length}`}
        </div>
        {jobs.length === 0 ? (
          <div className="flex items-center gap-2 py-2 text-[13px] text-(--text-secondary)">
            <BriefcaseIcon size={14} className="opacity-40" />
            No jobs tracked at this company yet
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {jobs.map((job, i) => (
              <button
                key={job.id}
                type="button"
                onClick={() => navigate({ to: "/jobs/$jobId", params: { jobId: String(job.id) } })}
                className={[
                  "flex items-center gap-2.5 py-2 w-full text-left hover:bg-(--surface-raised) -mx-1 px-1 rounded-md transition-colors",
                  i < jobs.length - 1 ? "border-b border-border" : "",
                ].join(" ")}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-foreground truncate">
                    {job.title}
                  </div>
                </div>
                <JobStatusBadge status={job.status} sm />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Other contacts at this company */}
      <div className="px-5 py-4.5 border-b border-border">
        <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
          Other contacts{otherContacts.length > 0 && ` · ${otherContacts.length}`}
        </div>
        {otherContacts.length === 0 ? (
          <div className="flex items-center gap-2 py-2 text-[13px] text-(--text-secondary)">
            <UserIcon size={14} className="opacity-40" />
            No other contacts at this company yet
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {otherContacts.map((contact, i) => (
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
                  i < otherContacts.length - 1 ? "border-b border-border" : "",
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
                <ContactStatusBadge status={contact.status} sm />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
