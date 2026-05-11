import { z } from "zod";

const optionalText = z.string().trim().optional().nullable().transform((value) => value || undefined);
const password = z.string().min(6).max(128);

export const UserStatusSchema = z.enum(["active", "inactive", "blocked"]);
export type UserStatus = z.infer<typeof UserStatusSchema>;

export const UserRoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string()
});

export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  roleId: z.string(),
  role: UserRoleSchema,
  permissions: z.array(z.string()).default([]),
  status: UserStatusSchema,
  lastLoginAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type User = z.infer<typeof UserSchema>;

export const UsersQuerySchema = z.object({
  search: optionalText,
  roleId: optionalText,
  status: UserStatusSchema.optional()
});

export type UsersQuery = z.infer<typeof UsersQuerySchema>;

export const CreateUserSchema = z.object({
  email: z.string().trim().email(),
  fullName: z.string().trim().min(2).max(160),
  roleId: z.string().min(1),
  password
});

export type CreateUser = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  email: z.string().trim().email().optional(),
  fullName: z.string().trim().min(2).max(160).optional(),
  roleId: z.string().min(1).optional()
});

export type UpdateUser = z.infer<typeof UpdateUserSchema>;

export const UpdateUserStatusSchema = z.object({
  status: UserStatusSchema
});

export type UpdateUserStatus = z.infer<typeof UpdateUserStatusSchema>;

export const ResetUserPasswordSchema = z
  .object({
    password,
    confirmPassword: password
  })
  .refine((input) => input.password === input.confirmPassword, {
    message: "Passwords must match.",
    path: ["confirmPassword"]
  });

export type ResetUserPassword = z.infer<typeof ResetUserPasswordSchema>;
