export function normalizeNonNegativeMoney(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value * 100) / 100);
}

export function normalizePositiveInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.trunc(value));
}

export function multiplyMoney(unitPrice: number, quantity: number): number {
  return normalizeNonNegativeMoney(unitPrice * quantity);
}
