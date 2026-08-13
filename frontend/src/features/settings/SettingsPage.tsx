import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { Volume2, Settings } from "lucide-react";

import { soundService } from "@/services/ui/soundService";
import { scrollSoundService } from "@/services/ui/scrollSoundService";

import styles from "./SettingsPage.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

export default function SettingsPage() {
  const soundsEnabled = useSyncExternalStore(
    soundService.subscribe,
    soundService.getSnapshot,
    soundService.getServerSnapshot,
  );

  const scrollSoundsEnabled = useSyncExternalStore(
    scrollSoundService.subscribe,
    scrollSoundService.getSnapshot,
    scrollSoundService.getServerSnapshot,
  );

  const handleToggleSounds = () => {
    const next = soundService.toggle();
    if (next) {
      soundService.play("tick");
    }
  };

  const handleToggleScrollSounds = () => {
    const next = scrollSoundService.toggle();
    if (next) {
      soundService.play("tick");
    }
  };

  return (
    <div className={styles.page}>
      <motion.header
        className={styles.hero}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
      >
        <div className={styles.heroBody}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowIcon}>
              <Settings size={14} />
            </span>
            Preferences
          </div>
          <h1>Settings</h1>
          <p>
            Configure application preferences. Changes are applied instantly
            and remembered on this device.
          </p>
        </div>
      </motion.header>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelIcon}>
            <Volume2 size={20} />
          </span>
          <div>
            <h2>Interface</h2>
            <p>Audio feedback for mouse, keyboard, and scrolling interactions across the UI.</p>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.rowText}>
            <strong>Enable UI Sounds</strong>
            <p>
              Plays a soft tick on buttons, navigation, form controls, and other
              meaningful interactions.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={soundsEnabled}
            aria-label="Enable UI Sounds"
            className={styles.switch}
            data-sound-handled
            data-on={soundsEnabled || undefined}
            onClick={handleToggleSounds}
          >
            <span className={styles.knob} />
          </button>
        </div>

        <div className={styles.row}>
          <div className={styles.rowText}>
            <strong>Enable Scroll Sounds</strong>
            <p>
              Plays a soft ambient glide while you scroll. Fades out smoothly
              when scrolling stops.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={scrollSoundsEnabled}
            aria-label="Enable Scroll Sounds"
            className={styles.switch}
            data-sound-handled
            data-on={scrollSoundsEnabled || undefined}
            onClick={handleToggleScrollSounds}
          >
            <span className={styles.knob} />
          </button>
        </div>
      </section>
    </div>
  );
}