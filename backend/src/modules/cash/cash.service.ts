import { Prisma } from "@prisma/client";
import type {
  CashSession,
  CashSessionsListResponse,
  CashSessionsQuery,
  CloseCashSession,
  CurrentCashSession,
  OpenCashSession,
  SupervisableCashSession
} from "@pharmacy-pos/shared";
import { CashSessionSchema, CurrentCashSessionSchema } from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { CashSessionsRepository } from "./cash.repository.js";
import type {
  AuditContext,
  CashSessionActorRecord,
  CashSessionListFilters,
  CashSessionListResult,
  CashSessionWithUsers
} from "./cash.types.js";

const CASH_SESSION_CORRELATIVE_PREFIX = "C";
const CASH_SESSION_CORRELATIVE_DIGITS = 6;
const ADMIN_ROLE_NAMES = new Set(["admin", "superadmin"]);

export type CashSessionsRepositoryPort = {
  runInTransaction<T>(callback: (client: Prisma.TransactionClient) => Promise<T>): Promise<T>;
  listCashSessions(filters: CashSessionListFilters, client?: Prisma.TransactionClient): Promise<CashSessionListResult>;
  findUserById(id: string, client?: Prisma.TransactionClient): Promise<CashSessionActorRecord | null>;
  findCashSessionById(id: string, client?: Prisma.TransactionClient): Promise<CashSessionWithUsers | null>;
  findOpenCashSessionByUserId(userId: string, client?: Prisma.TransactionClient): Promise<CashSessionWithUsers | null>;
  getNextCashSessionCorrelativeNumber(client?: Prisma.TransactionClient): Promise<number>;
  createOpenCashSession(
    input: {
      correlativeNumber: number;
      correlativeCode: string;
      openedByUserId: string;
      initialAmount: Prisma.Decimal;
      expectedAmount: Prisma.Decimal;
      openingNote: string | null;
    },
    client?: Prisma.TransactionClient
  ): Promise<CashSessionWithUsers>;
  closeCashSession(
    id: string,
    input: {
      closedByUserId: string;
      countedAmount: Prisma.Decimal;
      expectedAmount: Prisma.Decimal;
      differenceAmount: Prisma.Decimal;
      closingNote: string | null;
      closedAt: Date;
    },
    client?: Prisma.TransactionClient
  ): Promise<CashSessionWithUsers>;
  createAuditLog(
    action: string,
    entityId: string,
    metadata: unknown,
    context: AuditContext,
    client?: Prisma.TransactionClient
  ): Promise<unknown>;
};

type CashSessionContext = AuditContext & {
  actorRoleName?: string;
};

export class CashSessionsService {
  constructor(private readonly cashSessionsRepository: CashSessionsRepositoryPort = new CashSessionsRepository()) {}

