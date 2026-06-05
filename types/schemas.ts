// types/schemas.ts
import { z } from 'zod';

// --- Shared Schemas ---
export const tokenUsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
  model: z.string(),
});

// --- Gemini Service Schemas ---
export const implementationTaskSchema = z.object({
  filePath: z.string(),
  description: z.string(),
  details: z.string().optional(),
  newContent: z.string().optional(),
});

export const geminiDevelopmentPlanResponseSchema = z.object({
  clarifyingQuestions: z.array(z.string()),
  architecturalProposal: z.string(),
  implementationTasks: z.array(implementationTaskSchema),
  testCases: z.array(z.string()),
  internalMonologue: z.string().optional(),
});