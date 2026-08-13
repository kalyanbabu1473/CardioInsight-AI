import { createContext, useContext } from "react";

export type ToastKind = "success" | "info" | "error";

export interface ToastOptions {
  title: string;
  message?: string;
  kind?: ToastKind;
  duration?: number;
}

export interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}