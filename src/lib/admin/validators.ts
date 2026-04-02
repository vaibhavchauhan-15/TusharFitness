import { z } from "zod";

export const statusSchema = z.enum(["draft", "published", "archived"]);

export const accountStatusSchema = z.enum(["active", "suspended", "invited"]);

export const categoryCreateSchema = z.object({
  type: z.enum(["diet", "workout", "content", "media", "general"]),
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{2,96}$/),
  description: z.string().trim().max(240).optional().default(""),
});

export const announcementCreateSchema = z.object({
  title: z.string().trim().min(3).max(140),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{2,96}$/),
  excerpt: z.string().trim().max(220).optional().default(""),
  body: z.string().trim().min(12),
  targetAudience: z.string().trim().min(2).max(64).default("all"),
  status: statusSchema.default("draft"),
});

export const pricingPlanCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{2,64}$/),
  description: z.string().trim().max(240).optional().default(""),
  price: z.coerce.number().nonnegative(),
  currency: z.string().trim().length(3).toUpperCase().default("INR"),
  interval: z.enum(["month", "year", "quarter", "lifetime"]).default("month"),
  trialDays: z.coerce.number().int().nonnegative().default(0),
});

const publicMediaUrlSchema = z
  .string()
  .trim()
  .regex(/^https?:\/\/.+/, "Upload media to Supabase storage first.");

const storagePathSchema = z
  .string()
  .trim()
  .regex(
    /^[a-zA-Z0-9][a-zA-Z0-9/_\-.]*$/,
    "Use a storage object path like workouts/exercises/jump-squat.mp4",
  );

export const exerciseLibraryCreateSchema = z.object({
  title: z.string().trim().min(3).max(120),
  goalSlug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{2,96}$/),
  bodyPartSlug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{2,96}$/),
  thumbnailUrl: publicMediaUrlSchema,
  videoPath: storagePathSchema.optional().or(z.literal("")),
  targetMuscle: z.string().trim().min(2).max(120),
  equipment: z.string().trim().min(2).max(120),
  difficulty: z.string().trim().min(2).max(40).default("moderate"),
  sets: z.string().trim().min(1).max(40),
  reps: z.string().trim().min(1).max(40),
  restSeconds: z.coerce.number().int().min(0).max(36000).optional().default(0),
  instructions: z.array(z.string().trim().min(1)).min(1),
  formCues: z.array(z.string().trim().min(1)).min(1),
  commonMistakes: z.array(z.string().trim().min(1)).optional().default([]),
});

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{2,96}$/);

export const workoutProgramUploadSchema = z.object({
  title: z.string().trim().min(3).max(140),
  goalSlug: slugSchema,
  bodyPartSlug: slugSchema,
  difficulty: z.string().trim().min(2).max(80),
  thumbnailUrl: publicMediaUrlSchema,
  targetMuscle: z.string().trim().min(2).max(120),
  equipment: z.string().trim().min(2).max(120),
  restSeconds: z.coerce.number().int().min(0).max(36000).optional().default(0),
  videoPath: storagePathSchema.optional().or(z.literal("")),
  sets: z.string().trim().min(1).max(40),
  reps: z.string().trim().min(1).max(40),
  instructions: z.string().trim().max(4000).optional().default(""),
  formCues: z.string().trim().max(4000).optional().default(""),
  commonMistakes: z.string().trim().max(4000).optional().default(""),
});
