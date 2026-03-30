import { createExerciseLibraryAction } from "@/lib/admin/actions";
import { DrawerForm } from "@/components/admin/forms/drawer-form";
import { EmptyState } from "@/components/admin/feedback/empty-state";
import { AdminPageHeader } from "@/components/admin/layout/page-header";
import { AppTable } from "@/components/admin/tables/app-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionSelector } from "@/components/ui/option-selector";
import { Textarea } from "@/components/ui/textarea";
import {
  toAdminSelectOptions,
  WORKOUT_DIFFICULTY_OPTIONS,
  WORKOUT_EQUIPMENT_OPTIONS,
} from "@/lib/admin/select-options";
import { listExerciseLibrary, listWorkoutTaxonomyOptions } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils";

export default async function AdminExerciseLibraryPage() {
  const [{ rows, count }, taxonomy] = await Promise.all([
    listExerciseLibrary({ pageSize: 24 }),
    listWorkoutTaxonomyOptions(),
  ]);

  const goalOptions = toAdminSelectOptions(taxonomy.goals);
  const bodyPartOptions = toAdminSelectOptions(taxonomy.bodyParts);
  const hasWorkoutTaxonomy = goalOptions.length > 0 && bodyPartOptions.length > 0;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Exercise Library"
        title="Reusable exercise catalogue"
        subtitle="Manage goal/body-part aligned exercises that power workout builders and assignment flows."
      />

      <p className="text-sm text-muted-foreground">{count} exercise records</p>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {rows.length > 0 ? (
            <AppTable
              caption="Exercise library table"
              rows={rows}
              columns={[
                {
                  key: "name",
                  header: "Exercise",
                  render: (row) => (
                    <div>
                      <p className="font-semibold">{row.name}</p>
                      <p className="text-xs text-muted-foreground">/{row.slug}</p>
                    </div>
                  ),
                },
                {
                  key: "target",
                  header: "Goal / Body Part",
                  render: (row) => (
                    <div>
                      <p>{row.goal_slug}</p>
                      <p className="text-xs text-muted-foreground">{row.body_part_slug}</p>
                    </div>
                  ),
                },
                {
                  key: "programming",
                  header: "Target / Sets",
                  render: (row) => `${row.target_muscle} • ${row.sets} / ${row.reps}`,
                },
                {
                  key: "media",
                  header: "Media",
                  render: (row) => (row.media_url ? "Image + Video" : "Image only"),
                },
                {
                  key: "difficulty",
                  header: "Difficulty",
                  render: (row) => row.difficulty || "--",
                },
                {
                  key: "created",
                  header: "Created",
                  render: (row) => formatDate(row.created_at),
                },
              ]}
            />
          ) : (
            <EmptyState
              title="No exercise catalog data"
              description="Create exercise entries to populate the workout flow with media and instructions."
            />
          )}
        </div>

        <DrawerForm
          title="Add exercise"
          description="Save exercise image, demo video, and coaching instructions managed from admin."
        >
          <form action={createExerciseLibraryAction} className="space-y-3">
            <Input name="name" placeholder="Exercise name" required />
            <Input name="slug" placeholder="Slug (optional)" />

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

            <Input
              name="imageUrl"
              placeholder="Exercise image URL (/images/... or https://...)"
              required
            />
            <Input
              name="videoUrl"
              placeholder="Exercise demo video URL (/videos/... or https://...)"
            />
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

            <Input name="shortFormCue" placeholder="Short form cue" />

            <div className="grid grid-cols-2 gap-3">
              <Input name="sets" placeholder="Sets" required />
              <Input name="reps" placeholder="Reps" required />
            </div>

            <Input name="restSeconds" type="number" min={0} defaultValue={0} placeholder="Rest seconds" />

            <Input name="sortOrder" type="number" min={0} placeholder="Sort order" defaultValue={0} />

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

            <Textarea
              name="optionalNotes"
              placeholder="Optional notes"
              rows={2}
            />

            {!hasWorkoutTaxonomy ? (
              <p className="text-xs text-amber-400">
                Add workout goals and body parts first from Supabase seed or admin taxonomy setup.
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={!hasWorkoutTaxonomy}>
              Save Exercise
            </Button>
          </form>
        </DrawerForm>
      </div>
    </div>
  );
}
