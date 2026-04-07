"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ExerciseCard } from "@/components/workouts/exercise-card";
import type { WorkoutExercise } from "@/lib/supabase/workouts";

type ExerciseListProps = {
  selectedGoalName: string;
  selectedBodyPartName: string;
  selectedGoalSlug: string;
  selectedBodyPartSlug: string;
  exercises: WorkoutExercise[];
};

export function ExerciseList({
  selectedGoalName,
  selectedBodyPartName,
  selectedGoalSlug,
  selectedBodyPartSlug,
  exercises,
}: ExerciseListProps) {
  return (
    <section className="space-y-4" aria-label="Exercise selection">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Badge>Step 2</Badge>
          <h2 className="mt-3 text-2xl font-bold tracking-tight">Pick an exercise</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedGoalName} • {selectedBodyPartName}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {exercises.length > 0 ? (
          <motion.div
            key={`${selectedGoalName}-${selectedBodyPartName}`}
            className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {exercises.map((exercise, index) => (
              <motion.div
                key={exercise.slug}
                className="h-full"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: index * 0.03 }}
              >
                <ExerciseCard
                  exercise={exercise}
                  href={`/workouts/${exercise.slug}?goal=${selectedGoalSlug}&bodyPart=${selectedBodyPartSlug}`}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={`${selectedGoalName}-${selectedBodyPartName}-empty`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <Card className="rounded-[28px] p-5 text-sm text-muted-foreground">
              No exercises configured for this combination yet.
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
