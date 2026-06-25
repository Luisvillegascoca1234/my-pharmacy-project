import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const modulesDir = path.resolve(__dirname);
const dataModuleDirsWithNoVisibleCopy = new Set(["audit", "exports", "reports"]);
const forbiddenImportPatterns = [
  /from\s+["'](?:@\/)?(?:components|pages|layouts|routes|ui)\b/,
  /from\s+["']react-router(?:-dom)?["']/,
  /from\s+["']lucide-react["']/,
  /from\s+["'][^"']+\.(?:css|scss|sass)["']/
];
const forbiddenVisibleCopyPatterns = [
  /["'`]([^"'`]*[áéíóúñÁÉÍÓÚÑ¿¡][^"'`]*)["'`]/,
  /["'`](?:No se pudo|Seleccione|Buscar|Descargar|Exportar|Auditor[ií]a|Reporte|Venta|Movimiento)[^"'`]*["'`]/
];

function collectSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return collectSourceFiles(entryPath);
    }

    return entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") ? [entryPath] : [];
  });
}

describe("module architecture boundaries", () => {
  it("keeps frontend modules free of UI, router, icon and JSX dependencies", () => {
    const violations = collectSourceFiles(modulesDir)
      .filter((filePath) => !filePath.endsWith(".test.ts"))
      .flatMap((filePath) => {
        const relativePath = path.relative(modulesDir, filePath);
        const source = fs.readFileSync(filePath, "utf8");
        const importViolations = forbiddenImportPatterns
          .filter((pattern) => pattern.test(source))
          .map((pattern) => `${relativePath} matches ${pattern}`);
        const tsxViolation = filePath.endsWith(".tsx") ? [`${relativePath} is a TSX file inside modules`] : [];
        const moduleName = relativePath.split(path.sep)[0];
        const visibleCopyViolations = dataModuleDirsWithNoVisibleCopy.has(moduleName)
          ? forbiddenVisibleCopyPatterns
              .filter((pattern) => pattern.test(source))
              .map((pattern) => `${relativePath} contains visible product copy matching ${pattern}`)
          : [];

        return [...importViolations, ...tsxViolation, ...visibleCopyViolations];
      });

    expect(violations).toEqual([]);
  });
});
