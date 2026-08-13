import type { CSSProperties, PropsWithChildren } from "react";
import { motion, type TargetAndTransition, type Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export function Stagger({
  children,
  className,
  style,
}: PropsWithChildren<{ className?: string; style?: CSSProperties }>) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

interface StaggerItemProps {
  className?: string;
  style?: CSSProperties;
  whileHover?: TargetAndTransition;
}

export function StaggerItem({
  children,
  className,
  style,
  whileHover,
}: PropsWithChildren<StaggerItemProps>) {
  return (
    <motion.div
      className={className}
      style={style}
      variants={item}
      whileHover={whileHover}
    >
      {children}
    </motion.div>
  );
}