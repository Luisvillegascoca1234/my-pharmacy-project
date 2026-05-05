import { z } from "zod";

export const HealthStatusSchema = z.object({
  status: z.literal("ok"),
  version: z.string().min(1),
  timestamp: z.string().datetime()
});

export type HealthStatus = z.infer<typeof HealthStatusSchema>;
