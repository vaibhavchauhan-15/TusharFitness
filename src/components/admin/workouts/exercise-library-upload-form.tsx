"use client";

import { useState } from "react";
import { createExerciseLibraryAction } from "@/lib/admin/actions";
import { deleteWorkoutMediaFile, uploadWorkoutMediaFile } from "@/lib/admin/media-upload";
import type { AdminSelectOption } from "@/lib/admin/select-options";
import {
  WORKOUT_DIFFICULTY_OPTIONS,
  WORKOUT_EQUIPMENT_OPTIONS,
} from "@/lib/admin/select-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelector } from "@/components/ui/option-selector";
import { Textarea } from "@/components/ui/textarea";
import { ToastViewport, useToastQueue } from "@/components/ui/toast-viewport";

type ExerciseLibraryUploadFormProps = {
  goalOptions: AdminSelectOption[];
  bodyPartOptions: AdminSelectOption[];
  hasWorkoutTaxonomy: boolean;
};

export function ExerciseLibraryUploadForm({
  goalOptions,
  bodyPartOptions,
  hasWorkoutTaxonomy,
}: ExerciseLibraryUploadFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const { toasts, pushToast, dismissToast } = useToastQueue();

  async function submitExercise(formData: FormData) {
    setSubmitError(null);
    setIsUploadingMedia(true);
    let uploadedImagePath: string | null = null;
    let uploadedVideoPath: string | null = null;

    pushToast({
      tone: "info",
      title: "Uploading media",
      description: "Uploading files to Supabase storage...",
    });

    try {
      const thumbnailFile = formData.get("thumbnailFile");

      if (!(thumbnailFile instanceof File) || thumbnailFile.size <= 0) {
        throw new Error("Upload a thumbnail image before saving the exercise.");
      }

      const imageUpload = await uploadWorkoutMediaFile(thumbnailFile, "image");
      uploadedImagePath = imageUpload.path;
      pushToast({
        tone: "success",
        title: "Thumbnail uploaded",
      });
      formData.set("thumbnailUrl", imageUpload.publicUrl);
      formData.delete("thumbnailFile");

      const videoFile = formData.get("videoFile");

      if (videoFile instanceof File && videoFile.size > 0) {
        const videoUpload = await uploadWorkoutMediaFile(videoFile, "video");
        formData.set("videoPath", videoUpload.path);
        uploadedVideoPath = videoUpload.path;
        pushToast({
          tone: "success",
          title: "Video uploaded",
        });
      } else {
        formData.set("videoPath", "");
      }

      formData.delete("videoFile");

      await createExerciseLibraryAction(formData);
      pushToast({
        tone: "success",
        title: "Exercise saved",
        description: "Exercise library item has been created.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save exercise.";

      const rollbackTasks: Promise<unknown>[] = [];

      if (uploadedVideoPath) {
        rollbackTasks.push(deleteWorkoutMediaFile(uploadedVideoPath, "video"));
      }

      if (uploadedImagePath) {
        rollbackTasks.push(deleteWorkoutMediaFile(uploadedImagePath, "image"));
      }

      if (rollbackTasks.length > 0) {
        const rollbackResults = await Promise.allSettled(rollbackTasks);
        const rollbackFailures = rollbackResults.filter((result) => result.status === "rejected").length;

        if (rollbackFailures === 0) {
          pushToast({
            tone: "info",
            title: "Upload rolled back",
            description: "Uploaded media was removed because save failed.",
          });
        } else {
          pushToast({
            tone: "error",
            title: "Rollback partially failed",
            description: "Some uploaded files could not be removed automatically.",
          });
        }
      }

      setSubmitError(message);
      pushToast({
        tone: "error",
        title: "Upload failed",
        description: message,
      });
    } finally {
      setIsUploadingMedia(false);
    }
  }

  return (
    <>
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />

      <form action={submitExercise} className="space-y-3">
        <Input name="title" placeholder="Exercise title" required />

      <OptionSelector
        name="goalSlug"
        options={goalOptions}
        required
        disabled={!goalOptions.length}
        defaultValue={goalOptions[0]?.value}
      />

      <OptionSelector
        name="bodyPartSlug"
        options={bodyPartOptions}
        required
        disabled={!bodyPartOptions.length}
        defaultValue={bodyPartOptions[0]?.value}
      />

      <Input name="thumbnailFile" type="file" accept="image/*" required />
      <input name="thumbnailUrl" type="hidden" />

      <Input name="videoFile" type="file" accept="video/*" />
      <input name="videoPath" type="hidden" />

      <Input name="targetMuscle" placeholder="Target muscle" required />
      <OptionSelector
        name="equipment"
        options={WORKOUT_EQUIPMENT_OPTIONS}
        required
        defaultValue={WORKOUT_EQUIPMENT_OPTIONS[0]?.value}
      />

      <OptionSelector
        name="difficulty"
        options={WORKOUT_DIFFICULTY_OPTIONS}
        required
        defaultValue={WORKOUT_DIFFICULTY_OPTIONS[0]?.value}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input name="sets" placeholder="Sets" required />
        <Input name="reps" placeholder="Reps" required />
      </div>

      <Input name="restSeconds" type="number" min={0} defaultValue={0} placeholder="Rest seconds" />

      <Textarea
        name="instructions"
        placeholder="Instructions (one step per line)"
        required
        rows={4}
      />
      <Textarea
        name="formCues"
        placeholder="Form cues (one cue per line)"
        required
        rows={3}
      />

      <Textarea
        name="commonMistakes"
        placeholder="Common mistakes (one mistake per line)"
        rows={3}
      />

        {!hasWorkoutTaxonomy ? (
          <p className="text-xs text-amber-500 dark:text-amber-300">
            Add workout goals and body parts first from Supabase seed or admin taxonomy setup.
          </p>
        ) : null}

        {isUploadingMedia ? (
          <div className="rounded-xl border border-(--card-border) bg-(--surface-strong)/60 px-3 py-2 text-sm text-foreground">
            Uploading media to Supabase storage...
          </div>
        ) : null}

        {submitError ? (
          <div
            className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900 dark:border-rose-500/50 dark:bg-rose-950/40 dark:text-rose-100"
            role="alert"
            aria-live="polite"
          >
            {submitError}
          </div>
        ) : null}

        <Button type="submit" className="w-full" disabled={!hasWorkoutTaxonomy || isUploadingMedia}>
          Save Exercise
        </Button>
      </form>
    </>
  );
}
