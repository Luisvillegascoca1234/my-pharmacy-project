CREATE TYPE "CashSessionStatus" AS ENUM ('open', 'closed');

CREATE TABLE "CashSession" (
    "id" TEXT NOT NULL,
    "correlativeNumber" INTEGER NOT NULL,
    "correlativeCode" TEXT NOT NULL,
    "openedByUserId" TEXT NOT NULL,
    "closedByUserId" TEXT,
    "initialAmount" DECIMAL(12,2) NOT NULL,
    "countedAmount" DECIMAL(12,2),
    "expectedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "differenceAmount" DECIMAL(12,2),
    "status" "CashSessionStatus" NOT NULL DEFAULT 'open',
    "openingNote" TEXT,
    "closingNote" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CashSession_correlativeNumber_key" ON "CashSession"("correlativeNumber");
CREATE UNIQUE INDEX "CashSession_correlativeCode_key" ON "CashSession"("correlativeCode");
CREATE UNIQUE INDEX "CashSession_openedByUserId_open_key" ON "CashSession"("openedByUserId") WHERE "status" = 'open';
CREATE INDEX "CashSession_openedByUserId_idx" ON "CashSession"("openedByUserId");
CREATE INDEX "CashSession_closedByUserId_idx" ON "CashSession"("closedByUserId");
CREATE INDEX "CashSession_status_idx" ON "CashSession"("status");
CREATE INDEX "CashSession_openedAt_idx" ON "CashSession"("openedAt");
CREATE INDEX "CashSession_closedAt_idx" ON "CashSession"("closedAt");
CREATE INDEX "CashSession_openedByUserId_status_idx" ON "CashSession"("openedByUserId", "status");

ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_openedByUserId_fkey" FOREIGN KEY ("openedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CashSession" ADD CONSTRAINT "CashSession_closedByUserId_fkey" FOREIGN KEY ("closedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
