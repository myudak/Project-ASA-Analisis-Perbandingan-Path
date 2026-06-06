import type { Transition, Variants } from "motion/react";

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const VIEWPORT_ONCE = {
  once: true,
  amount: 0.18,
} as const;

export function motionTransition(
  reducedMotion: boolean,
  duration = 0.52,
  delay = 0,
): Transition {
  return reducedMotion
    ? { duration: 0 }
    : {
        duration,
        delay,
        ease: EASE_OUT,
      };
}

export function revealVariants(reducedMotion: boolean, distance = 24): Variants {
  return {
    hidden: {
      opacity: reducedMotion ? 1 : 0,
      y: reducedMotion ? 0 : distance,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: motionTransition(reducedMotion),
    },
  };
}

export function staggerContainerVariants(
  reducedMotion: boolean,
  delayChildren = 0,
): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        delayChildren: reducedMotion ? 0 : delayChildren,
        staggerChildren: reducedMotion ? 0 : 0.065,
      },
    },
  };
}

export function staggerItemVariants(reducedMotion: boolean, distance = 18): Variants {
  return {
    hidden: {
      opacity: reducedMotion ? 1 : 0,
      y: reducedMotion ? 0 : distance,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: motionTransition(reducedMotion, 0.48),
    },
  };
}

