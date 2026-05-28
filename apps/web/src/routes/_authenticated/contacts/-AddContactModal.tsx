import { useState } from "react";
import { XIcon } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/tanstack-react-start";
import { useCreateContact } from "./-data";
import { CompaniesQueries } from "../companies/-data";
import { ContactStatusIntEnum, ContactSourceIntEnum } from "@app/schemas";

interface Props {
  onClose: () => void;
}

export default function AddContactModal({ onClose }: Props) {
  const { getToken } = useAuth();
  const createContact = useCreateContact();

  const { data: companiesData } = useQuery(CompaniesQueries.list(getToken));
  const companies = companiesData?.companies ?? [];

  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState<string>("");
  const [designation, setDesignation] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !companyId) return;
    createContact.mutate(
      {
        contact: {
          name: name.trim(),
          status: ContactStatusIntEnum.NotStarted,
          companyId: Number(companyId),
          designation: designation.trim() || null,
          email: email.trim() || null,
          linkedinUrl: linkedinUrl.trim() || null,
          source: ContactSourceIntEnum.Manual,
        },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-[15px] font-semibold text-foreground">Add contact</span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-(--text-secondary) hover:bg-(--surface-raised) hover:text-foreground transition-colors"
          >
            <XIcon size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-(--text-secondary)">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              required
              className="h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-(--text-secondary)">
              Company <span className="text-destructive">*</span>
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              required
              className="h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground outline-none focus:border-primary transition-colors"
            >
              <option value="">Select company…</option>
              {companies.map((co) => (
                <option key={co.id} value={co.id}>
                  {co.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-semibold text-(--text-secondary)">Title</label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Engineering Manager"
              className="h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[12px] font-semibold text-(--text-secondary)">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@example.com"
                className="h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-[12px] font-semibold text-(--text-secondary)">LinkedIn</label>
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="linkedin.com/in/…"
                className="h-9 px-3 rounded-lg bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-7.75 px-3.5 rounded-lg text-[13px] font-medium border border-border text-foreground hover:bg-(--surface-raised) transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !companyId || createContact.isPending}
              className="flex-1 h-7.75 px-3.5 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {createContact.isPending ? "Adding…" : "Add contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
