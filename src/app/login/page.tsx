import { signInWithEmailAction, signInWithGoogleAction } from "@/app/actions";
import { AuthShell } from "@/components/marketing/auth-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFirstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getLoginErrorMessage(error: string | undefined) {
  switch (error) {
    case "invalid_credentials":
      return "Email or password is incorrect. Please try again.";
    case "email_not_confirmed":
      return "Please verify your email address first, then login.";
    case "oauth_unavailable":
      return "Google login is not enabled in Supabase yet. Enable Google provider and retry.";
    case "oauth_failed":
      return "Google login failed. Please retry or use email and password.";
    case "oauth_redirect_missing":
      return "Google login did not return a redirect URL. Please retry.";
    case "supabase_unavailable":
      return "Supabase is not configured or unavailable. Check environment variables and retry.";
    default:
      return null;
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = getFirstQueryValue(params.error);
  const checkEmail = getFirstQueryValue(params["check-email"]);
  const errorMessage = getLoginErrorMessage(error);

  return (
    <AuthShell
      title="Welcome back"
      description="Continue your streak with instant Google access or secure email login. Your dashboard, analytics, and AI context resume where you left off."
      footerText="New here?"
      footerLinkLabel="Create your account"
      footerLinkHref="/signup"
    >
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge className="bg-(--accent-soft) text-foreground">Fast secure login</Badge>
        <Badge className="bg-(--primary-soft)">Google + Email auth</Badge>
      </div>

      {checkEmail === "1" ? (
        <div className="mb-4 rounded-2xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          Account created. Please verify your email, then log in.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mb-4 rounded-2xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {errorMessage}
        </div>
      ) : null}

      <form className="space-y-4" action={signInWithEmailAction}>
        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="login-email"
            name="email"
            type="email"
            placeholder="you@tusharfitness.app"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="login-password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="login-password"
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </div>
        <SubmitButton pendingLabel="Logging in..." className="w-full">
          Login to dashboard
        </SubmitButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <span className="h-px flex-1 bg-(--card-border)" />
        <span>or continue with</span>
        <span className="h-px flex-1 bg-(--card-border)" />
      </div>

      <form action={signInWithGoogleAction}>
        <input type="hidden" name="source" value="login" />
        <input type="hidden" name="next" value="/app/dashboard" />
        <Button type="submit" variant="outline" className="w-full">
          Continue with Google
        </Button>
      </form>

      <p className="mt-4 text-xs text-muted-foreground">
        Tip: If Google login fails, ensure Google provider is enabled in Supabase Auth settings.
      </p>
    </AuthShell>
  );
}
