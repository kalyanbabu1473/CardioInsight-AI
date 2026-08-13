import clickSoftTick from "@/assets/sound/public_assets_sounds_click-soft (1).mp3";

/**
 * Global Scroll Sound Service (premium short-tick).
 *
 * Emulates the React Bits "OptionWheel" tick exactly:
 *   - One short, soft tick sample loaded once and reused forever.
 *   - A single HTMLAudioElement instance (created during preload).
 *   - `currentTime` is reset to 0 before every play.
 *   - Playback is throttled to a minimum of 30 ms, with a slight audible delay.
 *   - Autoplay/play errors are silently ignored.
 *   - Volume is kept subtle (0.5).
 *
 * Ticks fire at small scroll intervals (roughly one per "notch"), never every
 * frame, so continuous scrolling feels smooth, premium, and never spammy. The
 * tick only plays for user-initiated scrolls (mouse wheel, touchpad, touch,
 * keyboard, dragged scrollbars); programmatic/automatic scrolls, layout shifts,
 * and carousels stay silent. Ticks stop immediately when scrolling stops.
 *
 * Preference is persisted in localStorage and exposed via useSyncExternalStore.
 */

type Listener = () => void;

const STORAGE_KEY = "cardioinsight-scroll-sounds";

/** The preloaded audio asset, bundled from src/assets/sound. */
const SOUND_URL = clickSoftTick;

/** Master volume — kept subtle so ticks never overpower the UI. */
const SOUND_VOLUME = 0.5;

/** Minimum gap between ticks — prevents spam. */
const THROTTLE_MS = 30;

/** Extra audible delay applied to every tick so the sound trails the scroll. */
const TICK_DELAY_MS = 60;

/** Scroll distance (px) that triggers the next tick, like an OptionWheel notch. */
const SCROLL_STEP = 100;

/** A scroll is "user-driven" if a gesture happened within this window. */
const GESTURE_WINDOW_MS = 900;

interface ScrollPosition {
  top: number;
  left: number;
}

class ScrollSoundService {
  private audio: HTMLAudioElement | null = null;
  private enabled = true;
  private unlocked = false;
  private lastPlayedAt = -Infinity;
  private distanceSinceTick = 0;
  private sessionActive = false;
  private lastGestureAt = -Infinity;
  private idleTimer: number | null = null;
  private pendingTickTimer: number | null = null;
  private positions = new Map<Element, ScrollPosition>();
  private windowScrollY = 0;
  private listeners = new Set<Listener>();

  constructor() {
    this.enabled = this.readPreference();
    this.preload();
  }

  /**
   * Load the sample once and reuse the single instance. `autoplay` behaviour
   * is decided by the browser, so any playback failure is safely ignored.
   */
  private preload() {
    try {
      if (typeof window === "undefined") return;
      const audio = new Audio(SOUND_URL);
      audio.preload = "auto";
      audio.volume = SOUND_VOLUME;
      this.audio = audio;
    } catch {
      this.audio = null;
    }
  }

  private readPreference(): boolean {
    try {
      if (typeof window === "undefined") return true;
      return window.localStorage.getItem(STORAGE_KEY) !== "off";
    } catch {
      return true;
    }
  }

  /**
   * Mark a raw user gesture (wheel, touch, scroll key, scrollbar drag) and, on
   * the first gesture, silently "unlock" the audio element so browser
   * autoplay policies never block the first tick.
   */
  notifyUserScroll() {
    this.lastGestureAt = performance.now();
    this.unlock();
  }

  /**
   * Browsers block `Audio.play()` until the user has interacted with the page.
   * On the first genuine gesture we run a silent probe play (volume 0) that is
   * either allowed (unlocking the element) or rejected — both are fine and
   * never audible.
   */
  private unlock() {
    if (!this.audio || this.unlocked) return;
    const probe = this.audio;
    try {
      probe.currentTime = 0;
      probe.volume = 0;
      void probe
        .play()
        .then(() => {
          this.unlocked = true;
          probe.pause();
          probe.currentTime = 0;
          probe.volume = SOUND_VOLUME;
        })
        .catch(() => {
          probe.volume = SOUND_VOLUME;
        });
    } catch {
      probe.volume = SOUND_VOLUME;
    }
  }

