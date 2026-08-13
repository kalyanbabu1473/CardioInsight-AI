import clsx from "clsx";
import { soundService } from "@/services/ui/soundService";
import type { ButtonProps } from "./Button.types";
import styles from "./Button.module.css";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  onClick,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(styles.btn, styles[variant], styles[size], className)}
      data-sound-handled
      disabled={disabled}
      onClick={(event) => {
        if (!disabled && !props["aria-disabled"]) {
          soundService.play("tick");
        }
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </button>
  );
}