import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { captureHttpError, expectHttpError } from "../../tests/utils/http-error.js";
import { CashSessionsRepositoryPort, CashSessionsService } from "./cash.service.js";
import type { AuditContext, CashSessionActorRecord, CashSessionWithUsers } from "./cash.types.js";

const testTransactionClient = {} as Prisma.TransactionClient;
const auditContext: AuditContext = {
  actorUserId: "seller-1",
  ipAddress: "127.0.0.1",
  userAgent: "vitest"
};

describe("CashSessionsService", () => {
  it("opens a cash session with zero initial amount and writes opening audit", async () => {
    const cashSessionsRepository = new FakeCashSessionsRepository();
    cashSessionsRepository.seedUsers([makeActor({ id: "seller-1", role: { name: "seller" } })]);
    cashSessionsRepository.nextCorrelativeNumber = 7;
    const service = new CashSessionsService(cashSessionsRepository);

    const cashSession = await service.openCashSession(
      {
        initialAmount: 0,
        openingNote: "  Turno manana  "
      },
      auditContext
    );

    expect(cashSession).toEqual(
      expect.objectContaining({
        correlativeCode: "C-000007",
        openedByUserId: "seller-1",
        initialAmount: 0,
        expectedAmount: 0,
        status: "open",
        openingNote: "Turno manana"
      })
    );
    expect(cashSessionsRepository.createOpenCashSessionCalls).toEqual([
      {
        correlativeNumber: 7,
        correlativeCode: "C-000007",
        openedByUserId: "seller-1",
        initialAmount: decimal(0),
        expectedAmount: decimal(0),
        openingNote: "Turno manana"
      }
    ]);
    expect(cashSessionsRepository.auditLogs).toEqual([
      expect.objectContaining({
        action: "CASH_SESSION_OPENED",
        entityId: cashSession.id,
        context: auditContext,
        metadata: expect.objectContaining({
          correlativeCode: "C-000007",
          openedByUserId: "seller-1",
          initialAmount: 0,
          expectedAmount: 0,
          status: "open"
        })
      })
    ]);
  });

  it("blocks a second open cash session for the same user", async () => {
    const cashSessionsRepository = new FakeCashSessionsRepository();
    cashSessionsRepository.seedUsers([makeActor({ id: "seller-1", role: { name: "seller" } })]);
    cashSessionsRepository.seedCashSessions([makeCashSession({ id: "cash-session-1", openedByUserId: "seller-1" })]);
    const service = new CashSessionsService(cashSessionsRepository);

    const error = await captureHttpError(() => service.openCashSession({ initialAmount: 10 }, auditContext));

    expectHttpError(error, {
      code: "CASH_SESSION_ALREADY_OPEN",
      statusCode: 409
    });
    expect(cashSessionsRepository.createOpenCashSessionCalls).toHaveLength(0);
    expect(cashSessionsRepository.auditLogs).toHaveLength(0);
  });

  it("opens a cash session with a positive initial amount and rejects negative amounts", async () => {
    const positiveRepository = new FakeCashSessionsRepository();
    positiveRepository.seedUsers([makeActor({ id: "seller-1", role: { name: "seller" } })]);
    const positiveService = new CashSessionsService(positiveRepository);

    await expect(positiveService.openCashSession({ initialAmount: 25.5 }, auditContext)).resolves.toEqual(
      expect.objectContaining({
        initialAmount: 25.5,
        expectedAmount: 25.5,
        status: "open"
      })
    );

    const negativeRepository = new FakeCashSessionsRepository();
    negativeRepository.seedUsers([makeActor({ id: "seller-1", role: { name: "seller" } })]);
    const negativeService = new CashSessionsService(negativeRepository);

    const error = await captureHttpError(() => negativeService.openCashSession({ initialAmount: -0.01 }, auditContext));

    expectHttpError(error, {
      code: "CASH_SESSION_INITIAL_AMOUNT_INVALID",
      statusCode: 400
    });
    expect(negativeRepository.createOpenCashSessionCalls).toHaveLength(0);
    expect(negativeRepository.auditLogs).toHaveLength(0);
  });

  it("returns current cash session state without and with an open session", async () => {
    const noOpenRepository = new FakeCashSessionsRepository();
    noOpenRepository.seedUsers([makeActor({ id: "seller-1", role: { name: "seller" } })]);
    const noOpenService = new CashSessionsService(noOpenRepository);

    await expect(noOpenService.getCurrentCashSession(auditContext)).resolves.toEqual({
      isOpen: false,
      cashSession: null
    });

    const openRepository = new FakeCashSessionsRepository();
    openRepository.seedUsers([makeActor({ id: "seller-1", role: { name: "seller" } })]);
    openRepository.seedCashSessions([
      makeCashSession({
        id: "cash-session-1",
        openedByUserId: "seller-1",
        initialAmount: decimal(50),
        expectedAmount: decimal(50)
      })
    ]);
    const openService = new CashSessionsService(openRepository);

    await expect(openService.getCurrentCashSession(auditContext)).resolves.toEqual({
      isOpen: true,
      cashSession: expect.objectContaining({
        id: "cash-session-1",
        openedByUserId: "seller-1",
        initialAmount: 50,
        expectedAmount: 50,
        status: "open"
      })
    });
  });

  it("lists only own cash sessions for sellers", async () => {
    const cashSessionsRepository = new FakeCashSessionsRepository();
    cashSessionsRepository.seedUsers([
      makeActor({ id: "seller-1", role: { name: "seller" } }),
      makeActor({ id: "seller-2", role: { name: "seller" } })
    ]);
    cashSessionsRepository.seedCashSessions([
      makeCashSession({ id: "cash-session-1", openedByUserId: "seller-1" }),
      makeCashSession({ id: "cash-session-2", openedByUserId: "seller-2" })
    ]);
    const service = new CashSessionsService(cashSessionsRepository);

    const result = await service.listCashSessions(
      { page: 1, pageSize: 20, openedByUserId: "seller-2" },
      { ...auditContext, actorRoleName: "seller" }
    );

    expect(cashSessionsRepository.listCashSessionsCalls).toEqual([
      expect.objectContaining({
        openedByUserId: "seller-1"
      })
    ]);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual(
      expect.objectContaining({
        id: "cash-session-1",
        canClose: true
      })
    );
  });

  it.each(["admin", "superadmin"])("lists supervisable cash sessions for %s users", async (roleName) => {
    const cashSessionsRepository = new FakeCashSessionsRepository();
    cashSessionsRepository.seedUsers([
      makeActor({ id: "admin-1", role: { name: roleName } }),
      makeActor({ id: "seller-1", role: { name: "seller" } })
    ]);
    cashSessionsRepository.seedCashSessions([makeCashSession({ id: "cash-session-1", openedByUserId: "seller-1" })]);
    const service = new CashSessionsService(cashSessionsRepository);

    const result = await service.listCashSessions(
      { page: 1, pageSize: 20, openedByUserId: "seller-1", status: "open" },
      { ...auditContext, actorUserId: "admin-1", actorRoleName: roleName }
    );

    expect(cashSessionsRepository.listCashSessionsCalls).toEqual([
      expect.objectContaining({
        openedByUserId: "seller-1",
        status: "open"
      })
    ]);
    expect(result.data).toEqual([
      expect.objectContaining({
        id: "cash-session-1",
        canClose: true
      })
    ]);
  });

  it("closes an own cash session with zero difference and writes closing audit", async () => {
    const cashSessionsRepository = new FakeCashSessionsRepository();
    cashSessionsRepository.seedUsers([makeActor({ id: "seller-1", role: { name: "seller" } })]);
    cashSessionsRepository.seedCashSessions([
      makeCashSession({
        id: "cash-session-1",
        openedByUserId: "seller-1",
        initialAmount: decimal(50),
        expectedAmount: decimal(50)
      })
    ]);
    const service = new CashSessionsService(cashSessionsRepository);

    const cashSession = await service.closeCashSession(
      "cash-session-1",
      {
        countedAmount: 50,
        closingNote: "  Sin diferencias  "
      },
      auditContext
    );

    expect(cashSession).toEqual(
      expect.objectContaining({
        id: "cash-session-1",
        closedByUserId: "seller-1",
        countedAmount: 50,
        expectedAmount: 50,
        differenceAmount: 0,
        status: "closed",
        closingNote: "Sin diferencias"
      })
    );
    expect(cashSessionsRepository.closeCashSessionCalls).toEqual([
      expect.objectContaining({
        id: "cash-session-1",
        input: expect.objectContaining({
          closedByUserId: "seller-1",
          countedAmount: decimal(50),
          expectedAmount: decimal(50),
          differenceAmount: decimal(0),
          closingNote: "Sin diferencias"
        })
      })
    ]);
    expect(cashSessionsRepository.auditLogs).toEqual([
      expect.objectContaining({
        action: "CASH_SESSION_CLOSED",
        entityId: "cash-session-1",
        context: auditContext,
        metadata: expect.objectContaining({
          expectedAmount: 50,
          countedAmount: 50,
          differenceAmount: 0,
          isOwnCashSession: true
        })
      })
    ]);
  });

  it("calculates shortage and surplus when closing own cash sessions", async () => {
    const shortageRepository = makeRepositoryWithSellerAndSession("shortage-session");
    const shortageService = new CashSessionsService(shortageRepository);

    const shortage = await shortageService.closeCashSession("shortage-session", { countedAmount: 95 }, auditContext);

    expect(shortage).toEqual(
      expect.objectContaining({
        countedAmount: 95,
        expectedAmount: 100,
        differenceAmount: -5
      })
    );

    const surplusRepository = makeRepositoryWithSellerAndSession("surplus-session");
    const surplusService = new CashSessionsService(surplusRepository);

    const surplus = await surplusService.closeCashSession("surplus-session", { countedAmount: 110 }, auditContext);

    expect(surplus).toEqual(
      expect.objectContaining({
        countedAmount: 110,
        expectedAmount: 100,
        differenceAmount: 10
      })
    );
  });

  it("uses the accumulated expected amount when closing after cash sales", async () => {
    const cashSessionsRepository = new FakeCashSessionsRepository();
    cashSessionsRepository.seedUsers([makeActor({ id: "seller-1", role: { name: "seller" } })]);
    cashSessionsRepository.seedCashSessions([
      makeCashSession({
        id: "cash-session-1",
        openedByUserId: "seller-1",
        initialAmount: decimal(20),
        expectedAmount: decimal(135)
      })
    ]);
    const service = new CashSessionsService(cashSessionsRepository);

    const cashSession = await service.closeCashSession("cash-session-1", { countedAmount: 130 }, auditContext);

    expect(cashSession).toEqual(
      expect.objectContaining({
        initialAmount: 20,
        expectedAmount: 135,
        countedAmount: 130,
        differenceAmount: -5
      })
    );
    expect(cashSessionsRepository.closeCashSessionCalls[0].input).toEqual(
      expect.objectContaining({
        expectedAmount: decimal(135),
        differenceAmount: decimal(-5)
      })
    );
  });

  it("blocks sellers from closing another user's cash session", async () => {
    const cashSessionsRepository = new FakeCashSessionsRepository();
    cashSessionsRepository.seedUsers([
      makeActor({ id: "seller-1", role: { name: "seller" } }),
      makeActor({ id: "seller-2", role: { name: "seller" } })
    ]);
    cashSessionsRepository.seedCashSessions([makeCashSession({ id: "cash-session-1", openedByUserId: "seller-2" })]);
    const service = new CashSessionsService(cashSessionsRepository);

    const error = await captureHttpError(() => service.closeCashSession("cash-session-1", { countedAmount: 0 }, auditContext));

    expectHttpError(error, {
      code: "CASH_SESSION_CLOSE_FORBIDDEN",
      statusCode: 403
    });
    expect(cashSessionsRepository.closeCashSessionCalls).toHaveLength(0);
    expect(cashSessionsRepository.auditLogs).toHaveLength(0);
  });

  it.each(["admin", "superadmin"])("allows %s users to close another user's cash session", async (roleName) => {
    const cashSessionsRepository = new FakeCashSessionsRepository();
    cashSessionsRepository.seedUsers([
      makeActor({ id: "admin-1", role: { name: roleName } }),
      makeActor({ id: "seller-1", role: { name: "seller" } })
    ]);
    cashSessionsRepository.seedCashSessions([
      makeCashSession({
        id: `cash-session-${roleName}`,
        openedByUserId: "seller-1",
        initialAmount: decimal(10),
        expectedAmount: decimal(80)
      })
    ]);
    const service = new CashSessionsService(cashSessionsRepository);

    const cashSession = await service.closeCashSession(
      `cash-session-${roleName}`,
      { countedAmount: 75 },
      { ...auditContext, actorUserId: "admin-1" }
    );

    expect(cashSession).toEqual(
      expect.objectContaining({
        closedByUserId: "admin-1",
        status: "closed",
        countedAmount: 75,
        expectedAmount: 80,
        differenceAmount: -5
      })
    );
    expect(cashSessionsRepository.auditLogs).toEqual([
      expect.objectContaining({
        action: "CASH_SESSION_CLOSED",
        metadata: expect.objectContaining({
          countedAmount: 75,
          expectedAmount: 80,
          differenceAmount: -5,
          isOwnCashSession: false
        })
      })
    ]);
  });

  it("blocks closing a cash session that is already closed", async () => {
    const cashSessionsRepository = new FakeCashSessionsRepository();
    cashSessionsRepository.seedUsers([makeActor({ id: "seller-1", role: { name: "seller" } })]);
    cashSessionsRepository.seedCashSessions([
      makeCashSession({
        id: "cash-session-1",
        openedByUserId: "seller-1",
        status: "closed",
        closedAt: new Date("2026-01-01T10:00:00.000Z"),
        closedByUserId: "seller-1",
        closedByUser: makeActor({ id: "seller-1", role: { name: "seller" } })
      })
    ]);
    const service = new CashSessionsService(cashSessionsRepository);

    const error = await captureHttpError(() => service.closeCashSession("cash-session-1", { countedAmount: 0 }, auditContext));

    expectHttpError(error, {
      code: "CASH_SESSION_ALREADY_CLOSED",
      statusCode: 409
    });
    expect(cashSessionsRepository.closeCashSessionCalls).toHaveLength(0);
    expect(cashSessionsRepository.auditLogs).toHaveLength(0);
  });
});

