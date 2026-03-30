"use client";

import { useState } from "react";
import Script from "next/script";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OptionSelector } from "@/components/ui/option-selector";

const settingTabs = ["General", "Security", "Subscription", "Notifications", "Account"] as const;

type CheckoutResponse = {
  mode?: "demo" | "live";
  message?: string;
  error?: string;
  keyId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
};

type VerifyResponse = {
  verified?: boolean;
  settled?: boolean;
  error?: string;
  message?: string;
};

type RazorpayHandlerPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayPaymentFailedEvent = {
  error?: {
    description?: string;
    reason?: string;
  };
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (payload: RazorpayHandlerPayload) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (eventName: "payment.failed", callback: (event: RazorpayPaymentFailedEvent) => void) => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

const GOAL_OPTIONS = [
  { value: "Muscle Gain", label: "Muscle Gain" },
  { value: "Fat Loss", label: "Fat Loss" },
  { value: "Maintenance", label: "Maintenance" },
];

const DIET_PREFERENCE_OPTIONS = [
  { value: "High Protein", label: "High Protein" },
  { value: "Veg Only", label: "Veg Only" },
  { value: "Non-Veg", label: "Non-Veg" },
  { value: "Low Carb", label: "Low Carb" },
];

const THEME_OPTIONS = [
  { value: "System", label: "System" },
  { value: "Light", label: "Light" },
  { value: "Dark", label: "Dark" },
];

export function SettingsOverview() {
  const [activeTab, setActiveTab] = useState<(typeof settingTabs)[number]>("General");
  const [isCheckoutScriptLoaded, setIsCheckoutScriptLoaded] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);

  async function handleManageSubscription() {
    let checkoutOpened = false;
    setIsCheckoutLoading(true);
    setCheckoutMessage(null);

    try {
      const checkoutResponse = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const checkoutData = (await checkoutResponse.json()) as CheckoutResponse;

      if (!checkoutResponse.ok) {
        throw new Error(checkoutData.error ?? "Unable to start checkout.");
      }

      if (checkoutData.mode === "demo") {
        setCheckoutMessage(checkoutData.message ?? "Razorpay is not configured yet.");
        return;
      }

      if (!isCheckoutScriptLoaded) {
        throw new Error("Razorpay script is still loading. Please try again.");
      }

      const Razorpay = (window as Window & { Razorpay?: RazorpayConstructor }).Razorpay;

      if (!Razorpay) {
        throw new Error("Razorpay checkout is unavailable. Reload and try again.");
      }

      if (!checkoutData.keyId || !checkoutData.orderId || !checkoutData.amount || !checkoutData.currency) {
        throw new Error("Checkout data is incomplete. Please retry.");
      }

      const checkout = new Razorpay({
        key: checkoutData.keyId,
        amount: checkoutData.amount,
        currency: checkoutData.currency,
        name: checkoutData.name ?? "TusharFitness",
        description: checkoutData.description ?? "TusharFitness Pro subscription",
        order_id: checkoutData.orderId,
        prefill: checkoutData.prefill,
        notes: checkoutData.notes,
        theme: {
          color: "#f97316",
        },
        handler: async (payload) => {
          try {
            const verifyResponse = await fetch("/api/subscription/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            });

            const verifyData = (await verifyResponse.json()) as VerifyResponse;

            if (verifyData.verified && verifyData.settled) {
              setCheckoutMessage("Payment successful. Your subscription is now active.");
              return;
            }

            if (verifyData.verified && !verifyData.settled) {
              setCheckoutMessage(
                verifyData.message ??
                  "Payment signature is valid. We are waiting for capture confirmation.",
              );
              return;
            }

            throw new Error(verifyData.error ?? "Payment verification failed.");
          } catch (error) {
            setCheckoutMessage(
              error instanceof Error ? error.message : "Unable to verify payment at the moment.",
            );
          } finally {
            setIsCheckoutLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsCheckoutLoading(false);
            setCheckoutMessage((current) => current ?? "Checkout was closed before completing payment.");
          },
        },
      });

      checkout.on("payment.failed", (event) => {
        const reason =
          event.error?.description ?? event.error?.reason ?? "Payment failed. Please try a different method.";
        setCheckoutMessage(reason);
        setIsCheckoutLoading(false);
      });

      checkout.open();
      checkoutOpened = true;
    } catch (error) {
      setCheckoutMessage(error instanceof Error ? error.message : "Unable to start checkout.");
    } finally {
      if (!checkoutOpened) {
        setIsCheckoutLoading(false);
      }
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setIsCheckoutScriptLoaded(true)}
        onError={() => setCheckoutMessage("Could not load Razorpay checkout script. Please refresh.")}
      />

      <div className="space-y-6">
        <div>
          <Badge>Settings</Badge>
          <h1 className="mt-4 text-4xl font-bold tracking-tight">Clean categories for account, billing, preferences, and control.</h1>
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          <Card className="rounded-[34px] p-4">
            <div className="space-y-2">
              {settingTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`w-full rounded-[22px] px-4 py-3 text-left text-sm font-medium transition ${
                    activeTab === tab
                      ? "bg-foreground text-background"
                      : "hover:bg-(--primary-soft)"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </Card>

          <Card className="rounded-[34px] p-6">
            {activeTab === "General" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Display name</label>
                  <Input defaultValue="Vaibhav Singh" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Goal</label>
                  <OptionSelector
                    name="goal"
                    defaultValue="Muscle Gain"
                    options={GOAL_OPTIONS}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Diet preference</label>
                  <OptionSelector
                    name="dietPreference"
                    defaultValue="High Protein"
                    options={DIET_PREFERENCE_OPTIONS}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Theme preference</label>
                  <OptionSelector
                    name="themePreference"
                    defaultValue="System"
                    options={THEME_OPTIONS}
                  />
                </div>
              </div>
            ) : null}

            {activeTab === "Security" ? (
              <div className="space-y-4">
                <Input type="password" placeholder="Current password" />
                <Input type="password" placeholder="New password" />
                <Input type="password" placeholder="Confirm new password" />
              </div>
            ) : null}

            {activeTab === "Subscription" ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-(--card-border) bg-(--surface-strong) p-5">
                  <p className="text-sm text-muted-foreground">Current plan</p>
                  <p className="mt-2 text-2xl font-bold">Pro • Trial active</p>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Secure Standard Checkout is enabled with server-side order creation and signature verification.
                  </p>
                </div>

                {checkoutMessage ? (
                  <p className="rounded-[18px] border border-(--card-border) bg-(--surface-strong) px-4 py-3 text-sm text-muted-foreground">
                    {checkoutMessage}
                  </p>
                ) : null}

                <Button onClick={handleManageSubscription} disabled={isCheckoutLoading || !isCheckoutScriptLoaded}>
                  {isCheckoutLoading ? "Opening checkout..." : "Manage subscription"}
                </Button>
              </div>
            ) : null}

            {activeTab === "Notifications" ? (
              <div className="space-y-4">
                {["Workout reminders", "Meal reminders", "Referral updates", "Streak rescue nudges"].map((item) => (
                  <label
                    key={item}
                    className="flex items-center justify-between rounded-3xl border border-(--card-border) bg-(--surface-strong) px-4 py-4 text-sm"
                  >
                    {item}
                    <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
                  </label>
                ))}
              </div>
            ) : null}

            {activeTab === "Account" ? (
              <div className="space-y-4">
                <Button variant="outline">Download profile data</Button>
                <Button variant="outline">Redeem referral bonus</Button>
                <Button variant="ghost" className="text-(--danger)">
                  Delete account
                </Button>
              </div>
            ) : null}

            <div className="mt-6">
              <Button>Save changes</Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
