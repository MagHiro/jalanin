import { z } from "zod";

export const applicationRequestSchema = z.object({
  internshipId: z.string().uuid(),
  values: z.record(z.unknown()),
});

export const submissionRequestSchema = applicationRequestSchema.extend({
  idempotencyKey: z.string().min(1).max(160).regex(/^[^\u0000-\u001f\u007f]+$/).optional(),
});
