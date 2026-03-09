import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(200, "Name cannot exceed 200 characters")
    .trim(),
  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .trim()
    .optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(200, "Name cannot exceed 200 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(2000, "Description cannot exceed 2000 characters")
    .trim()
    .optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
