"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { HiOutlinePlus, HiXMark } from "react-icons/hi2";
import { createWorkoutProgramAction } from "@/lib/admin/actions";
import { deleteWorkoutMediaFile, uploadWorkoutMediaFile } from "@/lib/admin/media-upload";
import type { AdminSelectOption } from "@/lib/admin/select-options";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelector } from "@/components/ui/option-selector";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { ToastViewport, useToastQueue } from "@/components/ui/toast-viewport";

type CreateWorkoutProgramModalProps = {
  goalSlugOptions: AdminSelectOption[];
  bodyPartSlugOptions: AdminSelectOption[];
  difficultyOptions: AdminSelectOption[];
  equipmentOptions: AdminSelectOption[];
  hasWorkoutTaxonomy: boolean;
};

type FormSectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

type FieldProps = {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="rounded-[28px] border border-(--card-border) bg-(--surface-strong)/70 p-4 md:p-5">
      <div className="mb-4">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, required, className, children }: FieldProps) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="block text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-primary">*</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-xs leading-5 text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export function CreateWorkoutProgramModal({
  goalSlugOptions,
  bodyPartSlugOptions,
  difficultyOptions,
  equipmentOptions,
  hasWorkoutTaxonomy,
}: CreateWorkoutProgramModalProps) {
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const { toasts, pushToast, dismissToast } = useToastQueue();
  const titleId = useId();
  const descriptionId = useId();
  const isBrowser = typeof document !== "undefined";

  function closeModal() {
    setSubmitError(null);
    setIsUploadingMedia(false);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSubmitError(null);
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function submitWorkoutProgram(formData: FormData) {
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
        throw new Error("Upload a thumbnail image before saving the workout.");
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

      await createWorkoutProgramAction(formData);
      pushToast({
        tone: "success",
        title: "Exercise saved",
        description: "Workout exercise has been created successfully.",
      });
      setOpen(false);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Unable to save the workout exercise. Please check the fields and try again.";

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
      <Button type="button" size="lg" onClick={() => setOpen(true)} className="gap-2">
        <HiOutlinePlus className="h-5 w-5" />
        Add Workout
      </Button>
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />

      {open && isBrowser
        ? createPortal(
            <div className="fixed inset-0 z-120">
              <button
                type="button"
                className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
                aria-label="Close add workout dialog"
                onClick={closeModal}
              />

              <div className="absolute inset-0 overflow-y-auto">
                <div className="min-h-dvh p-3 md:p-6">
                  <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={titleId}
                    aria-describedby={descriptionId}
                    className="glass-panel mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-7xl flex-col overflow-hidden rounded-4xl border border-(--card-border)"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-(--card-border) px-4 py-4 md:px-6 md:py-5">
                      <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Workout upload</p>
                        <h2 id={titleId} className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                          Add a workout exercise
                        </h2>
                        <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
                          Save a complete exercise record with taxonomy, media, and coaching details.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={closeModal}>
                          Cancel
                        </Button>
                        <button
                          type="button"
                          onClick={closeModal}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-(--card-border) bg-(--surface-strong) text-foreground transition hover:bg-(--primary-soft) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--ring)"
                          aria-label="Close add workout dialog"
                        >
                          <HiXMark className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 pb-6 pt-5 md:px-6 md:pb-8">
                      <form action={submitWorkoutProgram} className="space-y-6">
                    <p className="rounded-2xl border border-(--card-border) bg-(--surface-strong)/60 px-4 py-3 text-sm text-muted-foreground">
                      Fill the essential exercise fields first. Fields marked with <span className="font-semibold text-foreground">*</span> are required.
                    </p>

                    <FormSection
                      title="Exercise basics"
                      description="Add the exercise identity and taxonomy using the same values required by workout_exercises."
                    >
                      <div className="grid gap-4 xl:grid-cols-2">
                        <Field label="Exercise title" required>
                          <Input name="title" placeholder="Jump squat" required />
                        </Field>

                        <Field label="Workout goal" required>
                          <OptionSelector
                            name="goalSlug"
                            options={goalSlugOptions}
                            required
                            disabled={!goalSlugOptions.length}
                            defaultValue={goalSlugOptions[0]?.value}
                          />
                        </Field>

                        <Field
                          label="Body part"
                          required
                          hint="Main category used by the workouts catalog filters."
                        >
                          <OptionSelector
                            name="bodyPartSlug"
                            options={bodyPartSlugOptions}
                            required
                            disabled={!bodyPartSlugOptions.length}
                            defaultValue={bodyPartSlugOptions[0]?.value}
                          />
                        </Field>

                        <Field label="Target muscle" required>
                          <Input name="targetMuscle" placeholder="Quadriceps" required />
                        </Field>

                        <Field label="Equipment" required>
                          <OptionSelector
                            name="equipment"
                            options={equipmentOptions}
                            required
                            defaultValue={equipmentOptions[0]?.value}
                          />
                        </Field>

                        <Field label="Difficulty" required>
                          <OptionSelector
                            name="difficulty"
                            options={difficultyOptions}
                            required
                            defaultValue={difficultyOptions[0]?.value}
                          />
                        </Field>

                        <Field label="Sets" required>
                          <Input name="sets" placeholder="3" required />
                        </Field>

                        <Field label="Reps" required>
                          <Input name="reps" placeholder="12" required />
                        </Field>

                        <Field label="Rest in seconds" hint="Time before the next set or exercise.">
                          <Input name="restSeconds" type="number" min={0} defaultValue={0} placeholder="15" />
                        </Field>
                      </div>
                    </FormSection>

                    <FormSection
                      title="Media and coaching"
                      description="Add optional media plus structured instruction lists for rendering in detail pages."
                    >
                      <div className="grid gap-4 xl:grid-cols-2">
                        <Field
                          label="Thumbnail image"
                          className="xl:col-span-2"
                          hint="Required. Uploads to Supabase images bucket and stores the public CDN URL automatically."
                        >
                          <Input name="thumbnailFile" type="file" accept="image/*" required />
                        </Field>

                        <input name="thumbnailUrl" type="hidden" />

                        <Field
                          label="Exercise video"
                          className="xl:col-span-2"
                          hint="Optional. Uploads to private Supabase videos bucket and stores only the object path."
                        >
                          <Input name="videoFile" type="file" accept="video/*" />
                        </Field>

                        <input name="videoPath" type="hidden" />

                        <Field
                          label="Instructions"
                          className="xl:col-span-2"
                          hint="Write one step per line so the app can store them cleanly."
                        >
                          <Textarea
                            name="instructions"
                            placeholder={"Start with feet shoulder-width apart.\nLower into a squat.\nDrive upward and land softly."}
                            rows={5}
                          />
                        </Field>

                        <Field
                          label="Coaching cues"
                          className="xl:col-span-2"
                          hint="One cue per line. The first cue becomes the short cue automatically."
                        >
                          <Textarea
                            name="formCues"
                            placeholder={"Brace the core.\nTrack the knees over the toes.\nLand quietly."}
                            rows={4}
                          />
                        </Field>

                        <Field
                          label="Common mistakes"
                          className="xl:col-span-2"
                          hint="One mistake per line so the warning list stays readable."
                        >
                          <Textarea
                            name="commonMistakes"
                            placeholder={"Collapsing the knees inward.\nLanding with a stiff torso."}
                            rows={4}
                          />
                        </Field>

                      </div>
                    </FormSection>

                    {!hasWorkoutTaxonomy ? (
                      <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        Add workout goals and body parts in Supabase taxonomy before saving exercises.
                      </div>
                    ) : null}

                    {submitError ? (
                      <div
                        role="alert"
                        aria-live="polite"
                        className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-900 dark:border-rose-500/50 dark:bg-rose-950/40 dark:text-rose-100"
                      >
                        {submitError}
                      </div>
                    ) : null}

                    {isUploadingMedia ? (
                      <div className="rounded-2xl border border-(--card-border) bg-(--surface-strong)/60 px-4 py-3 text-sm text-muted-foreground">
                        Uploading media to Supabase storage. Please wait...
                      </div>
                    ) : null}

                    <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-(--card-border) bg-background/92 px-4 py-4 backdrop-blur">
                      <p className="text-sm text-muted-foreground">
                        Review the exercise payload and save when ready.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="ghost" onClick={closeModal}>
                          Close
                        </Button>
                        <SubmitButton
                          pendingLabel="Saving exercise..."
                          className="min-w-40"
                          disabled={!hasWorkoutTaxonomy || isUploadingMedia}
                        >
                          Save Exercise
                        </SubmitButton>
                      </div>
                    </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
