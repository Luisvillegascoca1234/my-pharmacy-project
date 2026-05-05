import { z } from "zod";

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthenticatedUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  status: z.enum(["active", "inactive"]),
  role: z.object({
    id: z.string(),
    name: z.string(),
    displayName: z.string()
  }),
  permissions: z.array(z.string())
});

export type AuthenticatedUser = z.infer<typeof AuthenticatedUserSchema>;

export const AuthSessionSchema = z.object({
  token: z.string().min(1),
  user: AuthenticatedUserSchema
});

export type AuthSession = z.infer<typeof AuthSessionSchema>;
