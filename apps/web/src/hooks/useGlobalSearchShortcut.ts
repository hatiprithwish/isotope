import { useEffect, useRef } from "react";

// DEV_NOTE: Checks e.code (not e.key) — key remapping on Mac (e.g. Karabiner)
// can change what e.key reports for the same physical key. See useAddShortcut.
export function useGlobalSearchShortcut(onTrigger: () => void): void {
  const onTriggerRef = useRef(onTrigger);

  useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      if (e.code !== "KeyK") return;

      e.preventDefault();
      onTriggerRef.current();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
