import { z } from "zod";

export const updateSettingsSchema = z.object({
  zaiToken: z.string().nullable().optional(),
  githubToken: z.string().nullable().optional(),
  e2bApiKey: z.string().nullable().optional(),
});

export type UpdateSettingsRequest = z.infer<typeof updateSettingsSchema>;

export interface SettingsResponse {
  zaiToken: string | null;
  githubToken: string | null;
  e2bApiKey: string | null;
}
