import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VIDEO_BUCKET = "videos";
const SIGNED_URL_TTL_SECONDS = 3600;

type SignedVideoRequestBody = {
  path?: unknown;
};

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

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as SignedVideoRequestBody;
  const path = normalizeStoragePath(body.path);

  if (!path) {
    return NextResponse.json(
      {
        error: "Invalid video path.",
      },
      { status: 400 },
    );
  }

  const adminClient = createSupabaseAdminClient();

  if (!adminClient) {
    return NextResponse.json(
      {
        error: "Supabase admin client is not configured.",
      },
      { status: 503 },
    );
  }

  const { data, error } = await adminClient.storage
    .from(VIDEO_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      {
        error: error?.message || "Unable to generate video URL.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      url: data.signedUrl,
      expiresIn: SIGNED_URL_TTL_SECONDS,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );
}
