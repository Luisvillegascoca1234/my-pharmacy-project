export function createStockPlanningExecutionKey(
  now = Date.now(),
  random = Math.random()
): string {
  return `stock-planning-${now.toString(36)}-${Math.floor(random * Number.MAX_SAFE_INTEGER).toString(36)}`;
}