class FakeCashSessionsRepository implements CashSessionsRepositoryPort {
  readonly auditLogs: Array<{
    action: string;
    context: AuditContext;
    entityId: string;
    metadata: unknown;
  }> = [];
  readonly closeCashSessionCalls: Array<{
    id: string;
    input: Parameters<CashSessionsRepositoryPort["closeCashSession"]>[1];
  }> = [];
  readonly createOpenCashSessionCalls: Parameters<CashSessionsRepositoryPort["createOpenCashSession"]>[0][] = [];
  readonly listCashSessionsCalls: Parameters<CashSessionsRepositoryPort["listCashSessions"]>[0][] = [];

  nextCorrelativeNumber = 1;

  private cashSessions = new Map<string, CashSessionWithUsers>();
  private users = new Map<string, CashSessionActorRecord>();

  async runInTransaction<T>(callback: (client: Prisma.TransactionClient) => Promise<T>) {
    return callback(testTransactionClient);
  }

  async findUserById(id: string) {
    return this.users.get(id) ?? null;
  }

  async listCashSessions(filters: Parameters<CashSessionsRepositoryPort["listCashSessions"]>[0]) {
    this.listCashSessionsCalls.push(filters);

    const data = [...this.cashSessions.values()].filter((cashSession) => {
      if (filters.openedByUserId && cashSession.openedByUserId !== filters.openedByUserId) {
        return false;
      }

      if (filters.status && cashSession.status !== filters.status) {
        return false;
      }

      return true;
    });

    return {
      data,
      total: data.length
    };
  }

