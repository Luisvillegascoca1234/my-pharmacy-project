import "dotenv/config";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export type PredictionResetOptions = {
  asOf: string;
  seed: number;
  confirmed: boolean;
};

export function parsePredictionResetArguments(argumentsList: string[]): PredictionResetOptions {
  const asOf = readArgument(argumentsList, "--as-of");
  const seedText = readArgument(argumentsList, "--seed");
  if (!asOf || !/^\d{4}-\d{2}-\d{2}$/.test(asOf) ||
    new Date(`${asOf}T00:00:00.000Z`).toISOString().slice(0, 10) !== asOf) {
    throw new Error("The required --as-of=YYYY-MM-DD argument must be a valid calendar date.");
  }
  const seed = Number(seedText);
  if (!seedText || !Number.isSafeInteger(seed)) {
    throw new Error("The required --seed=<integer> argument must be a safe integer.");
  }
  return {
    asOf,
    seed,
    confirmed: argumentsList.includes("--confirm-reset")
  };
}

export function assertPredictionResetAllowed(input: {
  nodeEnv: string | undefined;
  confirmed: boolean;
}) {
  if (input.nodeEnv === "production") {
    throw new Error("Prediction database reset is disabled in production.");
  }
  if (!input.confirmed) {
    throw new Error("Destructive reset requires the explicit --confirm-reset flag.");
  }
}

export async function main(argumentsList = process.argv.slice(2)) {
  const options = parsePredictionResetArguments(argumentsList);
  assertPredictionResetAllowed({
    nodeEnv: process.env.NODE_ENV ?? "development",
    confirmed: options.confirmed
  });

  console.log("Resetting the configured database schema. All current data will be destroyed.");
  await runPnpm(["exec", "prisma", "migrate", "reset", "--force", "--skip-seed"]);
  await runPnpm(["prisma:seed"]);
  await runPnpm([
    "seed:stock-planning-prediction",
    "--",
    `--as-of=${options.asOf}`,
    `--seed=${options.seed}`
  ]);
  console.log("Prediction database reset completed.");
}

function runPnpm(argumentsList: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(resolvePnpmCommand(process.platform), argumentsList, {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
      stdio: "inherit"
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`pnpm ${argumentsList.join(" ")} failed (${signal ?? code ?? "unknown"}).`));
      }
    });
  });
}

export function resolvePnpmCommand(platform: NodeJS.Platform) {
  return platform === "win32" ? "pnpm.cmd" : "pnpm";
}

function readArgument(argumentsList: string[], name: string) {
  const inline = argumentsList.find((value) => value.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1);
  const index = argumentsList.indexOf(name);
  return index >= 0 ? argumentsList[index + 1] : undefined;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
