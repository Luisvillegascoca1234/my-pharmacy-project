import type { RoleName, UserStatus } from "@pharmacy-pos/shared";

export type InstitutionalRoleRecord = {
  createdAt: Date;
  displayName: string;
  id: string;
  name: RoleName;
  updatedAt: Date;
};

export type UserWithRole = {
  createdAt: Date;
  email: string;
  fullName: string;
  id: string;
  lastLoginAt: Date | null;
  passwordHash: string;
  role: InstitutionalRoleRecord;
  roleId: string;
  status: UserStatus;
  updatedAt: Date;
};

export type CreateUserRecord = {
  email: string;
  fullName: string;
  passwordHash: string;
  roleId: string;
  status: UserStatus;
};

export type UpdateUserRecord = {
  email?: string;
  fullName?: string;
  roleId?: string;
};

export type AuditContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export interface UsersRepositoryPort {
  countActiveSuperadmins(exceptUserId?: string): Promise<number>;
  createAuditLog(action: string, entityId: string, metadata: unknown, context: AuditContext): Promise<unknown>;
  createUser(input: CreateUserRecord): Promise<UserWithRole>;
  findRoleById(id: string): Promise<InstitutionalRoleRecord | null>;
  findUserByEmail(email: string, exceptId?: string): Promise<{ id: string } | null>;
  findUserById(id: string): Promise<UserWithRole | null>;
  listUsers(filters: { search?: string; roleId?: string; status?: UserStatus }): Promise<UserWithRole[]>;
  updatePassword(id: string, passwordHash: string): Promise<unknown>;
  updateUser(id: string, input: UpdateUserRecord): Promise<UserWithRole>;
  updateUserStatus(id: string, status: UserStatus): Promise<UserWithRole>;
}
