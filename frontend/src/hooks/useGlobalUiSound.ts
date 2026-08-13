import { useEffect } from "react";

import { soundService } from "@/services/ui/soundService";

/**
 * Interactive targets that should produce a tick when activated. Matches
 * native controls, links, and common ARIA roles. Plain text/number inputs are
 * intentionally excluded so typing stays silent.
 */
const CLICKABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]:not([disabled])",
  "select:not([disabled])",
  'input[type="radio"]:not([disabled])',
  'input[type="checkbox"]:not([disabled])',
  'input[type="date"]:not([disabled])',
  '[role="switch"]:not([aria-disabled="true"])',
  '[role="option"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="radio"]',
  '[role="checkbox"]',
  "[data-clickable]",
].join(", ");

function isDisabled(element: Element): boolean {
  return (
    element.hasAttribute("disabled") ||
    element.getAttribute("aria-disabled") === "true"
  );
}

/**
 * Single app-wide listener that plays the shared UI tick for every meaningful
 * click/selection. Components that already play their own (semantic) sound mark
 * themselves with `data-sound-handled` so they are never double-played.
 */
export function useGlobalUiSound() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-sound-handled]")) return;

      const interactive = target.closest<Element>(CLICKABLE_SELECTOR);
      if (!interactive || isDisabled(interactive)) return;

      soundService.play("tick");
    };

    const handleChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-sound-handled]")) return;
      if (!target.matches("select:not([disabled])")) return;

      soundService.play("tick");
    };

    document.addEventListener("click", handleClick, true);
    document.addEventListener("change", handleChange, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("change", handleChange, true);
    };
  }, []);
}
