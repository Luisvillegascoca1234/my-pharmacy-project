import { z } from "zod";
import { RoleNameSchema } from "./role-catalog.schema.js";
import { UserStatusSchema } from "./user.schema.js";

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthenticatedUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  status: UserStatusSchema,
  role: z
    .object({
      id: z.string(),
      name: RoleNameSchema,
      displayName: z.string()
    })
    .strict()
}).strict();

export type AuthenticatedUser = z.infer<typeof AuthenticatedUserSchema>;

export const AuthSessionSchema = z.object({
  token: z.string().min(1),
  user: AuthenticatedUserSchema
}).strict();

export type AuthSession = z.infer<typeof AuthSessionSchema>;
