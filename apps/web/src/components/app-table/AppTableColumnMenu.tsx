import { EyeSlash } from "@phosphor-icons/react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/shadcn/ui/context-menu";

interface AppTableColumnMenuProps {
  children: React.ReactNode;
  onHide: () => void;
}

export function AppTableColumnMenu({ children, onHide }: AppTableColumnMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onSelect={onHide}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <EyeSlash className="h-4 w-4" />
          Hide
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
