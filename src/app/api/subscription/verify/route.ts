import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { env, isRazorpayConfigured } from "@/lib/env";
import { getSessionState } from "@/lib/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
};

type VerifyBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

const SUBSCRIPTION_DURATION_DAYS = 30;

function addDays(baseDate: Date, days: number) {
  return new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isSignatureValid(orderId: string, paymentId: string, signature: string) {
  const expectedSignature = createHmac("sha256", env.razorpayKeySecret!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (expectedSignature.length !== signature.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

async function parseVerifyBody(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json().catch(() => ({}))) as VerifyBody;
  }

  const formData = await request.formData();

  return {
    razorpay_order_id: getString(formData.get("razorpay_order_id")),
    razorpay_payment_id: getString(formData.get("razorpay_payment_id")),
    razorpay_signature: getString(formData.get("razorpay_signature")),
  } satisfies VerifyBody;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSessionState();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  if (!isRazorpayConfigured) {
    return NextResponse.json(
      {
        verified: false,
        mode: "demo",
        message: "Razorpay keys are not configured yet.",
      },
      {
        headers: NO_STORE_HEADERS,
      },
    );
  }

  const body = await parseVerifyBody(request);
  const orderId = getString(body.razorpay_order_id);
  const paymentId = getString(body.razorpay_payment_id);
  const signature = getString(body.razorpay_signature);

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      {
        verified: false,
        error: "Missing payment verification fields.",
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (!isSignatureValid(orderId, paymentId, signature)) {
    return NextResponse.json(
      {
        verified: false,
        error: "Invalid payment signature.",
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const razorpay = new Razorpay({
    key_id: env.razorpayKeyId!,
    key_secret: env.razorpayKeySecret!,
  });

  let payment: { order_id?: string; status?: string };
  let order: { id?: string; status?: string };

  try {
    [payment, order] = await Promise.all([
      razorpay.payments.fetch(paymentId),
      razorpay.orders.fetch(orderId),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch payment status.";

    return NextResponse.json(
      {
        verified: true,
        settled: false,
        error: message,
      },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }

  if (!payment.order_id || !order.id || payment.order_id !== order.id) {
    return NextResponse.json(
      {
        verified: false,
        error: "Payment/order mismatch.",
      },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const orderNotes = (order as { notes?: Record<string, unknown> }).notes;
  const orderUserId =
    orderNotes && typeof orderNotes.user_id === "string" ? orderNotes.user_id : "";

  if (orderUserId && orderUserId !== session.user.id) {
    return NextResponse.json(
      {
        verified: false,
        error: "Payment does not belong to the authenticated user.",
      },
      { status: 403, headers: NO_STORE_HEADERS },
    );
  }

  const paymentStatus = String(payment.status ?? "unknown");
  const orderStatus = String(order.status ?? "unknown");
  const settled = paymentStatus === "captured" && orderStatus === "paid";

  if (!settled) {
    return NextResponse.json(
      {
        verified: true,
        settled: false,
        paymentStatus,
        orderStatus,
        message:
          "Payment signature is valid but capture is not confirmed yet. Confirm status before granting access.",
      },
      { status: 202, headers: NO_STORE_HEADERS },
    );
  }

  const now = new Date();
  const periodEnd = addDays(now, SUBSCRIPTION_DURATION_DAYS).toISOString();

  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (existingSubscription?.id) {
    await supabase
      .from("subscriptions")
      .update({
        status: "active",
        plan_name: "pro_monthly",
        current_period_start: now.toISOString(),
        current_period_end: periodEnd,
        provider_payload: {
          order_id: orderId,
          payment_id: paymentId,
          payment_status: paymentStatus,
          order_status: orderStatus,
        },
      })
      .eq("id", existingSubscription.id);
  } else {
    await supabase.from("subscriptions").insert({
      user_id: session.user.id,
      plan_name: "pro_monthly",
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: periodEnd,
      provider_payload: {
        order_id: orderId,
        payment_id: paymentId,
        payment_status: paymentStatus,
        order_status: orderStatus,
      },
    });
  }

  return NextResponse.json(
    {
      verified: true,
      settled: true,
      paymentId,
      orderId,
      paymentStatus,
      orderStatus,
    },
    {
      headers: NO_STORE_HEADERS,
    },
  );
}
