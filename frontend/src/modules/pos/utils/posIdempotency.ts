const POS_IDEMPOTENCY_PREFIX = "pos";

export function createPosIdempotencyKey(now = Date.now(), random = Math.random()): string {
  const timestamp = now.toString(36);
  const entropy = Math.floor(random * Number.MAX_SAFE_INTEGER).toString(36).padStart(11, "0");

  return `${POS_IDEMPOTENCY_PREFIX}-${timestamp}-${entropy}`;
}
