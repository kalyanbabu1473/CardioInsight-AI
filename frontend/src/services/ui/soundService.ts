/**
 * Global UI Sound Service (SoundManager).
 *
 * A single, reusable, framework-agnostic audio engine that powers *every*
 * meaningful UI interaction across the platform.
 *
 * Design goals:
 *  - One soft "tick" sample, synthesized once and preloaded into an
 *    AudioBuffer, then reused everywhere (semantic names only vary pitch).
 *  - Master volume kept low (10–15%).
 *  - Rapid-click throttling so overlapping sounds never stack.
 *  - AudioContext is created lazily on the first user gesture to satisfy
 *    browser autoplay policies.
 *  - The user's enable/disable preference is persisted in localStorage and
 *    exposed for React via useSyncExternalStore.
 */

export type SoundName =
  | "tick"
  | "click"
  | "next"
  | "previous"
  | "success"
  | "expand"
  | "navigation"
  | "run";

/** Semantics map onto the same tick by adjusting playback pitch only. */
const PLAYBACK_RATES: Record<SoundName, number> = {
  tick: 1,
  click: 1,
  navigation: 1.05,
  next: 1.12,
  previous: 0.9,
  expand: 0.96,
  success: 1.28,
  run: 0.82,
};

/** Master output volume — kept in the 10–15% range. */
const MASTER_GAIN = 0.12;

/** Minimum gap between plays: prevents overlapping sounds on rapid clicks. */
const THROTTLE_MS = 55;

/** A soft tick is ≤ 120 ms. */
const TICK_DURATION = 0.09;

const STORAGE_KEY = "cardioinsight-ui-sounds";

/* ------------------------------------------------------------------ */
/*  Tick sample synthesis                                              */
/* ------------------------------------------------------------------ */

function synthTick(sampleRate: number): AudioBuffer {
  const length = Math.floor(TICK_DURATION * sampleRate);
  const buffer = new AudioBuffer({
    numberOfChannels: 1,
    length,
    sampleRate,
  });
  const data = buffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    // Fast attack, tight decay: short and clean, never ringing.
    const attack = 1 - Math.exp(-t * 500);
    const decay = Math.exp(-t * 46);
    const env = attack * decay;

    // Soft body + a faint transient for the "tick" character.
    const body = Math.sin(2 * Math.PI * 860 * t);
    const transient =
      Math.sin(2 * Math.PI * 1900 * t) * Math.exp(-t * 240);

    data[i] = (body * 0.55 + transient * 0.4) * env * 0.8;
  }

  return buffer;
}

/* ------------------------------------------------------------------ */
/*  Service                                                            */
/* ------------------------------------------------------------------ */

type Listener = () => void;

class SoundService {
  private context: AudioContext | null = null;
  private tickBuffer: AudioBuffer | null = null;
  private enabled = true;
  private lastPlayAt = -Infinity;
  private listeners = new Set<Listener>();

  constructor() {
    this.enabled = this.readPreference();
    this.unlockAutoplay();
  }

  private readPreference(): boolean {
    try {
      if (typeof window === "undefined") return true;
      return window.localStorage.getItem(STORAGE_KEY) !== "off";
    } catch {
      return true;
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!Ctor) return null;

    if (!this.context) {
      this.context = new Ctor();
      this.tickBuffer = synthTick(this.context.sampleRate);
    }

    if (this.context.state === "suspended") {
      void this.context.resume();
    }

    return this.context;
  }

  /* Resume/hydrate the context on the first user gesture (autoplay policy). */
  private unlockAutoplay() {
    const unlock = () => {
      this.ensureContext();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
  }

  /**
   * Play the shared tick. Semantic names only shift pitch. Plays are dropped
   * if they land too soon after the previous one to avoid stacking.
   */
  play(name: SoundName = "tick") {
    if (!this.enabled) return;

    const now = performance.now();
    if (now - this.lastPlayAt < THROTTLE_MS) return;
    this.lastPlayAt = now;

    const ctx = this.ensureContext();
    if (!ctx || !this.tickBuffer) return;

    const source = ctx.createBufferSource();
    source.buffer = this.tickBuffer;
    source.playbackRate.value = PLAYBACK_RATES[name] ?? 1;

    const gain = ctx.createGain();
    gain.gain.value = MASTER_GAIN;

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
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

export const soundService = new SoundService();