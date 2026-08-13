import { useEffect } from "react";

import { scrollSoundService } from "@/services/ui/scrollSoundService";

/** Keyboard keys that natively scroll the page/container. */
const SCROLL_KEYS = new Set([
  "PageUp",
  "PageDown",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  " ",
]);

function isScrollKey(key: string): boolean {
  return SCROLL_KEYS.has(key);
}

/**
 * Single app-wide listener that engages the scroll sound only for
 * user-initiated scrolling. Gestures (wheel, touchpad, touch, scroll keys,
 * and scrollbar/pointer drags) mark the intent; the actual `scroll` events then
 * drive the short tick. Programmatic scrolls, carousels, and marquees never
 * match a recent gesture, so they stay silent.
 */
export function useGlobalScrollSound() {
  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (event.deltaX !== 0 || event.deltaY !== 0) {
        scrollSoundService.notifyUserScroll();
      }
    };

    const onTouchMove = () => {
      scrollSoundService.notifyUserScroll();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isScrollKey(event.key)) {
        scrollSoundService.notifyUserScroll();
      }
    };

    const onPointerDown = () => {
      scrollSoundService.notifyUserScroll();
    };

    const onScroll = (event: Event) => {
      scrollSoundService.handleScroll(event.target);
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        scrollSoundService.pause();
      }
    };

    window.addEventListener("wheel", onWheel, {
      capture: true,
      passive: true,
    });
    document.addEventListener("touchmove", onTouchMove, {
      capture: true,
      passive: true,
    });
    document.addEventListener("keydown", onKeyDown, { capture: true });
    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("wheel", onWheel, true);
      document.removeEventListener("touchmove", onTouchMove, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      scrollSoundService.pause();
    };
  }, []);
}
