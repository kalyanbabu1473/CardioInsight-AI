import type { ReactNode } from "react";

export interface LogoLoopProps {
  children: ReactNode;
  /** Seconds for one full seamless pass of the loop. */
  speed?: number;
  /** Gap in px between items (and between the two loop halves). */
  gap?: number;
  /** Pause the animation while the pointer is over the carousel. */
  pauseOnHover?: boolean;
  /** Fade the cards out at both edges of the viewport. */
  fadeEdges?: boolean;
  /** Horizontal fade width in px when fadeEdges is enabled. */
  edgeWidth?: number;
  /** Optional className forwarded to the viewport wrapper. */
  className?: string;
  /** Accessible label for the scrolling region. */
  ariaLabel?: string;
}