"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type LazyWorkoutVideoProps = {
  src: string;
  poster: string;
  className?: string;
};

export function LazyWorkoutVideo({ src, poster, className }: LazyWorkoutVideoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "240px 0px",
        threshold: 0.1,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {shouldLoad ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          className="h-full w-full object-cover"
        >
          <source src={src} />
          Your browser does not support the video tag.
        </video>
      ) : (
        <Image
          src={poster}
          alt="Exercise preview"
          fill
          sizes="(max-width: 1024px) 100vw, 720px"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
