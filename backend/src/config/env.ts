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
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  JWT_SECRET: z.string().min(32).default("dev-only-auth-secret-change-before-production"),
  JWT_EXPIRES_IN: z.string().min(1).default("8h")
});

export const env = EnvSchema.parse(process.env);

process.env.DATABASE_URL ??= env.DATABASE_URL;
process.env.JWT_SECRET ??= env.JWT_SECRET;
process.env.JWT_EXPIRES_IN ??= env.JWT_EXPIRES_IN;
