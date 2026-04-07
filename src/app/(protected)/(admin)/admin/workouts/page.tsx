import { EmptyState } from "@/components/admin/feedback/empty-state";
import { AdminPageHeader } from "@/components/admin/layout/page-header";
import { AppTable } from "@/components/admin/tables/app-table";
import { TableToolbar } from "@/components/admin/tables/table-toolbar";
import { CreateWorkoutProgramModal } from "@/components/admin/workouts/create-workout-program-modal";
import {
  toAdminSelectOptions,
  WORKOUT_DIFFICULTY_OPTIONS,
  WORKOUT_EQUIPMENT_OPTIONS,
} from "@/lib/admin/select-options";
import { listWorkoutPrograms, listWorkoutTaxonomyOptions } from "@/lib/admin/queries";
import { formatDate } from "@/lib/utils";

type WorkoutsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminWorkoutsPage({ searchParams }: WorkoutsPageProps) {
  const query = await searchParams;
  const search = getSingleParam(query.search) ?? "";

  const [{ rows, count }, taxonomy] = await Promise.all([
    listWorkoutPrograms({
      search,
      pageSize: 20,
    }),
    listWorkoutTaxonomyOptions(),
  ]);

  const goalSlugOptions = toAdminSelectOptions(taxonomy.goals);
  const bodyPartSlugOptions = toAdminSelectOptions(taxonomy.bodyParts);
  const hasWorkoutTaxonomy = goalSlugOptions.length > 0 && bodyPartSlugOptions.length > 0;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Workout Builder"
        title="Workout exercise uploads"
        subtitle="Manage exercise records directly from the workout_exercises table and keep taxonomy alignment clean."
        actionSlot={(
          <CreateWorkoutProgramModal
            goalSlugOptions={goalSlugOptions}
            bodyPartSlugOptions={bodyPartSlugOptions}
            difficultyOptions={WORKOUT_DIFFICULTY_OPTIONS}
            equipmentOptions={WORKOUT_EQUIPMENT_OPTIONS}
            hasWorkoutTaxonomy={hasWorkoutTaxonomy}
          />
        )}
      />

      <div className="space-y-4">
        <TableToolbar defaultSearch={search} placeholder="Search workout exercises" />
        <p className="text-sm text-muted-foreground">{count} workout exercises</p>

        {rows.length > 0 ? (
          <AppTable
            caption="Workout exercises table"
            rows={rows}
            columns={[
              {
                key: "title",
                header: "Exercise",
                render: (row) => (
                  <div>
                    <p className="font-semibold">{row.title}</p>
                    <p className="text-xs text-muted-foreground">{row.targetMuscle || "--"}</p>
                  </div>
                ),
              },
              {
                key: "spec",
                header: "Goal / Difficulty",
                render: (row) => (
                  <div>
                    <p>{row.goal || "--"}</p>
                    <p className="text-xs text-muted-foreground">{row.difficulty || "--"}</p>
                  </div>
                ),
              },
              {
                key: "bodyPart",
                header: "Body Part",
                render: (row) => row.bodyPart || "--",
              },
              {
                key: "video",
                header: "Video",
                render: (row) => (row.exerciseMediaPath ? "Linked" : "--"),
              },
              {
                key: "sets",
                header: "Sets / Reps",
                render: (row) => `${row.sets || "--"} / ${row.reps || "--"}`,
              },
              {
                key: "updated",
                header: "Updated",
                render: (row) => (row.createdAt ? formatDate(row.createdAt) : "--"),
              },
            ]}
          />
        ) : (
          <EmptyState
            title="No workout exercises yet"
            description="Create your first exercise upload now to populate the frontend workout catalog."
          />
        )}
      </div>
    </div>
  );
}
