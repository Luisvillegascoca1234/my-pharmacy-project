import type { CashSession, Prisma, Role, User } from "@prisma/client";

export type AuditContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export type CashSessionUserRecord = Pick<User, "id" | "fullName" | "email" | "status">;

export type CashSessionActorRecord = CashSessionUserRecord & {
  role: Pick<Role, "name">;
};

export type CashSessionWithUsers = CashSession & {
  openedByUser: CashSessionUserRecord;
  closedByUser: CashSessionUserRecord | null;
};

export type CashSessionListFilters = {
  fromDate?: string;
  openedByUserId?: string;
  page: number;
  pageSize: number;
  status?: CashSession["status"];
  toDate?: string;
};

export type CashSessionListResult = {
  data: CashSessionWithUsers[];
  total: number;
};

export type CashSessionCreateData = {
  correlativeNumber: number;
  correlativeCode: string;
  openedByUserId: string;
  initialAmount: Prisma.Decimal;
  expectedAmount: Prisma.Decimal;
  openingNote: string | null;
};

export type CashSessionCloseData = {
  closedByUserId: string;
  countedAmount: Prisma.Decimal;
  expectedAmount: Prisma.Decimal;
  differenceAmount: Prisma.Decimal;
  closingNote: string | null;
  closedAt: Date;
};
