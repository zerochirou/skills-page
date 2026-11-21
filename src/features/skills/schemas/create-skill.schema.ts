import { z } from "zod";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const unitInputSchema = z.object({
  title: z.string().trim().min(1, "Unit title is required").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Unit slug is required")
    .max(120)
    .regex(SLUG_REGEX, "Slug must be lowercase alphanumeric with hyphens"),
  unitType: z.enum(["page", "reference", "guide"]),
  estimatedMinutes: z
    .number()
    .int()
    .min(1)
    .max(600)
    .nullable()
    .optional(),
  isPublished: z.boolean(),
  content: z.string(),
});

export const subSkillInputSchema = z.object({
  title: z.string().trim().min(1, "Sub-skill title is required").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Sub-skill slug is required")
    .max(120)
    .regex(SLUG_REGEX, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().trim().max(280).optional(),
  units: z.array(unitInputSchema),
});

export const createSkillSchema = z.object({
  title: z.string().trim().min(2, "Skill title must be at least 2 characters").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Skill slug must be at least 2 characters")
    .max(120)
    .regex(SLUG_REGEX, "Slug must be lowercase alphanumeric with hyphens"),
  summary: z.string().trim().max(280).optional(),
  bannerImage: z
    .string()
    .trim()
    .url("Banner image must be a valid URL")
    .max(500)
    .optional(),
  visibility: z.enum(["public", "private"]),
  status: z.enum(["draft", "published", "archived"]),
  overview: z.string().optional(),
  subSkills: z.array(subSkillInputSchema).optional().default([]),
});

export type UnitInput = z.infer<typeof unitInputSchema>;
export type SubSkillInput = z.infer<typeof subSkillInputSchema>;
export type CreateSkillInput = z.infer<typeof createSkillSchema>;