  async listCashSessions(query: CashSessionsQuery, context: CashSessionContext): Promise<CashSessionsListResponse> {
    const actorUserId = this.getAuthenticatedUserId(context, "list cash sessions");
    const actor = await this.cashSessionsRepository.findUserById(actorUserId);

    this.ensureActiveActor(actor);

    const canSuperviseAll = canCloseOtherCashSession(actor);
    const page = query.page;
    const pageSize = query.pageSize;
    const result = await this.cashSessionsRepository.listCashSessions({
      fromDate: query.fromDate,
      openedByUserId: canSuperviseAll ? query.openedByUserId : actorUserId,
      page,
      pageSize,
      status: query.status,
      toDate: query.toDate
    });

    return {
      data: result.data.map((cashSession) => toSupervisableCashSession(cashSession, actorUserId, canSuperviseAll)),
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize)
      }
    };
  }

  async openCashSession(input: OpenCashSession, context: AuditContext): Promise<CashSession> {
    const actorUserId = this.getAuthenticatedUserId(context, "open a cash session");
    const initialAmount = toMoney(input.initialAmount, "CASH_SESSION_INITIAL_AMOUNT_INVALID");
    const openingNote = normalizeNote(input.openingNote);
    const cashSession = await this.cashSessionsRepository.runInTransaction(async (tx) => {
      const actor = await this.cashSessionsRepository.findUserById(actorUserId, tx);
      this.ensureActiveActor(actor);

      const existingOpenCashSession = await this.cashSessionsRepository.findOpenCashSessionByUserId(actorUserId, tx);

      if (existingOpenCashSession) {
        throw new HttpError(409, "User already has an open cash session.", "CASH_SESSION_ALREADY_OPEN");
      }

      const correlativeNumber = await this.cashSessionsRepository.getNextCashSessionCorrelativeNumber(tx);
      const openedCashSession = await this.cashSessionsRepository.createOpenCashSession(
        {
          correlativeNumber,
          correlativeCode: buildCashSessionCorrelativeCode(correlativeNumber),
          openedByUserId: actorUserId,
          initialAmount,
          expectedAmount: initialAmount,
          openingNote
        },
        tx
      );

      await this.cashSessionsRepository.createAuditLog(
        "CASH_SESSION_OPENED",
        openedCashSession.id,
        buildOpenAuditMetadata(openedCashSession),
        context,
        tx
      );

      return openedCashSession;
    });

    return toCashSession(cashSession);
  }

  async getCurrentCashSession(context: AuditContext): Promise<CurrentCashSession> {
    const actorUserId = this.getAuthenticatedUserId(context, "consult the current cash session");
    const actor = await this.cashSessionsRepository.findUserById(actorUserId);
    this.ensureActiveActor(actor);

    const cashSession = await this.cashSessionsRepository.findOpenCashSessionByUserId(actorUserId);

    return CurrentCashSessionSchema.parse({
      isOpen: Boolean(cashSession),
      cashSession: cashSession ? toCashSession(cashSession) : null
    });
  }

  async closeCashSession(id: string, input: CloseCashSession, context: AuditContext): Promise<CashSession> {
    const actorUserId = this.getAuthenticatedUserId(context, "close a cash session");
    const countedAmount = toMoney(input.countedAmount, "CASH_SESSION_COUNTED_AMOUNT_INVALID");
    const closingNote = normalizeNote(input.closingNote);

    const cashSession = await this.cashSessionsRepository.runInTransaction(async (tx) => {
      const [actor, currentCashSession] = await Promise.all([
        this.cashSessionsRepository.findUserById(actorUserId, tx),
        this.cashSessionsRepository.findCashSessionById(id, tx)
      ]);

      this.ensureActiveActor(actor);

      if (!currentCashSession) {
        throw new HttpError(404, "Cash session was not found.", "CASH_SESSION_NOT_FOUND");
      }

      if (currentCashSession.status !== "open" || currentCashSession.closedAt) {
        throw new HttpError(409, "Cash session is already closed.", "CASH_SESSION_ALREADY_CLOSED");
      }

      const isOwnCashSession = currentCashSession.openedByUserId === actorUserId;

      if (!isOwnCashSession && !canCloseOtherCashSession(actor)) {
        throw new HttpError(403, "Only admin users can close another user's cash session.", "CASH_SESSION_CLOSE_FORBIDDEN");
      }

      const expectedAmount = toMoney(currentCashSession.expectedAmount);
      const differenceAmount = toSignedMoney(countedAmount.sub(expectedAmount));
      const closedCashSession = await this.cashSessionsRepository.closeCashSession(
        currentCashSession.id,
        {
          closedByUserId: actorUserId,
          countedAmount,
          expectedAmount,
          differenceAmount,
          closingNote,
          closedAt: new Date()
        },
        tx
      );

      await this.cashSessionsRepository.createAuditLog(
        "CASH_SESSION_CLOSED",
        closedCashSession.id,
        buildCloseAuditMetadata(closedCashSession, isOwnCashSession),
        context,
        tx
      );

      return closedCashSession;
    });

    return toCashSession(cashSession);
  }

  private getAuthenticatedUserId(context: AuditContext, action: string) {
    if (!context.actorUserId) {
      throw new HttpError(401, `Authenticated user is required to ${action}.`, "AUTHENTICATED_USER_REQUIRED");
    }

    return context.actorUserId;
  }

  private ensureActiveActor(actor: CashSessionActorRecord | null): asserts actor is CashSessionActorRecord {
    if (!actor) {
      throw new HttpError(401, "Authenticated user was not found.", "AUTHENTICATED_USER_NOT_FOUND");
    }

    if (actor.status !== "active") {
      throw new HttpError(403, "Authenticated user must be active.", "AUTHENTICATED_USER_NOT_ACTIVE");
    }
  }
}

function buildCashSessionCorrelativeCode(correlativeNumber: number) {
  return `${CASH_SESSION_CORRELATIVE_PREFIX}-${correlativeNumber.toString().padStart(CASH_SESSION_CORRELATIVE_DIGITS, "0")}`;
}

