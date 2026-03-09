import { z } from "zod";

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment cannot exceed 5000 characters")
    .trim(),
});

export const commentQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
