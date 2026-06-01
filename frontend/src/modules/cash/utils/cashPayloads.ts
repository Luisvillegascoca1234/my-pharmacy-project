import {
  CloseCashSessionSchema,
  OpenCashSessionSchema,
  type CloseCashSession,
  type OpenCashSession
} from "@pharmacy-pos/shared";

function normalizeMoney(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value * 100) / 100);
}

function normalizeOptionalNote(value?: string): string | undefined {
  return value?.trim() || undefined;
}

export function buildOpenCashSessionPayload(input: OpenCashSession): OpenCashSession {
  return OpenCashSessionSchema.parse({
    initialAmount: normalizeMoney(Number(input.initialAmount)),
    openingNote: normalizeOptionalNote(input.openingNote)
  });
}

export function buildCloseCashSessionPayload(input: CloseCashSession): CloseCashSession {
  return CloseCashSessionSchema.parse({
    closingNote: normalizeOptionalNote(input.closingNote),
    countedAmount: normalizeMoney(Number(input.countedAmount))
  });
}