  /**
   * Drives the tick while the user actually scrolls. Accumulates the real
   * distance scrolled and plays one short tick every SCROLL_STEP px, throttled
   * to a minimum of THROTTLE_MS. Programmatic scrolls (no recent gesture) are
   * ignored, so layouts, animations, and carousels never tick.
   */
  handleScroll(target: EventTarget | null) {
    if (this.isExcluded(target)) return;

    const now = performance.now();
    const userDriven =
      this.sessionActive || now - this.lastGestureAt <= GESTURE_WINDOW_MS;
    if (!userDriven) return;

    this.sessionActive = true;

    this.distanceSinceTick += this.travelled(target);

    if (this.distanceSinceTick >= SCROLL_STEP) {
      this.distanceSinceTick = 0;
      this.playTick();
    }

    if (this.idleTimer !== null) {
      window.clearTimeout(this.idleTimer);
    }
    this.idleTimer = window.setTimeout(() => this.endSession(), THROTTLE_MS + 40);
  }

  /**
   * Reads how far this scroll actually moved (px) since the previous event so
   * the tick cadence reflects real movement across all scroll containers.
   */
  private travelled(target: EventTarget | null): number {
    if (target instanceof Element) {
      const previous = this.positions.get(target) ?? {
        top: target.scrollTop,
        left: target.scrollLeft,
      };
      const vertical = Math.abs(target.scrollTop - previous.top);
      const horizontal = Math.abs(target.scrollLeft - previous.left);
      this.positions.set(target, {
        top: target.scrollTop,
        left: target.scrollLeft,
      });
      return Math.max(vertical, horizontal);
    }

    // Window/document scroll.
    const delta = Math.abs(window.scrollY - this.windowScrollY);
    this.windowScrollY = window.scrollY;
    return delta;
  }

  private isExcluded(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest("[data-no-scroll-sound]"));
  }

  /**
   * OptionWheel-style playback on the single reused Audio instance. The actual
   * sound is deferred by TICK_DELAY_MS so each tick trails the scroll gesture a
   * little, feeling deliberate. Only one tick may be pending at a time (newer
   * scrolls while a tick is queued are coalesced), so fast scrolling never
   * queues a backlog of sounds.
   */
  private playTick() {
    if (!this.enabled || !this.audio) return;
    if (this.pendingTickTimer !== null) return;

    const now = performance.now();
    if (now - this.lastPlayedAt < THROTTLE_MS) return;
    this.lastPlayedAt = now;

    this.pendingTickTimer = window.setTimeout(() => {
      this.pendingTickTimer = null;
      if (this.audio) {
        this.audio.currentTime = 0;
        void this.audio.play().catch(() => {
          /* silently ignore autoplay errors */
        });
      }
    }, TICK_DELAY_MS);
  }

  private endSession() {
    if (this.idleTimer !== null) {
      window.clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.pendingTickTimer !== null) {
      window.clearTimeout(this.pendingTickTimer);
      this.pendingTickTimer = null;
    }
    this.sessionActive = false;
    this.distanceSinceTick = 0;
  }

  /** Stop immediately (no further ticks). Called when the tab is hidden. */
  pause() {
    this.endSession();
    this.lastGestureAt = -Infinity;
  }

  /* ---- Preference management (persisted to localStorage) ---- */

  setEnabled(enabled: boolean) {
    const next = Boolean(enabled);
    if (next === this.enabled) return;
    this.enabled = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      /* ignore storage failures */
    }
    if (!next) {
      this.pause();
    }
    this.emit();
  }

  toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /* ---- React integration (useSyncExternalStore) ---- */

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): boolean => this.enabled;

  getServerSnapshot = (): boolean => true;

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}

export const scrollSoundService = new ScrollSoundService();
