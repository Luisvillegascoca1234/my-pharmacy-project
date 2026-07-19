import { describe, expect, it } from "vitest";
import { createPosIdempotencyKey } from "./posIdempotency";

describe("createPosIdempotencyKey", () => {
  it("creates a stable key when retry inputs are reused", () => {
    expect(createPosIdempotencyKey(1_784_407_200_000, 0.25)).toBe(
      createPosIdempotencyKey(1_784_407_200_000, 0.25)
    );
  });

  it("creates different keys for separate sale attempts", () => {
    expect(createPosIdempotencyKey(1_784_407_200_000, 0.25)).not.toBe(
      createPosIdempotencyKey(1_784_407_200_001, 0.75)
    );
  });
});
