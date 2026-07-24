import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (await prisma.stockPlanningExecution.findUnique({
    where: { idempotencyKey: "qa-later-global-failure-after-current" }
  })) return;
  const current = await prisma.stockPlanningExecution.findFirstOrThrow({
    where: { status: { in: ["succeeded", "succeeded_with_warnings"] } },
    orderBy: [{ startedAt: "desc" }, { id: "desc" }]
  });
  await prisma.stockPlanningExecution.create({
    data: {
      id: "qa-execution-later-failure-after-current",
      idempotencyKey: "qa-later-global-failure-after-current",
      configurationId: current.configurationId,
      configurationSnapshot: current.configurationSnapshot,
      trigger: "scheduled",
      status: "failed",
      scheduledFor: new Date("2026-07-24T02:00:00.000Z"),
      demandCutoffDate: new Date("2026-07-23T00:00:00.000Z"),
      stockCapturedAt: new Date("2026-07-24T02:00:00.000Z"),
      engineVersion: "qa-engine-1",
      fingerprint: "qa-later-global-failure-after-current",
      startedAt: new Date("2026-07-24T02:00:00.000Z"),
      completedAt: new Date("2026-07-24T02:00:01.000Z"),
      durationMs: 1000,
      globalError: "Fallo QA posterior: el último resultado exitoso se conserva.",
      warnings: []
    }
  });
}

void main().finally(async () => prisma.$disconnect());