  async findCashSessionById(id: string) {
    return this.cashSessions.get(id) ?? null;
  }

  async findOpenCashSessionByUserId(userId: string) {
    return (
      [...this.cashSessions.values()]
        .filter((cashSession) => cashSession.openedByUserId === userId && cashSession.status === "open" && !cashSession.closedAt)
        .sort((left, right) => right.openedAt.getTime() - left.openedAt.getTime())[0] ?? null
    );
  }

  async getNextCashSessionCorrelativeNumber() {
    return this.nextCorrelativeNumber;
  }

  async createOpenCashSession(input: Parameters<CashSessionsRepositoryPort["createOpenCashSession"]>[0]) {
    this.createOpenCashSessionCalls.push(input);

    const openedByUser = requireUser(this.users, input.openedByUserId);
    const cashSession = makeCashSession({
      id: `cash-session-${this.cashSessions.size + 1}`,
      correlativeNumber: input.correlativeNumber,
      correlativeCode: input.correlativeCode,
      openedByUserId: input.openedByUserId,
      openedByUser,
      initialAmount: input.initialAmount,
      expectedAmount: input.expectedAmount,
      openingNote: input.openingNote
    });

    this.cashSessions.set(cashSession.id, cashSession);

    return cashSession;
  }

  async closeCashSession(id: string, input: Parameters<CashSessionsRepositoryPort["closeCashSession"]>[1]) {
    this.closeCashSessionCalls.push({ id, input });

    const currentCashSession = requireCashSession(this.cashSessions, id);
    const closedByUser = requireUser(this.users, input.closedByUserId);
    const cashSession = makeCashSession({
      ...currentCashSession,
      closedByUserId: input.closedByUserId,
      closedByUser,
      countedAmount: input.countedAmount,
      expectedAmount: input.expectedAmount,
      differenceAmount: input.differenceAmount,
      closingNote: input.closingNote,
      closedAt: input.closedAt,
      status: "closed",
      updatedAt: input.closedAt
    });

    this.cashSessions.set(id, cashSession);

    return cashSession;
  }

