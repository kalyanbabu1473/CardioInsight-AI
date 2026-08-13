import type { CSSProperties, PropsWithChildren } from "react";
import { motion } from "framer-motion";

interface RevealProps {
  delay?: number;
  y?: number;
  once?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function Reveal({
  children,
  delay = 0,
  y = 20,
  once = true,
  className,
  style,
}: PropsWithChildren<RevealProps>) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-60px" }}
      transition={{
        duration: 0.55,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}