# TusharFitness Startup SaaS

Production-ready fitness SaaS starter focused on Indian users, built with Next.js App Router and Supabase.

This project ships with:

- Auth flows (email/password + Google OAuth)
- Onboarding and profile personalization
- Protected user app shell
- Workout catalog with goal/body-part filtering
- Nutrition, analytics, profile, settings surfaces
- Admin panel with workout media upload pipeline
- Groq-powered AI assistant API
- Razorpay checkout + payment verification endpoints
- Referral rewards + gamification hooks (XP, streak metadata)

## Table of Contents

- [What This SaaS Includes](#what-this-saas-includes)
- [Tech Stack](#tech-stack)
- [Product Flows](#product-flows)
- [Route Map](#route-map)
- [API Surface](#api-surface)
- [Database and Supabase Model](#database-and-supabase-model)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Deployment Guide](#deployment-guide)
- [Deployment Smoke Tests](#deployment-smoke-tests)
- [Project Structure](#project-structure)
- [Operational Notes](#operational-notes)
- [Troubleshooting](#troubleshooting)

## What This SaaS Includes

### User-facing experience

- Smart entry flow: `/` redirects to `/app`, then routes to login/onboarding/dashboard based on auth state.
- Account creation with username checks and suggestions.
- Onboarding to collect body metrics, goal, diet preferences, and activity profile.
- Fitness command center:
	- Dashboard summary
	- Workout catalog and exercise detail surfaces
	- Fuel (diet) browser
	- Analytics logging and trend visualization
	- Profile page by username
	- Settings
- AI assistant route for workout/nutrition guidance with safety constraints.

### Business/admin experience

- Admin-only route group (`/app/admin/*`) with dashboard, users, workouts, media, subscriptions, payments, and analytics management pages.
- Role-based admin access via `admin_users` table (`is_active = true`).
- Admin workout media upload API with storage bucket auto-recovery.

### Monetization and growth

- Razorpay order creation endpoint (`/api/subscription/checkout`).
- Razorpay signature verification + subscription activation endpoint (`/api/subscription/verify`).
- Referral redemption endpoint with reward distribution:
	- trial extension
	- XP grant for inviter and invited user.

## Tech Stack

### Frontend

- Next.js `16.2.1` (App Router)
- React `19`
- TypeScript `5`
- Tailwind CSS `4`
- Framer Motion
- Recharts
- Radix Slot + custom UI primitives

### Backend/integrations

- Supabase Auth + Postgres + Storage
- Groq SDK for AI assistant responses
- Razorpay for checkout and payment verification

### Tooling

- ESLint 9 + `eslint-config-next`
- PostCSS + Tailwind pipeline

## Product Flows

### Authentication and access

1. Middleware refreshes Supabase session on matched routes (`/app/*`, `/login`, `/signup`).
2. Unauthenticated users trying to access `/app/*` are redirected to `/login`.
3. Authenticated users visiting `/login` or `/signup` are redirected:
	 - admin users -> `/app/admin/dashboard`
	 - regular users -> `/app/dashboard`.

### Onboarding and profile creation

- After signup, users are directed to `/app/onboarding`.
- Onboarding persists profile information such as username, age, height/weight, goals, diet type, and activity level.
- Non-admin users cannot access protected app pages until onboarding is complete.

### Subscription and feature access

- `getSessionState` computes `accessActive` from subscription state and fallback trial logic.
- Protected layout redirects to `/signup` when access is inactive.
- Subscription verify route marks subscription active for successful captured/paid Razorpay transactions.

### Workout catalog flow

- Catalog data comes from `workout_exercises` and taxonomy specs.
- Goal/body-part/exercise selections are resolved server-side in `/api/workouts/catalog`.
- Video playback URLs are generated via signed URL endpoint (`/api/workouts/video-url`) for private storage objects.

## Route Map

### Public routes

- `/` -> redirects to `/app`
- `/login`
- `/signup`
- `/auth/callback` (route handler for OAuth exchange)

### App routes

- `/app` (session-aware redirect gateway)
- `/app/onboarding`

### Protected user routes

- `/app/dashboard`
- `/app/workouts`
- `/app/workouts/exercises`
- `/app/workouts/[exerciseSlug]`
- `/app/fuel`
- `/app/analytics`
- `/app/bmi-calculator`
- `/app/profile/[username]`
- `/app/settings`

### Protected admin routes

- `/app/admin`
- `/app/admin/dashboard`
- `/app/admin/users`
- `/app/admin/subscriptions`
- `/app/admin/payments`
- `/app/admin/analytics`
- `/app/admin/workouts`
- `/app/admin/exercise-library`
- `/app/admin/diet-plans`
- `/app/admin/categories`
- `/app/admin/announcements`
- `/app/admin/media`
- `/app/admin/settings`
- `/app/admin/profile/[username]`

## API Surface

All API handlers live under `src/app/api/*` (except auth callback under `src/app/auth/callback/route.ts`).

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/ai/chat` | Required | Stores and returns AI chat responses using Groq with safety prompt rules. |
| `GET` | `/api/username/check` | Public | Username normalization + availability lookup + suggestions. |
| `GET` | `/api/workouts/catalog` | Required | Returns filtered workout goals/body parts/exercises and selected state. |
| `POST` | `/api/workouts/video-url` | Required | Returns signed playback URL for private video storage path. |
| `GET` | `/api/analytics/logs` | Required | Returns weight, strength, and measurement analytics aggregates. |
| `POST` | `/api/analytics/logs` | Required | Creates weight/strength/measurement log entries. |
| `POST` | `/api/subscription/checkout` | Required | Creates Razorpay order; returns demo mode if keys are missing. |
| `POST` | `/api/subscription/verify` | Required | Verifies Razorpay signature and activates/updates subscription window. |
| `POST` | `/api/referral/redeem` | Required | Applies referral code and awards XP + trial extension for both users. |
| `POST` | `/api/admin/workouts/upload-media` | Admin | Uploads workout image/video to Supabase Storage. |
| `DELETE` | `/api/admin/workouts/upload-media` | Admin | Deletes uploaded storage object path. |

## Database and Supabase Model

### Migration files

Apply in order:

1. `supabase/migrations/0001_tusharfitness_schema.sql`
2. `supabase/migrations/0002_workout_exercises_only_consistency.sql`
3. `supabase/migrations/0003_workout_exercises_add_forearms_body_part.sql`
4. `supabase/migrations/0004_workout_exercises_add_video_path.sql`
5. `supabase/migrations/0005_workout_exercises_drop_legacy_video_url.sql`

Optional admin bootstrap seed:

- `supabase/seeds/create_admin_user.sql`

### Table domains (from `supabase/schemas/*`)

- Identity and access: `profiles`, `admin_users`, `user_preferences`
- Subscription and billing: `subscriptions`, `payments`, `billing_events`, `pricing_plans`, `coupons`
- Workout and training: `workout_exercises`, `workout_days`, `workout_completions`, `categories`
- Nutrition: `diet_plans`, `diet_meals`, `diet_completions`
- Progress logs: `weight_logs`, `strength_logs`, `measurement_logs`
- Engagement and growth: `referrals`, `gamification_state`, `xp_events`, `user_assignments`
- AI: `ai_chat_sessions`, `ai_chat_messages`
- Content and operations: `announcements`, `media_files`, `admin_activity_logs`

### Auth provider setup

In Supabase Auth settings:

- Enable Email provider
- Enable Google provider (if social login is needed)
- Add redirect URL: `<your-app-url>/auth/callback`

## Environment Variables

Copy `.env.example` to `.env.local` at the project root and fill in values.

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_CHECKOUT_CONFIG_ID=
```

### Variable reference

| Variable | Required | Used For |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Yes | OAuth callback and app URL generation. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | SSR/server client auth context. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes for admin/storage ops | Admin queries, signed video URLs, admin uploads. |
| `SUPABASE_DB_URL` | Optional | External DB tooling/migrations. |
| `GROQ_API_KEY` | Optional for AI | Enables `/api/ai/chat` live completion. |
| `GROQ_MODEL` | Optional | Overrides default model. |
| `RAZORPAY_KEY_ID` | Optional for billing | Enables live checkout order creation. |
| `RAZORPAY_KEY_SECRET` | Optional for billing | Enables payment signature verification. |
| `RAZORPAY_CHECKOUT_CONFIG_ID` | Optional | Runtime checkout config pass-through for Razorpay orders. |

Security hardening:

- Never commit secrets. Keep them only in `.env.local` (local dev) and Vercel Environment Variables (cloud).
- This repo ignores `.env*` by default; if a secret file was ever tracked before, remove it from git tracking:

```bash
git rm --cached .env
```

- Rotate any leaked production credentials immediately (Supabase service role key, Razorpay key secret, AI provider keys).

Vercel URL fallback behavior:

- If `NEXT_PUBLIC_APP_URL` is not set, the app automatically falls back to `VERCEL_PROJECT_PRODUCTION_URL`, then `VERCEL_URL`, and finally `http://localhost:3000`.
- For production, still set `NEXT_PUBLIC_APP_URL` to your canonical domain.

## Local Development Setup

### Prerequisites

- Node.js 20+ (recommended)
- npm
- Supabase project (for auth/database-backed flows)

### Steps

1. Install dependencies:

	 ```bash
	 npm install
	 ```

2. Create `.env.local` and set variables from the section above.

3. Run the app:

	 ```bash
	 npm run dev
	 ```

4. Open `http://localhost:3000`.

### Optional quality checks

```bash
npm run lint
npm run build
```

## Deployment Guide

Recommended target: Vercel.

### Pre-deploy checks

1. Confirm local quality gates pass:

```bash
npm run lint
npm run build
```

2. Apply all production migrations in order:
	- `supabase/migrations/0001_tusharfitness_schema.sql`
	- `supabase/migrations/0002_workout_exercises_only_consistency.sql`
	- `supabase/migrations/0003_workout_exercises_add_forearms_body_part.sql`
	- `supabase/migrations/0004_workout_exercises_add_video_path.sql`
	- `supabase/migrations/0005_workout_exercises_drop_legacy_video_url.sql`
3. Ensure Supabase storage buckets exist:
	- `images` (public)
	- `videos` (private)
4. Set/rotate production secrets before first public rollout.

### Vercel project setup

1. Import the repository in Vercel.
2. Framework preset: Next.js.
3. Keep default build settings (`next build`, output `.next`).
4. Set environment variables for all scopes needed:
	- Production: real keys and canonical `NEXT_PUBLIC_APP_URL`.
	- Preview: safe test keys (or leave optional integrations unset).
	- Development (optional): align with local values.

### Supabase auth and domain setup

1. Add all environment variables in Vercel project settings.
2. Set production `NEXT_PUBLIC_APP_URL` to your live domain.
3. Configure Supabase redirect URLs to include:
   - `<live-domain>/auth/callback`
   - `<project>.vercel.app/auth/callback` (optional for preview sign-in)
4. Enable Email provider and Google provider (if social login is needed).

### Deploy and verify

1. Create a preview deploy from your branch.
2. Run the smoke test against preview URL:

```bash
npm run smoke:deploy -- --url https://<preview-url>.vercel.app
```

3. If preview passes, promote to production.
4. Run smoke checks again against production.
5. Seed/admin bootstrap as needed (`supabase/seeds/create_admin_user.sql`).

### Runtime notes for Vercel functions

- Payment and media upload routes run on Node.js runtime by design.
- Some API routes may run on Edge/default runtime where supported.
- This mix is expected on Vercel and does not require `vercel.json` for this project.

## Deployment Smoke Tests

This project includes a lightweight smoke runner at `scripts/smoke-tests.mjs`.

Default unauthenticated deep checks verify:

- Public route behavior (`/`, `/login`, `/signup`, `/auth/callback`).
- Username API positive and negative values (`value` present, missing, and special chars).
- Protected app redirect behavior without session.
- All protected APIs reject unauthenticated access without 5xx failures.

Run against a deployment URL:

```bash
npm run smoke:deploy -- --url https://<deployment-url>.vercel.app
```

Optional flags:

- `--timeout 20000` to increase request timeout (ms).
- `--session-cookie "sb-..."` to run authenticated deep checks.
- `--admin-session-cookie "sb-..."` to run admin payload validation checks.
- `--video-path "workouts/videos/example.mp4"` to run signed video URL positive check.
- `--verbose` to print completion summary.

Authenticated mode includes positive and negative checks for:

- AI chat (`GET` contract, invalid payload, valid payload behavior).
- Analytics (`GET` contract, invalid payload rejection).
- Workout catalog (normal and invalid slug values).
- Subscription (`checkout` contract and `verify` invalid payload behavior).
- Referral invalid payload behavior.
- Admin endpoint access restrictions for non-admin sessions.

## Project Structure

```text
src/
	app/
		actions.ts                      # Server actions for auth and onboarding flows
		api/                            # Route handlers (AI, billing, workouts, analytics, admin upload)
		auth/callback/route.ts          # OAuth callback exchange
		app/                            # Main app entry + protected route groups
		login/ signup/                  # Public auth pages
	components/
		admin/                          # Admin UI blocks
		analytics/ dashboard/ fuel/     # Main app feature UIs
		layout/ marketing/ providers/   # Shell and shared providers
		workouts/                       # Workout browsing and exercise UI
	lib/
		session.ts                      # Unified session + access state composition
		gamification.ts                 # XP/level title mapping
		workout-taxonomy.ts             # Goal/body-part taxonomy and metadata
		supabase/                       # SSR/admin clients, middleware helpers, domain data helpers
supabase/
	migrations/                       # Ordered SQL migrations
	schemas/                          # Per-table SQL definitions
	seeds/                            # Seed/bootstrap scripts
```

## Operational Notes

- Middleware is the authoritative place for Supabase session refresh and auth cookie sync.
- AI responses are intentionally constrained to avoid medical diagnosis behavior.
- Checkout endpoint supports a safe demo mode when Razorpay keys are missing.
- Admin upload endpoint auto-attempts bucket creation when storage bucket is missing.
- Workout videos are served through signed URLs instead of public direct links.

## Troubleshooting

### Problem: Login loops or stale auth state

- Confirm Supabase URL/key values are set.
- Check callback URL and provider settings in Supabase.
- Ensure middleware is running on `/app/*`, `/login`, and `/signup`.

### Problem: OAuth callback fails

- Validate `NEXT_PUBLIC_APP_URL` matches your current origin.
- Confirm `<app-url>/auth/callback` is whitelisted in Supabase Auth settings.

### Problem: Checkout returns demo response

- Set both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- Optionally set `RAZORPAY_CHECKOUT_CONFIG_ID` for checkout config support.

### Problem: Workout video fails to load

- Ensure `SUPABASE_SERVICE_ROLE_KEY` is present for signed URL generation.
- Confirm the object path exists in `videos` bucket and user is authenticated.

### Problem: Admin upload fails with bucket error

- Endpoint attempts auto-create, but verify service-role credentials and storage permissions.
- Confirm `images`/`videos` bucket creation is allowed in the target environment.

## License

No license file is currently included in this repository. Add one if you plan to distribute the project publicly.