  async createAuditLog(action: string, entityId: string, metadata: unknown, context: AuditContext) {
    this.auditLogs.push({ action, entityId, metadata, context });

    return { id: `audit-${this.auditLogs.length}` };
  }

  seedCashSessions(cashSessions: CashSessionWithUsers[]) {
    this.cashSessions = new Map(cashSessions.map((cashSession) => [cashSession.id, cashSession]));
  }

  seedUsers(users: CashSessionActorRecord[]) {
    this.users = new Map(users.map((user) => [user.id, user]));
  }
}

function makeRepositoryWithSellerAndSession(cashSessionId: string) {
  const cashSessionsRepository = new FakeCashSessionsRepository();
  cashSessionsRepository.seedUsers([makeActor({ id: "seller-1", role: { name: "seller" } })]);
  cashSessionsRepository.seedCashSessions([
    makeCashSession({
      id: cashSessionId,
      openedByUserId: "seller-1",
      initialAmount: decimal(100),
      expectedAmount: decimal(100)
    })
  ]);

  return cashSessionsRepository;
}

function makeActor(overrides: Partial<CashSessionActorRecord> = {}): CashSessionActorRecord {
  return {
    id: "seller-1",
    fullName: "Vendedor Caja",
    email: "seller@example.com",
    status: "active",
    role: {
      name: "seller"
    },
    ...overrides
  };
}

