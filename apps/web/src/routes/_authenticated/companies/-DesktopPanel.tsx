import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useUpdateCompany } from "./-data";
import type * as Schemas from "@app/schemas";
import Avatar from "./-Avatar";
import {
  ArrowsOutSimpleIcon,
  CheckCircleIcon,
  PencilSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import AddOrEditCompanyModal from "./-AddOrEditCompanyModal";
import { StatusBadge } from "./-StatusBadge";
import ScoreBar from "./-ScoreBar";
import { MAX_SCORE } from "./-criteria";
import { ScoredCriteria } from "./-ScoredCriteria";
import { LinkedContacts } from "./-LinkedContacts";
import { Drawer, DrawerContent, DrawerOverlay, DrawerPortal } from "@/shadcn/ui/drawer";

interface CompanyPanelProps {
  company: Schemas.Company;
  onClose: () => void;
}

function CompanyPanelContent({ company, onClose }: CompanyPanelProps) {
  const navigate = useNavigate();
  const updateCompany = useUpdateCompany();
  const [showEditModal, setShowEditModal] = useState(false);
  const score = company.weightedScore ?? 0;
  const hasEthicsFlag = company.isEthicsCompliant === false;
  const isWaitingHuman = company.status === 1;

  function handleAccept() {
    updateCompany.mutate({ id: company.id, body: { company: { status: 2 } } });
  }

  function handleReject() {
    updateCompany.mutate({ id: company.id, body: { company: { status: 4 } } });
  }

  return (
    <>
      {showEditModal && (
        <AddOrEditCompanyModal
          mode="edit"
          company={company}
          onClose={() => setShowEditModal(false)}
        />
      )}
      <div className="flex flex-col h-full overflow-hidden bg-card">
        <div className="px-5 pt-4 pb-3.5 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar name={company.name} size="md" />
              <div className="min-w-0">
                <div className="text-base font-semibold text-foreground leading-snug truncate">
                  {company.name}
                </div>
                <div className="text-[13px] text-(--text-secondary) mt-0.5">
                  {company.website && <span className="text-primary">{company.website}</span>}
                  {company.website && company.industry && " · "}
                  {company.industry}
                </div>
              </div>
            </div>
            <div className="flex gap-0.5 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowEditModal(true)}
                title="Edit company"
              >
                <PencilSimpleIcon size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  navigate({
                    to: "/companies/$companyId",
                    params: { companyId: String(company.id) },
                  })
                }
                title="Open full page"
              >
                <ArrowsOutSimpleIcon size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                title="Close panel"
              >
                <XIcon size={14} />
              </Button>
            </div>
          </div>
          <div className="flex gap-2 items-center mt-3 flex-wrap">
            {company.status && <StatusBadge status={company.status} />}
            {company.fitBand && <StatusBadge fit={company.fitBand} />}
            {(company.updatedAt ?? company.createdAt) && (
              <span className="ml-auto text-[11px] text-(--text-secondary)">
                Updated {company.updatedAt ?? company.createdAt}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4.5 border-b border-border">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
              Your context for AI
            </div>
            <textarea
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-[13px] text-foreground leading-[1.65] resize-none outline-none focus:border-primary transition-colors min-h-18"
              defaultValue={company.userContext ?? ""}
              placeholder="Anything you know about this company (injected into AI scoring)."
              rows={3}
            />
          </div>

          <div className="px-5 py-4.5 border-b border-border">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
              Score
            </div>
            <ScoreBar score={score} max={MAX_SCORE} />
          </div>

          <div className="px-5 py-4.5 border-b border-border">
            <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5">
              Stage 1 · Pre-filters
            </div>
            <div className="flex gap-3">
              {(
                [
                  { label: "Salary band", pass: company.isSalaryMatch },
                  { label: "Location", pass: company.isLocationMatch },
                ] as const
              ).map(({ label, pass }) => (
                <div key={label} className="flex-1 flex items-center gap-2">
                  <CheckCircleIcon
                    size={14}
                    className={pass === true ? "text-(--success)" : "text-(--text-secondary)"}
                  />
                  <span className="text-xs font-medium text-foreground flex-1">{label}</span>
                  {pass !== null && pass !== undefined && <StatusBadge status={pass ? 2 : 4} sm />}
                </div>
              ))}
            </div>
          </div>

          {hasEthicsFlag && (
            <div className="px-5 py-4.5 border-b border-border">
              <div className="bg-(--danger-bg) border-l-[3px] border-(--danger) rounded-r-lg px-3.5 py-3 text-[13px] leading-[1.55] text-(--text-secondary)">
                <strong className="text-(--danger-text)">Ethics flag.</strong>{" "}
                {company.ethicsNotes ?? "Ethics concerns noted. Review before accepting."}
              </div>
            </div>
          )}

          {company.aiSummary && (
            <div className="px-5 py-4.5 border-b border-border">
              <div className="text-[10px] font-semibold uppercase tracking-[0.06em] text-(--text-secondary) mb-2.5 flex items-center gap-1.5">
                <span className="text-(--warning) text-[13px]">✦</span>
                AI research summary
              </div>
              <div className="bg-(--ai-bg) border border-border border-l-[3px] border-l-(--ai-border) rounded-r-lg px-3.5 py-3 text-[13px] leading-[1.7] text-(--text-secondary)">
                {company.aiSummary}
              </div>
            </div>
          )}

          <ScoredCriteria companyId={company.id} isWaitingHuman={isWaitingHuman} />

          <LinkedContacts companyId={company.id} />
        </div>

        <div className="px-5 py-3.5 border-t border-border bg-card flex gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={handleReject}
            disabled={updateCompany.isPending}
            className="text-(--danger) hover:bg-(--danger-bg) hover:text-(--danger)"
          >
            Reject
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleAccept}
            disabled={updateCompany.isPending}
          >
            Accept
          </Button>
          <Button type="button" size="lg" onClick={handleAccept} disabled={updateCompany.isPending}>
            Accept · find contacts
          </Button>
        </div>
      </div>
    </>
  );
}

interface CompanyDetailPanelProps {
  companyId: number | null;
  company: Schemas.Company | null;
  onClose: () => void;
}

export function CompanyDetailPanel({ companyId, company, onClose }: CompanyDetailPanelProps) {
  const isOpen = companyId != null && company != null;

  return (
    <aside
      className={[
        "hidden md:flex flex-col absolute inset-y-0 right-0 border-l border-border shadow-xl z-20 overflow-hidden",
        "transition-all duration-200 ease-out",
        isOpen ? "w-1/3" : "w-0 border-l-0",
      ].join(" ")}
      aria-hidden={!isOpen}
    >
      {isOpen && <CompanyPanelContent company={company} onClose={onClose} />}
    </aside>
  );
}

export function CompanyDetailMobileDrawer({
  companyId,
  company,
  onClose,
}: CompanyDetailPanelProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isOpen = companyId != null && company != null && isMobile;

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      direction="bottom"
    >
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent className="h-[90vh] w-full p-0 bg-card border-t border-border rounded-t-xl">
          {isOpen && <CompanyPanelContent company={company} onClose={onClose} />}
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
