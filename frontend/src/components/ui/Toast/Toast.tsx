import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, XCircle } from "lucide-react";

import {
  ToastContext,
  type ToastKind,
  type ToastOptions,
} from "./useToast";

import styles from "./Toast.module.css";

interface ToastItem extends Required<Pick<ToastOptions, "title" | "kind">> {
  id: number;
  message?: string;
}

let toastId = 0;

function ToastIcon({ kind }: { kind: ToastKind }) {
  if (kind === "success") return <CheckCircle2 size={18} />;
  if (kind === "error") return <XCircle size={18} />;
  return <Info size={18} />;
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (options: ToastOptions) => {
      const id = ++toastId;
      const item: ToastItem = {
        id,
        title: options.title,
        message: options.message,
        kind: options.kind ?? "info",
      };
      setToasts((prev) => [...prev, item]);
      const timer = setTimeout(() => dismiss(id), options.duration ?? 4200);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              data-clickable
              className={`${styles.toast} ${styles[toast.kind] ?? styles.info}`}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => dismiss(toast.id)}
            >
              <span className={styles.icon}>
                <ToastIcon kind={toast.kind} />
              </span>
              <span className={styles.body}>
                <span className={styles.title}>{toast.title}</span>
                {toast.message && (
                  <span className={styles.message}>{toast.message}</span>
                )}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}