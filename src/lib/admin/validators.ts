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

const mediaUrlSchema = z
  .string()
  .trim()
  .regex(/^(https?:\/\/|\/).+/, "Use an absolute URL or app-relative path starting with /");

export const exerciseLibraryCreateSchema = z.object({
  name: z.string().trim().min(3).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{2,96}$/),
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
  imageUrl: mediaUrlSchema,
  videoUrl: mediaUrlSchema.optional().or(z.literal("")),
  targetMuscle: z.string().trim().min(2).max(120),
  equipment: z.string().trim().min(2).max(120),
  difficulty: z.string().trim().min(2).max(40).default("moderate"),
  shortFormCue: z.string().trim().max(400).optional().default(""),
  sets: z.string().trim().min(1).max(40),
  reps: z.string().trim().min(1).max(40),
  restSeconds: z.coerce.number().int().min(0).max(36000).optional().default(0),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  instructions: z.array(z.string().trim().min(1)).min(1),
  formCues: z.array(z.string().trim().min(1)).min(1),
  commonMistakes: z.array(z.string().trim().min(1)).optional().default([]),
  optionalNotes: z.string().trim().max(2000).optional().default(""),
});

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{2,96}$/);

const nullableWeeksSchema = z.union([
  z.coerce.number().int().min(1).max(260),
  z.literal(""),
]).transform((value) => (value === "" ? null : value));

const durationMinutesSchema = z.coerce.number().int().min(1).max(1440);

export const workoutProgramUploadSchema = z.object({
  title: z.string().trim().min(3).max(140),
  slug: slugSchema,
  goalSlug: slugSchema.optional().or(z.literal("")),
  bodyPartSlug: slugSchema.optional().or(z.literal("")),
  goal: z.string().trim().min(2).max(120),
  bodyPart: z.string().trim().min(2).max(120),
  goalType: slugSchema,
  difficulty: z.string().trim().min(2).max(80),
  level: z.string().trim().max(80).optional().default(""),
  durationMinutes: durationMinutesSchema,
  durationWeeks: nullableWeeksSchema,
  description: z.string().trim().max(2000).optional().default(""),
  thumbnailUrl: mediaUrlSchema.optional().or(z.literal("")),
  status: statusSchema.default("draft"),
  exerciseName: z.string().trim().min(3).max(140),
  targetMuscle: z.string().trim().min(2).max(120),
  equipment: z.string().trim().min(2).max(120),
  motion: z.string().trim().max(120).optional().default(""),
  formCue: z.string().trim().max(400).optional().default(""),
  position: z.coerce.number().int().min(0).max(999).default(0),
  durationSeconds: z.coerce.number().int().min(0).max(36000).optional().default(0),
  restSeconds: z.coerce.number().int().min(0).max(36000).optional().default(0),
  mediaUrl: mediaUrlSchema.optional().or(z.literal("")),
  sets: z.string().trim().min(1).max(40),
  reps: z.string().trim().min(1).max(40),
  instructions: z.string().trim().max(4000).optional().default(""),
  formCues: z.string().trim().max(4000).optional().default(""),
  commonMistakes: z.string().trim().max(4000).optional().default(""),
  cautions: z.string().trim().max(2000).optional().default(""),
  progressionNotes: z.string().trim().max(2000).optional().default(""),
  optionalNotes: z.string().trim().max(2000).optional().default(""),
});
