import { z } from "zod";

export const BrandProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().optional(),
  website: z.string().url("Invalid URL").optional(),
  description: z.string().optional(),
});

export const InfluencerProfileSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  bio: z.string().optional(),
  website: z.string().url("Invalid URL").optional(),
  instagramUrl: z.string().url("Invalid URL").optional(),
  youtubeUrl: z.string().url("Invalid URL").optional(),
  tiktokUrl: z.string().url("Invalid URL").optional(),
  followersCount: z
    .number()
    .int("Followers count must be an integer")
    .nonnegative("Followers count must be non-negative")
    .optional(),
});

export type BrandProfileSchemaType = z.infer<typeof BrandProfileSchema>;
export type InfluencerProfileSchemaType = z.infer<typeof InfluencerProfileSchema>;
