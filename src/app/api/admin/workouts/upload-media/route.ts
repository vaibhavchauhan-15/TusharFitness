import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/permissions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type MediaType = "image" | "video";

type UploadRequestResult = {
  file: File;
  mediaType: MediaType;
};

type DeleteRequestResult = {
  mediaType: MediaType;
  path: string;
};

const BUCKETS: Record<MediaType, string> = {
  image: "images",
  video: "videos",
};

const MAX_SIZE_BYTES: Record<MediaType, number> = {
  image: 2 * 1024 * 1024,
  video: 10 * 1024 * 1024,
};

const MIME_PREFIX: Record<MediaType, string> = {
  image: "image/",
  video: "video/",
};

const FALLBACK_EXTENSION: Record<MediaType, string> = {
  image: "jpg",
  video: "mp4",
};

function normalizeMediaType(value: unknown): MediaType | null {
  if (value === "image" || value === "video") {
    return value;
  }

  return null;
}

function normalizeStoragePath(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/^\/+/, "");

  if (!normalized || normalized.includes("..")) {
    return null;
  }

  return /^[a-zA-Z0-9][a-zA-Z0-9/_\-.]*$/.test(normalized) ? normalized : null;
}

function getSafeExtension(file: File, mediaType: MediaType) {
  const extensionFromName = file.name.trim().split(".").pop()?.toLowerCase() ?? "";

  if (/^[a-z0-9]{2,8}$/.test(extensionFromName)) {
    return extensionFromName;
  }

  const mimeSubtype = file.type.split("/")[1]?.toLowerCase() ?? "";

  if (/^[a-z0-9.+-]{2,16}$/.test(mimeSubtype)) {
    return mimeSubtype.replace("+xml", "");
  }

  return FALLBACK_EXTENSION[mediaType];
}

function createObjectPath(file: File, mediaType: MediaType) {
  const extension = getSafeExtension(file, mediaType);
  const timestamp = Date.now();
  const randomId = crypto.randomUUID().replace(/-/g, "");

  return `workouts/${mediaType}s/${timestamp}-${randomId}.${extension}`;
}

function isMissingBucketError(message: string | null | undefined) {
  const normalized = String(message ?? "").toLowerCase();

  return (
    normalized.includes("bucket not found")
    || normalized.includes("not found")
    || normalized.includes("does not exist")
  );
}

function isAlreadyExistsError(message: string | null | undefined) {
  return String(message ?? "").toLowerCase().includes("already exists");
}

async function ensureStorageBucketExists(
  supabaseAdmin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  bucket: string,
  mediaType: MediaType,
) {
  const { error } = await supabaseAdmin.storage.createBucket(bucket, {
    public: mediaType === "image",
  });

  if (error && !isAlreadyExistsError(error.message)) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    error: null,
  };
}

async function uploadWithBucketRecovery(
  supabaseAdmin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  bucket: string,
  objectPath: string,
  fileBuffer: Buffer,
  contentType: string,
  mediaType: MediaType,
) {
  const firstAttempt = await supabaseAdmin.storage.from(bucket).upload(objectPath, fileBuffer, {
    contentType,
    upsert: false,
  });

  if (!firstAttempt.error) {
    return {
      ok: true,
      error: null,
    };
  }

  if (!isMissingBucketError(firstAttempt.error.message)) {
    return {
      ok: false,
      error: firstAttempt.error.message,
    };
  }

  const bucketRecovery = await ensureStorageBucketExists(supabaseAdmin, bucket, mediaType);

  if (!bucketRecovery.ok) {
    return {
      ok: false,
      error: bucketRecovery.error,
    };
  }

  const secondAttempt = await supabaseAdmin.storage.from(bucket).upload(objectPath, fileBuffer, {
    contentType,
    upsert: false,
  });

  if (secondAttempt.error) {
    return {
      ok: false,
      error: secondAttempt.error.message,
    };
  }

  return {
    ok: true,
    error: null,
  };
}

async function parseUploadRequest(request: Request): Promise<UploadRequestResult> {
  const formData = await request.formData();
  const mediaType = normalizeMediaType(formData.get("mediaType"));
  const file = formData.get("file");

  if (!mediaType) {
    throw new Error("Invalid media type.");
  }

  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("Select a valid file to upload.");
  }

  if (!file.type.startsWith(MIME_PREFIX[mediaType])) {
    throw new Error(`Unsupported ${mediaType} file type.`);
  }

  if (file.size > MAX_SIZE_BYTES[mediaType]) {
    const limitMb = MAX_SIZE_BYTES[mediaType] / (1024 * 1024);
    throw new Error(`${mediaType === "image" ? "Image" : "Video"} must be ${limitMb} MB or smaller.`);
  }

  return {
    file,
    mediaType,
  };
}

async function parseDeleteRequest(request: Request): Promise<DeleteRequestResult> {
  const body = (await request.json().catch(() => ({}))) as {
    mediaType?: unknown;
    path?: unknown;
  };

  const mediaType = normalizeMediaType(body.mediaType);
  const path = normalizeStoragePath(body.path);

  if (!mediaType || !path) {
    throw new Error("Invalid media delete request.");
  }

  return {
    mediaType,
    path,
  };
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const adminSession = await getAdminSession();

  if (!adminSession || adminSession.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 503 });
  }

  let parsedRequest: UploadRequestResult;

  try {
    parsedRequest = await parseUploadRequest(request);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid upload request.",
      },
      { status: 400 },
    );
  }

  const { file, mediaType } = parsedRequest;
  const objectPath = createObjectPath(file, mediaType);
  const bucket = BUCKETS[mediaType];

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const uploadResult = await uploadWithBucketRecovery(
    supabaseAdmin,
    bucket,
    objectPath,
    fileBuffer,
    file.type,
    mediaType,
  );

  if (!uploadResult.ok) {
    return NextResponse.json(
      {
        error: uploadResult.error,
      },
      { status: 500 },
    );
  }

  if (mediaType === "image") {
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(objectPath);

    return NextResponse.json(
      {
        mediaType,
        path: objectPath,
        publicUrl: data.publicUrl,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return NextResponse.json(
    {
      mediaType,
      path: objectPath,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function DELETE(request: Request) {
  const adminSession = await getAdminSession();

  if (!adminSession || adminSession.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseAdmin = createSupabaseAdminClient();

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Supabase admin is not configured." }, { status: 503 });
  }

  let parsedRequest: DeleteRequestResult;

  try {
    parsedRequest = await parseDeleteRequest(request);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Invalid delete request.",
      },
      { status: 400 },
    );
  }

  const bucket = BUCKETS[parsedRequest.mediaType];
  const { error } = await supabaseAdmin.storage.from(bucket).remove([parsedRequest.path]);

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      mediaType: parsedRequest.mediaType,
      path: parsedRequest.path,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
