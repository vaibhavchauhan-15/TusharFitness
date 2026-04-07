import { DrawerForm } from "@/components/admin/forms/drawer-form";
import { EmptyState } from "@/components/admin/feedback/empty-state";
import { AdminPageHeader } from "@/components/admin/layout/page-header";
import { AppTable } from "@/components/admin/tables/app-table";
import { ExerciseLibraryUploadForm } from "@/components/admin/workouts/exercise-library-upload-form";
import {
  toAdminSelectOptions,
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
                      <p className="font-semibold">{row.title}</p>
                      <p className="text-xs text-muted-foreground">/{row.reference}</p>
                    </div>
                  ),
                },
                {
                  key: "target",
                  header: "Goal / Body Part",
                  render: (row) => (
                    <div>
                      <p>{row.goal}</p>
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
                  render: (row) => (row.video_path ? "Image + Video" : "Image only"),
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
          <ExerciseLibraryUploadForm
            goalOptions={goalOptions}
            bodyPartOptions={bodyPartOptions}
            hasWorkoutTaxonomy={hasWorkoutTaxonomy}
          />
        </DrawerForm>
      </div>
    </div>
  );
}