function makeCashSession(overrides: Partial<CashSessionWithUsers> = {}): CashSessionWithUsers {
  const now = new Date("2026-01-01T08:00:00.000Z");
  const openedByUser = overrides.openedByUser ?? makeActor({ id: overrides.openedByUserId ?? "seller-1" });

  return {
    id: "cash-session-1",
    correlativeNumber: 1,
    correlativeCode: "C-000001",
    openedByUserId: openedByUser.id,
    openedByUser,
    closedByUserId: null,
    closedByUser: null,
    initialAmount: decimal(0),
    countedAmount: null,
    expectedAmount: decimal(0),
    differenceAmount: null,
    status: "open",
    openingNote: null,
    closingNote: null,
    openedAt: now,
    closedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function decimal(value: Prisma.Decimal.Value) {
  return new Prisma.Decimal(value);
}

function requireUser(users: Map<string, CashSessionActorRecord>, id: string) {
  const user = users.get(id);

  if (!user) {
    throw new Error(`User ${id} does not exist in fake repository.`);
  }

  return user;
}

function requireCashSession(cashSessions: Map<string, CashSessionWithUsers>, id: string) {
  const cashSession = cashSessions.get(id);

  if (!cashSession) {
    throw new Error(`Cash session ${id} does not exist in fake repository.`);
  }

  return cashSession;
}
