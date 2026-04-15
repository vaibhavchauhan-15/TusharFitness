import type { SpringOptions, Transition } from "framer-motion";

// Shared landing spring tuned for a smooth, Apple-like response.
export const LANDING_APPLE_SPRING: SpringOptions = {
  stiffness: 120,
  damping: 25,
  mass: 0.42,
  restDelta: 0.001,
  restSpeed: 0.01,
};

export const LANDING_APPLE_SPRING_TRANSITION: Transition = {
  type: "spring",
  ...LANDING_APPLE_SPRING,
};

// Increase this to intensify card-to-card staggering, decrease for subtler offsets.
export const LANDING_STAT_STAGGER_INTENSITY = 0.085;
