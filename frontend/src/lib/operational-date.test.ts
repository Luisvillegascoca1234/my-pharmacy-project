import { describe, expect, it } from "vitest";
import { getOperationalDate } from "./operational-date";

describe("getOperationalDate", () => {
  it("uses the Bolivia calendar date near the UTC day boundary", () => {
    expect(getOperationalDate(new Date("2026-08-20T02:30:00.000Z"))).toBe("2026-08-19");
  });

  it("advances after midnight in Bolivia", () => {
    expect(getOperationalDate(new Date("2026-08-20T04:30:00.000Z"))).toBe("2026-08-20");
  });
});
