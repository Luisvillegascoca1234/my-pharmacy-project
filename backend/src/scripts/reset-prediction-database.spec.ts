import { describe, expect, it } from "vitest";
import {
  assertPredictionResetAllowed,
  parsePredictionResetArguments,
  resolvePnpmCommand
} from "./reset-prediction-database.js";

describe("prediction database reset", () => {
  it("requires destructive confirmation and refuses production", () => {
    expect(() => assertPredictionResetAllowed({
      nodeEnv: "development",
      confirmed: false
    })).toThrow(/--confirm-reset/);
    expect(() => assertPredictionResetAllowed({
      nodeEnv: "production",
      confirmed: true
    })).toThrow(/disabled in production/);
    expect(() => assertPredictionResetAllowed({
      nodeEnv: "development",
      confirmed: true
    })).not.toThrow();
  });

  it("parses the deterministic reset inputs", () => {
    expect(parsePredictionResetArguments([
      "--confirm-reset",
      "--as-of=2026-07-23",
      "--seed=20260723"
    ])).toEqual({
      asOf: "2026-07-23",
      seed: 20260723,
      confirmed: true
    });
  });

  it("uses the Windows command shim without invoking a shell", () => {
    expect(resolvePnpmCommand("win32")).toBe("pnpm.cmd");
    expect(resolvePnpmCommand("linux")).toBe("pnpm");
  });
});
