import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-react-start";
import { useUpdateCompany } from "./-data";
import * as Schemas from "@app/schemas";
import Avatar from "./-Avatar";
import { ArrowsOutSimpleIcon, PencilSimpleIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/shadcn/ui/button";
import AddOrEditCompanyModal, { STATUS_OPTIONS } from "./-AddOrEditCompanyModal";
import { StatusBadge } from "./-StatusBadge";
import { LinkedContacts } from "./-LinkedContacts";
import { Drawer, DrawerContent, DrawerOverlay, DrawerPortal } from "@/shadcn/ui/drawer";
import { StatusChangePopover } from "../-StatusChangePopover";
import { StatusChangeHistory } from "../-StatusChangeHistory";
import { StatusNoteInfoIcon } from "../-StatusNoteInfoIcon";

interface CompanyPanelProps {
  company: Schemas.Company;
  onClose: () => void;
}

function CompanyPanelContent({ company, onClose }: CompanyPanelProps) {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const updateCompany = useUpdateCompany();
  const [showEditModal, setShowEditModal] = useState(false);

  function handleStatusChange(newStatus: number) {
    return updateCompany.mutateAsync({ id: company.id, body: { company: { status: newStatus } } });
  }

  function statusLabel(status: number) {
    return (
      Schemas.companyStatusIntToLabel[status as Schemas.CompanyStatusIntEnum] ?? String(status)
    );
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
            {company.status && (
              <StatusChangePopover
                entityType={Schemas.StatusChangeEntityTypeEnum.Company}
                entityId={company.id}
                currentStatus={company.status}
                statusOptions={STATUS_OPTIONS}
                onStatusChange={handleStatusChange}
                isPending={updateCompany.isPending}
                trigger={
                  <button type="button" className="cursor-pointer">
                    <StatusBadge status={company.status} />
                  </button>
                }
              />
            )}
            {company.status && (
              <StatusNoteInfoIcon
                entityType={Schemas.StatusChangeEntityTypeEnum.Company}
                entityId={company.id}
                currentStatus={company.status}
                getToken={getToken}
              />
            )}
            {(company.updatedAt ?? company.createdAt) && (
              <span className="ml-auto text-[11px] text-(--text-secondary)">
                Updated {company.updatedAt ?? company.createdAt}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <LinkedContacts companyId={company.id} />

          <StatusChangeHistory
            entityType={Schemas.StatusChangeEntityTypeEnum.Company}
            entityId={company.id}
            getToken={getToken}
            statusLabel={statusLabel}
          />
        </div>

        <div className="px-5 py-3.5 border-t border-border bg-card flex gap-2 shrink-0">
          <StatusChangePopover
            entityType={Schemas.StatusChangeEntityTypeEnum.Company}
            entityId={company.id}
            currentStatus={company.status}
            statusOptions={STATUS_OPTIONS}
            onStatusChange={handleStatusChange}
            isPending={updateCompany.isPending}
            initialStatus={Schemas.CompanyStatusIntEnum.RejectedHuman}
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="lg"
                disabled={updateCompany.isPending}
                className="text-(--danger) hover:bg-(--danger-bg) hover:text-(--danger)"
              >
                Reject
              </Button>
            }
          />
          <div className="flex-1" />
          <StatusChangePopover
            entityType={Schemas.StatusChangeEntityTypeEnum.Company}
            entityId={company.id}
            currentStatus={company.status}
            statusOptions={STATUS_OPTIONS}
            onStatusChange={handleStatusChange}
            isPending={updateCompany.isPending}
            initialStatus={Schemas.CompanyStatusIntEnum.Accepted}
            trigger={
              <Button type="button" size="lg" disabled={updateCompany.isPending}>
                Accept · find contacts
              </Button>
            }
          />
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
