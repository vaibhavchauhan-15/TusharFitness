"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type LazyWorkoutVideoProps = {
  path: string;
  poster: string;
  className?: string;
};

const signedVideoUrlCache = new Map<string, { url: string; expiresAt: number }>();
const MIN_SIGNED_URL_REUSE_MS = 30_000;

async function getSignedVideoUrl(path: string, signal: AbortSignal) {
  const cached = signedVideoUrlCache.get(path);

  if (cached && cached.expiresAt - Date.now() > MIN_SIGNED_URL_REUSE_MS) {
    return cached.url;
  }

  const response = await fetch("/api/workouts/video-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
    cache: "no-store",
    signal,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    url?: string;
    expiresIn?: number;
    error?: string;
  };

  if (!response.ok || !payload.url) {
    throw new Error(payload.error || "Unable to generate signed video URL");
  }

  const expiresInSeconds =
    typeof payload.expiresIn === "number" && Number.isFinite(payload.expiresIn)
      ? Math.max(60, payload.expiresIn)
      : 3600;

  signedVideoUrlCache.set(path, {
    url: payload.url,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });

  return payload.url;
}

export function LazyWorkoutVideo({ path, poster, className }: LazyWorkoutVideoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [playbackSource, setPlaybackSource] = useState<string | null>(null);

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

  useEffect(() => {
    if (!shouldLoad) {
      return;
    }

    const normalizedPath = path.trim().replace(/^\/+/, "");

    if (!normalizedPath) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    getSignedVideoUrl(normalizedPath, controller.signal)
      .then((signedUrl) => {
        if (!cancelled) {
          setPlaybackSource(signedUrl);
        }
      })
      .catch(() => {
        // Keep poster fallback when signed URL cannot be generated.
        if (!cancelled) {
          setPlaybackSource(null);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [path, shouldLoad]);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {shouldLoad && playbackSource ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
          controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
          poster={poster}
          className="h-full w-full object-cover"
        >
          <source src={playbackSource} />
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