function canCloseOtherCashSession(actor: CashSessionActorRecord) {
  return ADMIN_ROLE_NAMES.has(actor.role.name);
}

function buildOpenAuditMetadata(cashSession: CashSessionWithUsers) {
  return {
    correlativeCode: cashSession.correlativeCode,
    openedByUserId: cashSession.openedByUserId,
    initialAmount: Number(cashSession.initialAmount),
    expectedAmount: Number(cashSession.expectedAmount),
    openingNote: cashSession.openingNote,
    status: cashSession.status,
    openedAt: cashSession.openedAt.toISOString()
  };
}

function buildCloseAuditMetadata(cashSession: CashSessionWithUsers, isOwnCashSession: boolean) {
  return {
    correlativeCode: cashSession.correlativeCode,
    openedByUserId: cashSession.openedByUserId,
    closedByUserId: cashSession.closedByUserId,
    initialAmount: Number(cashSession.initialAmount),
    expectedAmount: Number(cashSession.expectedAmount),
    countedAmount: cashSession.countedAmount ? Number(cashSession.countedAmount) : null,
    differenceAmount: cashSession.differenceAmount ? Number(cashSession.differenceAmount) : null,
    closingNote: cashSession.closingNote,
    closedAt: cashSession.closedAt?.toISOString(),
    status: cashSession.status,
    isOwnCashSession
  };
}

function toCashSession(cashSession: CashSessionWithUsers): CashSession {
  return CashSessionSchema.parse({
    id: cashSession.id,
    correlativeCode: cashSession.correlativeCode,
    openedByUserId: cashSession.openedByUserId,
    openedByUser: toCashSessionUser(cashSession.openedByUser),
    closedByUserId: cashSession.closedByUserId ?? undefined,
    closedByUser: cashSession.closedByUser ? toCashSessionUser(cashSession.closedByUser) : undefined,
    initialAmount: Number(cashSession.initialAmount),
    countedAmount: cashSession.countedAmount ? Number(cashSession.countedAmount) : undefined,
    expectedAmount: Number(cashSession.expectedAmount),
    differenceAmount: cashSession.differenceAmount ? Number(cashSession.differenceAmount) : undefined,
    status: cashSession.status,
    openingNote: cashSession.openingNote ?? undefined,
    closingNote: cashSession.closingNote ?? undefined,
    openedAt: cashSession.openedAt.toISOString(),
    closedAt: cashSession.closedAt?.toISOString(),
    createdAt: cashSession.createdAt.toISOString(),
    updatedAt: cashSession.updatedAt.toISOString()
  });
}

function toSupervisableCashSession(
  cashSession: CashSessionWithUsers,
  actorUserId: string,
  canSuperviseAll: boolean
): SupervisableCashSession {
  return {
    ...toCashSession(cashSession),
    canClose:
      cashSession.status === "open" &&
      !cashSession.closedAt &&
      (cashSession.openedByUserId === actorUserId || canSuperviseAll)
  };
}

function toCashSessionUser(user: CashSessionWithUsers["openedByUser"]) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email
  };
}

function normalizeNote(value?: string) {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length > 240) {
    throw new HttpError(400, "Cash session notes must have at most 240 characters.", "CASH_SESSION_NOTE_INVALID");
  }

  return normalizedValue;
}

function toMoney(value: Prisma.Decimal.Value, errorCode = "CASH_SESSION_AMOUNT_INVALID") {
  const amount = new Prisma.Decimal(value);

  if (!amount.isFinite() || amount.lt(0) || !hasMaxDecimalPlaces(amount, 2)) {
    throw new HttpError(400, "Cash session amounts must be zero or greater with at most 2 decimal places.", errorCode);
  }

  return amount.toDecimalPlaces(2);
}

function toSignedMoney(value: Prisma.Decimal.Value, errorCode = "CASH_SESSION_AMOUNT_INVALID") {
  const amount = new Prisma.Decimal(value);

  if (!amount.isFinite() || !hasMaxDecimalPlaces(amount, 2)) {
    throw new HttpError(400, "Cash session signed amounts must have at most 2 decimal places.", errorCode);
  }

  return amount.toDecimalPlaces(2);
}

function hasMaxDecimalPlaces(value: Prisma.Decimal, places: number) {
  const [, decimals = ""] = value.toString().split(".");

  return decimals.length <= places;
}
