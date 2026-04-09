"use client";

import { cn } from "@/lib/utils";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ElementType, ReactNode, RefObject } from "react";

type TimelineTag = "div" | "p" | "section" | "article" | "span";

type TimelineContentProps = {
  as?: TimelineTag;
  animationNum?: number;
  timelineRef?: RefObject<Element | null>;
  customVariants?: Variants;
  className?: string;
  children: ReactNode;
};

const defaultVariants: Variants = {
  hidden: {
    y: 18,
    opacity: 0,
    filter: "blur(8px)",
  },
  visible: (index: number) => ({
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      delay: index * 0.12,
      duration: 0.45,
      ease: "easeOut",
    },
  }),
};

const motionTagMap = {
  div: motion.div,
  p: motion.p,
  section: motion.section,
  article: motion.article,
  span: motion.span,
};

export function TimelineContent({
  as = "div",
  animationNum = 0,
  timelineRef,
  customVariants,
  className,
  children,
}: TimelineContentProps) {
  const shouldReduceMotion = useReducedMotion();
  const Component = as as ElementType;

  if (shouldReduceMotion) {
    return <Component className={className}>{children}</Component>;
  }

  const MotionComponent = motionTagMap[as];

  return (
    <MotionComponent
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2, root: timelineRef ?? undefined }}
      variants={customVariants ?? defaultVariants}
      custom={animationNum}
    >
      {children}
    </MotionComponent>
  );
}
