import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { env, isRazorpayConfigured } from "@/lib/env";
import { getSessionState } from "@/lib/session";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
};

const defaultPlan = {
  id: "pro_monthly",
  amount: 49900,
  currency: "INR",
  name: "TusharFitness Pro",
  description: "Monthly subscription for premium workouts and nutrition plans",
} as const;

type CheckoutRequestBody = {
  checkoutConfigId?: string;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getSessionState();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE_HEADERS });
  }

  const body = (await request.json().catch(() => ({}))) as CheckoutRequestBody;
  const runtimeCheckoutConfigId = body.checkoutConfigId?.trim();

  if (!isRazorpayConfigured) {
    return NextResponse.json(
      {
        mode: "demo",
        message:
          "Razorpay keys are not configured yet. Connect keys to activate live checkout.",
      },
      {
        headers: NO_STORE_HEADERS,
      },
    );
  }

  const razorpay = new Razorpay({
    key_id: env.razorpayKeyId!,
    key_secret: env.razorpayKeySecret!,
  });

  try {
    const receipt = `ff_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: defaultPlan.amount,
      currency: defaultPlan.currency,
      receipt,
      ...(runtimeCheckoutConfigId
        ? { checkout_config_id: runtimeCheckoutConfigId }
        : env.razorpayCheckoutConfigId
          ? { checkout_config_id: env.razorpayCheckoutConfigId }
          : {}),
      notes: {
        product: defaultPlan.name,
        plan: defaultPlan.id,
        user_id: session.user.id,
        username: session.user.username,
      },
    });

    return NextResponse.json(
      {
        mode: "live",
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        name: defaultPlan.name,
        description: defaultPlan.description,
        prefill: {
          name: session.user.name,
          email: session.user.email,
        },
        keyId: env.razorpayKeyId,
      },
      {
        headers: NO_STORE_HEADERS,
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Razorpay order creation failed.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }
}
