import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerOverlay, DrawerPortal } from "@/shadcn/ui/drawer";
import type * as Schemas from "@app/schemas";
import { JobPanelContent } from "./-JobPanelContent";

interface JobDetailDrawerProps {
  jobId: number | null;
  onClose: () => void;
  onEdit?: (job: Schemas.Job) => void;
  onDelete?: (id: number) => void;
}

export function JobDetailPanel({ jobId, onClose, onEdit, onDelete }: JobDetailDrawerProps) {
  const isOpen = jobId != null;

  return (
    <aside
      className={[
        "hidden md:flex flex-col absolute inset-y-0 right-0 border-l border-border shadow-xl z-20 overflow-hidden",
        "transition-all duration-200 ease-out",
        isOpen ? "w-1/3" : "w-0 border-l-0",
      ].join(" ")}
      aria-hidden={!isOpen}
    >
      {isOpen && (
        <JobPanelContent jobId={jobId} onClose={onClose} onEdit={onEdit} onDelete={onDelete} />
      )}
    </aside>
  );
}

export function JobDetailMobileDrawer({ jobId, onClose, onEdit, onDelete }: JobDetailDrawerProps) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isOpen = jobId != null && isMobile;

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
          {isOpen && (
            <JobPanelContent jobId={jobId} onClose={onClose} onEdit={onEdit} onDelete={onDelete} />
          )}
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
