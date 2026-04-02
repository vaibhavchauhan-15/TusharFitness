export type WorkoutMediaType = "image" | "video";

export function uploadWorkoutMediaFile(
  file: File,
  mediaType: "image",
): Promise<{ path: string; publicUrl: string }>;
export function uploadWorkoutMediaFile(
  file: File,
  mediaType: "video",
): Promise<{ path: string }>;

export async function uploadWorkoutMediaFile(file: File, mediaType: WorkoutMediaType) {
  const payload = new FormData();
  payload.append("file", file);
  payload.append("mediaType", mediaType);

  const response = await fetch("/api/admin/workouts/upload-media", {
    method: "POST",
    body: payload,
  });

  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
    mediaType?: WorkoutMediaType;
    path?: string;
    publicUrl?: string;
  };

  if (!response.ok) {
    throw new Error(body.error || "Upload failed.");
  }

  if (mediaType === "image") {
    if (!body.publicUrl) {
      throw new Error("Image upload succeeded but public URL is missing.");
    }

    return {
      path: body.path ?? "",
      publicUrl: body.publicUrl,
    };
  }

  if (!body.path) {
    throw new Error("Video upload succeeded but storage path is missing.");
  }

  return {
    path: body.path,
  };
}

export async function deleteWorkoutMediaFile(path: string, mediaType: WorkoutMediaType) {
  const response = await fetch("/api/admin/workouts/upload-media", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mediaType,
      path,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.error || "Failed to delete uploaded media.");
  }
}
