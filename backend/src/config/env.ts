import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://postgres:postgres@localhost:5432/pharmacy_pos?schema=public"),
  PORT: z.coerce.number().int().positive().default(4000),
  APP_VERSION: z.string().min(1).default("0.1.0"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173")
});

export const env = EnvSchema.parse(process.env);
