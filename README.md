# TusharFitness Startup SaaS

Startup-grade fitness SaaS built with:

- Next.js App Router
- Supabase Auth + database scaffolding
- Razorpay subscription endpoint scaffold
- Groq-powered AI assistant route
- Vercel-ready deployment structure
- Orange-first light/dark design system

## Included Startup Surfaces

- Direct app entry routing (`/` -> `/app`)
- Login + signup with Google/email auth
- Post-signup onboarding
- Protected SaaS shell with collapsible sidebar
- Dashboard, workouts, diet plans, analytics, profile, and settings
- Floating AI assistant
- Streak / XP / levels / badges
- Referral reward endpoint scaffold

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in any integrations you want live.

3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (optional fallback for anon key)
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SECRET_KEY` (optional fallback for service role key)
- `SUPABASE_DB_URL` (used for migrations/DB tooling)
- `GROQ_API_KEY`
- `GROQ_MODEL`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

If these are not configured, auth-backed features will not work until environment variables are set.

## Supabase

- SQL schema scaffold lives in the initial file under `supabase/migrations/`
- Apply the migration in your Supabase project to enable live profile, onboarding, and session database persistence
- Apply `supabase/migrations/0003_workout_visual_catalog.sql` to enable the new visual workout flow schema (goals, body parts, exercise library)
- Run `supabase/seeds/workout_catalog_seed.sql` after migrations to populate image-linked workout catalog data
- Enable email/password and Google auth providers in Supabase Auth settings
- Add the callback URL `<app-url>/auth/callback` in Supabase Auth redirect URLs

## Deployment

- Recommended host: Vercel
- Add env vars in Vercel project settings
- Configure Supabase auth callback URL to `/auth/callback`
- Replace the placeholder Razorpay plan id in `src/app/api/subscription/checkout/route.ts`

## Notes

- AI responses are guarded to avoid medical diagnosis claims
- Workout visual catalog content is seeded from `supabase/seeds/workout_catalog_seed.sql`
- The current build intentionally favors a high-quality front-end shell with integration-ready server boundaries
