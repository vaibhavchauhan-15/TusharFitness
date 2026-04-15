"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface CardItem {
  id: string | number;
  title: string;
  description: string;
  imgSrc: string;
  icon: React.ReactNode;
  linkHref: string;
}

interface ExpandingCardsProps extends React.HTMLAttributes<HTMLUListElement> {
  items: CardItem[];
  defaultActiveIndex?: number;
}

function subscribeToViewport(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getIsDesktopSnapshot() {
  return window.innerWidth >= 768;
}

function getIsDesktopServerSnapshot() {
  return false;
}

export const ExpandingCards = React.forwardRef<HTMLUListElement, ExpandingCardsProps>(
  ({ className, items, defaultActiveIndex = 0, ...props }, ref) => {
    const initialIndex =
      items.length > 0 ? Math.max(0, Math.min(defaultActiveIndex, items.length - 1)) : null;

    const [activeIndex, setActiveIndex] = React.useState<number | null>(initialIndex);
    const isDesktop = React.useSyncExternalStore(
      subscribeToViewport,
      getIsDesktopSnapshot,
      getIsDesktopServerSnapshot,
    );

    const resolvedActiveIndex = React.useMemo(() => {
      if (activeIndex === null || items.length === 0) {
        return null;
      }

      return Math.min(activeIndex, items.length - 1);
    }, [activeIndex, items.length]);

    const gridStyle = React.useMemo<React.CSSProperties>(() => {
      if (resolvedActiveIndex === null) {
        return {};
      }

      if (isDesktop) {
        const columns = items
          .map((_, index) => (index === resolvedActiveIndex ? "5fr" : "1fr"))
          .join(" ");

        return {
          gridTemplateColumns: columns,
          gridTemplateRows: "1fr",
        };
      }

      const rows = items.map((_, index) => (index === resolvedActiveIndex ? "5fr" : "1fr")).join(" ");
      return {
        gridTemplateRows: rows,
        gridTemplateColumns: "1fr",
      };
    }, [isDesktop, items, resolvedActiveIndex]);

    const handleInteraction = (index: number) => {
      setActiveIndex(index);
    };

    return (
      <ul
        className={cn(
          "grid h-150 w-full max-w-6xl gap-2",
          "transition-[grid-template-columns,grid-template-rows] duration-500 ease-out",
          className,
        )}
        style={gridStyle}
        ref={ref}
        {...props}
      >
        {items.map((item, index) => (
          <li
            key={item.id}
            className={cn(
              "group relative min-h-0 min-w-0 cursor-pointer overflow-hidden rounded-lg border border-border/70 bg-card text-card-foreground shadow-sm",
              "md:min-w-20",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70",
            )}
            onMouseEnter={() => handleInteraction(index)}
            onFocus={() => handleInteraction(index)}
            onClick={() => handleInteraction(index)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handleInteraction(index);
              }
            }}
            tabIndex={0}
            data-active={resolvedActiveIndex === index}
            data-stagger-item
          >
            <Image
              src={item.imgSrc}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
              className="absolute inset-0 h-full w-full object-cover transition-all duration-300 ease-out group-data-[active=true]:scale-100 group-data-[active=true]:grayscale-0 scale-110 grayscale"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent" />

            <article className="absolute inset-0 flex flex-col justify-end gap-2 p-4">
              <h3 className="hidden origin-left rotate-90 whitespace-nowrap text-sm font-light uppercase tracking-wider !text-white opacity-100 transition-all duration-300 ease-out md:block group-data-[active=true]:opacity-0">
                {item.title}
              </h3>

              <div className="!text-white opacity-0 transition-all duration-300 delay-75 ease-out group-data-[active=true]:opacity-100">
                {item.icon}
              </div>

              <h3 className="text-xl font-bold !text-white opacity-0 transition-all duration-300 delay-150 ease-out group-data-[active=true]:opacity-100">
                {item.title}
              </h3>

              <p className="w-full max-w-xs text-sm !text-white opacity-0 transition-all duration-300 delay-225 ease-out group-data-[active=true]:opacity-100">
                {item.description}
              </p>
            </article>
          </li>
        ))}
      </ul>
    );
  },
);

ExpandingCards.displayName = "ExpandingCards";
