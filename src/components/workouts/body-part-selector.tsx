"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ImageLabelCard } from "@/components/workouts/image-label-card";
import type { WorkoutBodyPart } from "@/lib/supabase/workouts";

type BodyPartSelectorProps = {
  selectedGoalName: string;
  bodyParts: WorkoutBodyPart[];
  selectedBodyPartSlug: string | null;
  onSelect: (bodyPartSlug: string) => void;
};

export function BodyPartSelector({
  selectedGoalName,
  bodyParts,
  selectedBodyPartSlug,
  onSelect,
}: BodyPartSelectorProps) {
  return (
    <section className="space-y-5" aria-label="Body part selection">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Body Parts
        </p>
        <h2 className="text-2xl font-bold tracking-tight">All body part cards</h2>
        <p className="text-sm text-muted-foreground">
          Goal context: <span className="font-semibold text-foreground">{selectedGoalName}</span>
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedGoalName}
          className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {bodyParts.map((bodyPart, index) => (
            <motion.div
              key={bodyPart.slug}
              className="h-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: index * 0.035 }}
            >
              <ImageLabelCard
                image={bodyPart.imageUrl}
                label={bodyPart.name}
                subtitle="Click to view all exercises"
                imageFit="contain"
                showImageOverlay={false}
                imageSurfaceClassName="bg-linear-to-br from-(--primary-soft) via-(--surface-strong) to-(--background)"
                active={bodyPart.slug === selectedBodyPartSlug}
                onClick={() => onSelect(bodyPart.slug)}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
