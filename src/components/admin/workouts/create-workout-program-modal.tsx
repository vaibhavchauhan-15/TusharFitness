"use client";

import { useEffect, useId, useState } from "react";
import { HiOutlinePlus, HiXMark } from "react-icons/hi2";
import { createWorkoutProgramAction } from "@/lib/admin/actions";
import type { AdminSelectOption } from "@/lib/admin/select-options";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelector } from "@/components/ui/option-selector";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";

type CreateWorkoutProgramModalProps = {
  goalSlugOptions: AdminSelectOption[];
  bodyPartSlugOptions: AdminSelectOption[];
  goalOptions: AdminSelectOption[];
  bodyPartOptions: AdminSelectOption[];
  goalTypeOptions: AdminSelectOption[];
  difficultyOptions: AdminSelectOption[];
  levelOptions: AdminSelectOption[];
  equipmentOptions: AdminSelectOption[];
  statusOptions: AdminSelectOption[];
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
    <section className="rounded-[28px] border border-[var(--card-border)] bg-[var(--surface-strong)]/70 p-4 md:p-5">
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
  goalOptions,
  bodyPartOptions,
  goalTypeOptions,
  difficultyOptions,
  levelOptions,
  equipmentOptions,
  statusOptions,
  hasWorkoutTaxonomy,
}: CreateWorkoutProgramModalProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

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
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function submitWorkoutProgram(formData: FormData) {
    await createWorkoutProgramAction(formData);
    setOpen(false);
  }

  return (
    <>
      <Button type="button" size="lg" onClick={() => setOpen(true)} className="gap-2">
        <HiOutlinePlus className="h-5 w-5" />
        Add Workout
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
            aria-label="Close add workout dialog"
            onClick={() => setOpen(false)}
          />

          <div className="absolute inset-0 overflow-y-auto">
            <div className="min-h-dvh p-3 md:p-6">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                className="glass-panel mx-auto flex min-h-[calc(100dvh-1.5rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] border border-[var(--card-border)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--card-border)] px-4 py-4 md:px-6 md:py-5">
                  <div className="max-w-3xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Workout upload</p>
                    <h2 id={titleId} className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                      Add a new workout program
                    </h2>
                    <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
                      Use the full-screen builder to add the program details and its first exercise in one flow.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--surface-strong)] text-foreground transition hover:bg-[var(--primary-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                      aria-label="Close add workout dialog"
                    >
                      <HiXMark className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-6 pt-5 md:px-6 md:pb-8">
                  <form action={submitWorkoutProgram} className="space-y-6">
                    <FormSection
                      title="Program basics"
                      description="Start with the workout identity, category mapping, and publish preferences."
                    >
                      <div className="grid gap-4 xl:grid-cols-2">
                        <Field label="Program title" required hint="Choose a clear, user-facing name.">
                          <Input name="title" placeholder="Full body shred" required />
                        </Field>

                        <Field label="Slug" hint="Optional. We will generate one from the title if you leave this empty.">
                          <Input name="slug" placeholder="full-body-shred" />
                        </Field>

                        <Field
                          label="Workout goal taxonomy"
                          required
                          hint="This connects the program to your workout catalog goal."
                        >
                          <OptionSelector
                            name="goalSlug"
                            options={goalSlugOptions}
                            required
                            disabled={!goalSlugOptions.length}
                            defaultValue={goalSlugOptions[0]?.value}
                          />
                        </Field>

                        <Field
                          label="Body part taxonomy"
                          required
                          hint="This links the program to your body-part catalog entry."
                        >
                          <OptionSelector
                            name="bodyPartSlug"
                            options={bodyPartSlugOptions}
                            required
                            disabled={!bodyPartSlugOptions.length}
                            defaultValue={bodyPartSlugOptions[0]?.value}
                          />
                        </Field>

                        <Field label="Goal" required>
                          <OptionSelector
                            name="goal"
                            options={goalOptions}
                            required
                            defaultValue={goalOptions[0]?.value}
                          />
                        </Field>

                        <Field label="Body part focus" required>
                          <OptionSelector
                            name="bodyPart"
                            options={bodyPartOptions}
                            required
                            defaultValue={bodyPartOptions[0]?.value}
                          />
                        </Field>

                        <Field label="Goal type" required>
                          <OptionSelector
                            name="goalType"
                            options={goalTypeOptions}
                            required
                            defaultValue={goalTypeOptions[0]?.value}
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

                        <Field label="Level" required>
                          <OptionSelector
                            name="level"
                            options={levelOptions}
                            required
                            defaultValue={levelOptions[0]?.value}
                          />
                        </Field>

                        <Field label="Status" required hint="Choose whether to keep it in draft or publish immediately.">
                          <OptionSelector
                            name="status"
                            options={statusOptions}
                            required
                            defaultValue="draft"
                          />
                        </Field>

                        <Field label="Duration in minutes" required>
                          <Input name="durationMinutes" placeholder="45" type="number" min={1} required />
                        </Field>

                        <Field label="Program length in weeks" hint="Optional if this is not a multi-week program.">
                          <Input name="durationWeeks" placeholder="8" type="number" min={1} />
                        </Field>

                        <Field
                          label="Thumbnail URL"
                          className="xl:col-span-2"
                          hint="Accepts either a local image path like /images/... or a full https URL."
                        >
                          <Input name="thumbnailUrl" placeholder="/images/workouts/full-body-shred.jpg" />
                        </Field>

                        <Field
                          label="Program overview"
                          className="xl:col-span-2"
                          hint="A short description helps the admin team recognize the program quickly."
                        >
                          <Textarea
                            name="description"
                            placeholder="Describe the workout format, intensity, and ideal trainee."
                            rows={5}
                          />
                        </Field>
                      </div>
                    </FormSection>

                    <FormSection
                      title="First exercise setup"
                      description="Every new program starts with its first exercise so the workout is immediately usable."
                    >
                      <div className="grid gap-4 xl:grid-cols-2">
                        <Field label="Exercise name" required>
                          <Input name="exerciseName" placeholder="Jump squat" required />
                        </Field>

                        <Field label="Exercise slug" hint="Optional. We will derive one if left empty.">
                          <Input name="exerciseSlug" placeholder="jump-squat" />
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

                        <Field label="Movement pattern" hint="Optional. Example: push, pull, hinge, squat.">
                          <Input name="motion" placeholder="Squat" />
                        </Field>

                        <Field label="Short form cue" hint="A quick coaching cue shown to users.">
                          <Input name="formCue" placeholder="Keep the chest tall and knees soft on landing." />
                        </Field>

                        <Field
                          label="Exercise video URL"
                          className="xl:col-span-2"
                          hint="Paste a full video URL if you already have the movement demo uploaded."
                        >
                          <Input name="videoUrl" placeholder="https://example.com/video.mp4" type="url" />
                        </Field>

                        <Field label="Position" hint="Use 0 for the opening movement in the program.">
                          <Input name="position" type="number" min={0} defaultValue={0} placeholder="0" />
                        </Field>

                        <Field label="Duration in seconds" hint="Optional timer-based duration.">
                          <Input name="durationSeconds" type="number" min={0} defaultValue={0} placeholder="30" />
                        </Field>

                        <Field label="Rest in seconds" hint="Time before the next set or exercise.">
                          <Input name="restSeconds" type="number" min={0} defaultValue={0} placeholder="15" />
                        </Field>

                        <Field label="Sets" required>
                          <Input name="sets" placeholder="3" required />
                        </Field>

                        <Field label="Reps" required>
                          <Input name="reps" placeholder="12" required />
                        </Field>

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
                          label="Form cues"
                          className="xl:col-span-2"
                          hint="One cue per line. These become coaching reminders."
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

                        <Field
                          label="Optional notes"
                          className="xl:col-span-2"
                          hint="Add anything helpful for future edits or coaching context."
                        >
                          <Textarea
                            name="optionalNotes"
                            placeholder="Great finisher for metabolic conditioning days."
                            rows={3}
                          />
                        </Field>
                      </div>
                    </FormSection>

                    {!hasWorkoutTaxonomy ? (
                      <div className="rounded-[24px] border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        Add workout goals and body parts in Supabase taxonomy before publishing new workout programs.
                      </div>
                    ) : null}

                    <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[var(--card-border)] bg-background/92 px-4 py-4 backdrop-blur">
                      <p className="text-sm text-muted-foreground">
                        Review the program and first exercise details, then save when ready.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                          Close
                        </Button>
                        <SubmitButton pendingLabel="Saving program..." className="min-w-40" disabled={!hasWorkoutTaxonomy}>
                          Save Program
                        </SubmitButton>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
