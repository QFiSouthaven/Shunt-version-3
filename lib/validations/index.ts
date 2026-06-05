import { z } from 'zod';

// --- Workspace Schemas ---
export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  similarityThreshold: z.number().min(0).max(1).optional(),
  openAiTemp: z.number().min(0).max(2).optional(),
  openAiHistory: z.number().int().min(0).optional(),
  openAiPrompt: z.string().optional(),
  queryRefusalResponse: z.string().optional(),
  chatMode: z.enum(['chat', 'query']).optional(),
  topN: z.number().int().min(1).optional(),
});

// --- Chat Schemas ---
export const chatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  mode: z.enum(['query', 'chat']),
  sessionId: z.string().optional(),
  reset: z.boolean().optional(),
  attachments: z.array(
    z.object({
      name: z.string(),
      mime: z.string(),
      contentString: z.string(), // Base64 string
    })
  ).optional(),
});

// --- Document Schemas ---
// Note: File uploads are handled via FormData, so we validate the metadata mostly
export const documentMetadataSchema = z.object({
  addToWorkspaces: z.string().optional(), // comma-separated slugs
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;