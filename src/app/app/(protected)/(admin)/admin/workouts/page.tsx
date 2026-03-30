import { setWorkoutStatusAction } from "@/lib/admin/actions";
import { EmptyState } from "@/components/admin/feedback/empty-state";
import { StatusPill } from "@/components/admin/feedback/status-pill";
import { AdminPageHeader } from "@/components/admin/layout/page-header";
import { AppTable } from "@/components/admin/tables/app-table";
import { TableToolbar } from "@/components/admin/tables/table-toolbar";
import { CreateWorkoutProgramModal } from "@/components/admin/workouts/create-workout-program-modal";
import { Button } from "@/components/ui/button";
import {
  toAdminSelectOptions,
  WORKOUT_BODY_PART_OPTIONS,
  WORKOUT_DIFFICULTY_OPTIONS,
  WORKOUT_EQUIPMENT_OPTIONS,
  WORKOUT_GOAL_OPTIONS,
  WORKOUT_GOAL_TYPE_OPTIONS,
  WORKOUT_LEVEL_OPTIONS,
  WORKOUT_PROGRAM_STATUS_OPTIONS,
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
  const status = getSingleParam(query.status) as "draft" | "published" | "archived" | undefined;

  const [{ rows, count }, taxonomy] = await Promise.all([
    listWorkoutPrograms({
      search,
      status,
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
        title="Workout programs and publish flow"
        subtitle="Manage reusable workout programs, maintain status transitions, and keep assignment-ready templates in one place."
        actionSlot={(
          <CreateWorkoutProgramModal
            goalSlugOptions={goalSlugOptions}
            bodyPartSlugOptions={bodyPartSlugOptions}
            goalOptions={WORKOUT_GOAL_OPTIONS}
            bodyPartOptions={WORKOUT_BODY_PART_OPTIONS}
            goalTypeOptions={WORKOUT_GOAL_TYPE_OPTIONS}
            difficultyOptions={WORKOUT_DIFFICULTY_OPTIONS}
            levelOptions={WORKOUT_LEVEL_OPTIONS}
            equipmentOptions={WORKOUT_EQUIPMENT_OPTIONS}
            statusOptions={WORKOUT_PROGRAM_STATUS_OPTIONS}
            hasWorkoutTaxonomy={hasWorkoutTaxonomy}
          />
        )}
      />

      <div className="space-y-4">
        <TableToolbar defaultSearch={search} placeholder="Search workout programs" />
        <p className="text-sm text-muted-foreground">{count} workout programs</p>

        {rows.length > 0 ? (
          <AppTable
            caption="Workout programs table"
            rows={rows}
            columns={[
              {
                key: "title",
                header: "Program",
                render: (row) => (
                  <div>
                    <p className="font-semibold">{row.title}</p>
                    <p className="text-xs text-muted-foreground">/{row.slug || "missing-slug"}</p>
                  </div>
                ),
              },
              {
                key: "spec",
                header: "Goal / Difficulty",
                render: (row) => (
                  <div>
                    <p>{row.goalType || row.goal || "--"}</p>
                    <p className="text-xs text-muted-foreground">{row.difficulty || row.level || "--"}</p>
                  </div>
                ),
              },
              {
                key: "duration",
                header: "Duration",
                render: (row) => row.duration || (row.durationWeeks ? `${row.durationWeeks} weeks` : "--"),
              },
              {
                key: "video",
                header: "Video",
                render: (row) => (row.exerciseMediaUrl ? "Linked" : "--"),
              },
              {
                key: "status",
                header: "Status",
                render: (row) => <StatusPill value={row.status} />,
              },
              {
                key: "updated",
                header: "Updated",
                render: (row) => (row.createdAt ? formatDate(row.createdAt) : "--"),
              },
              {
                key: "actions",
                header: "Actions",
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    {row.status !== "published" ? (
                      <form action={setWorkoutStatusAction.bind(null, row.id, "published")}>
                        <Button type="submit" size="sm" variant="outline">
                          Publish
                        </Button>
                      </form>
                    ) : null}
                    {row.status !== "draft" ? (
                      <form action={setWorkoutStatusAction.bind(null, row.id, "draft")}>
                        <Button type="submit" size="sm" variant="outline">
                          Draft
                        </Button>
                      </form>
                    ) : null}
                    {row.status !== "archived" ? (
                      <form action={setWorkoutStatusAction.bind(null, row.id, "archived")}>
                        <Button type="submit" size="sm" variant="outline">
                          Archive
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <EmptyState
            title="No workout programs yet"
            description="Create the first program now, then iterate with day templates and exercise ordering in subsequent passes."
          />
        )}
      </div>
    </div>
  );
}
