"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { motion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";

type SplitBy = "words" | "characters" | "lines" | string;

type TextProps = {
  children: ReactNode;
  reverse?: boolean;
  transition?: Transition;
  splitBy?: SplitBy;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | "random" | number;
  containerClassName?: string;
  wordLevelClassName?: string;
  elementLevelClassName?: string;
  onClick?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  autoStart?: boolean;
};

export interface VerticalCutRevealRef {
  startAnimation: () => void;
  reset: () => void;
}

type WordObject = {
  characters: string[];
  needsSpace: boolean;
};

const VerticalCutReveal = forwardRef<VerticalCutRevealRef, TextProps>(
  (
    {
      children,
      reverse = false,
      transition = {
        type: "spring",
        stiffness: 190,
        damping: 22,
      },
      splitBy = "words",
      staggerDuration = 0.2,
      staggerFrom = "first",
      containerClassName,
      wordLevelClassName,
      elementLevelClassName,
      onClick,
      onStart,
      onComplete,
      autoStart = true,
    },
    ref,
  ) => {
    const text = typeof children === "string" ? children : String(children ?? "");
    const [isAnimating, setIsAnimating] = useState(autoStart);

    const splitIntoCharacters = (value: string): string[] => {
      if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
        const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
        return Array.from(segmenter.segment(value), ({ segment }) => segment);
      }
      return Array.from(value);
    };

    const elements = useMemo(() => {
      if (splitBy === "characters") {
        const words = text.split(" ");
        return words.map((word, index) => ({
          characters: splitIntoCharacters(word),
          needsSpace: index !== words.length - 1,
        }));
      }
      if (splitBy === "words") {
        return text.split(" ");
      }
      if (splitBy === "lines") {
        return text.split("\n");
      }
      return text.split(splitBy);
    }, [text, splitBy]);

    const getStaggerDelay = useCallback(
      (index: number) => {
        const total =
          splitBy === "characters"
            ? (elements as WordObject[]).reduce(
                (sum, word) => sum + word.characters.length + (word.needsSpace ? 1 : 0),
                0,
              )
            : elements.length;

        if (staggerFrom === "first") {
          return index * staggerDuration;
        }
        if (staggerFrom === "last") {
          return (total - 1 - index) * staggerDuration;
        }
        if (staggerFrom === "center") {
          const center = Math.floor(total / 2);
          return Math.abs(center - index) * staggerDuration;
        }
        if (staggerFrom === "random") {
          const randomIndex = Math.floor(Math.random() * total);
          return Math.abs(randomIndex - index) * staggerDuration;
        }
        return Math.abs(staggerFrom - index) * staggerDuration;
      },
      [elements, splitBy, staggerDuration, staggerFrom],
    );

    const startAnimation = useCallback(() => {
      setIsAnimating(true);
      onStart?.();
    }, [onStart]);

    useImperativeHandle(
      ref,
      () => ({
        startAnimation,
        reset: () => setIsAnimating(false),
      }),
      [startAnimation],
    );

    const variants = {
      hidden: { y: reverse ? "-100%" : "100%" },
      visible: (index: number) => ({
        y: 0,
        transition: {
          ...transition,
          delay: Number(transition.delay ?? 0) + getStaggerDelay(index),
        },
      }),
    };

    const mappedWords =
      splitBy === "characters"
        ? (elements as WordObject[])
        : (elements as string[]).map((element, index) => ({
            characters: [element],
            needsSpace: index !== elements.length - 1,
          }));

    return (
      <span
        className={cn(containerClassName, "flex flex-wrap whitespace-pre-wrap", splitBy === "lines" && "flex-col")}
        onClick={onClick}
      >
        <span className="sr-only">{text}</span>

        {mappedWords.map((wordObj, wordIndex, array) => {
          const previousCharsCount = array
            .slice(0, wordIndex)
            .reduce((sum, word) => sum + word.characters.length, 0);

          return (
            <span key={wordIndex} aria-hidden="true" className={cn("inline-flex overflow-hidden", wordLevelClassName)}>
              {wordObj.characters.map((char, charIndex) => (
                <span className={cn(elementLevelClassName, "relative whitespace-pre-wrap")} key={`${wordIndex}-${charIndex}`}>
                  <motion.span
                    custom={previousCharsCount + charIndex}
                    initial="hidden"
                    animate={isAnimating ? "visible" : "hidden"}
                    variants={variants}
                    onAnimationComplete={
                      wordIndex === mappedWords.length - 1 && charIndex === wordObj.characters.length - 1
                        ? onComplete
                        : undefined
                    }
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                </span>
              ))}
              {wordObj.needsSpace ? <span> </span> : null}
            </span>
          );
        })}
      </span>
    );
  },
);

VerticalCutReveal.displayName = "VerticalCutReveal";

export { VerticalCutReveal };
