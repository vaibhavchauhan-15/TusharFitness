import { AuthShell } from "@/components/marketing/auth-shell";
import { SignupForm } from "@/components/marketing/signup-form";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type SignupPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getSignupErrorMessage(error: string | undefined) {
  switch (error) {
    case "username_taken":
      return "That username is already in use. Try one of the suggested handles.";
    case "oauth_unavailable":
      return "Google signup is not enabled in Supabase yet. Enable Google provider and retry.";
    case "oauth_failed":
      return "Google signup failed. Please retry or use email signup.";
    case "oauth_redirect_missing":
      return "Google signup did not return a redirect URL. Please retry.";
    case "user_exists":
      return "This email is already registered. Try logging in instead.";
    case "weak_password":
      return "Password is too weak. Use at least 8 characters with a mix of letters and numbers.";
    case "invalid_email":
      return "Please enter a valid email address.";
    case "signup_failed":
      return "Signup failed. Please retry in a moment.";
    case "supabase_unavailable":
      return "Supabase is not configured or unavailable. Check environment variables and retry.";
    default:
      return null;
  }
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const error = getFirstQueryValue(params.error);
  const username = getFirstQueryValue(params.username);
  const rawSuggestions = getFirstQueryValue(params.suggestions);
  const initialSuggestions = rawSuggestions
    ? rawSuggestions
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter((item, index, all) => item && all.indexOf(item) === index)
    : [];
  const errorMessage = getSignupErrorMessage(error);

  return (
    <AuthShell
      title="Start your free trial"
      description="Build your command profile in one go: claim a unique username, launch your free trial, and unlock personalized onboarding instantly."
      footerText="Already have an account?"
      footerLinkLabel="Login"
      footerLinkHref="/login"
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge className="bg-(--primary-soft)">7-day trial starts now</Badge>
        <Badge className="bg-(--accent-soft) text-foreground">Live username checker</Badge>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {errorMessage}
        </div>
      ) : null}

      <SignupForm initialUsername={username ?? ""} initialSuggestions={initialSuggestions} />
    </AuthShell>
  );
}
