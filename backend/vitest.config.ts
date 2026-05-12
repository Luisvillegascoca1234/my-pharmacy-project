import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    environment: "node",
    globals: false,
    include: ["src/**/*.spec.ts"],
    restoreMocks: true,
    setupFiles: ["src/tests/setup.ts"]
  }
});
