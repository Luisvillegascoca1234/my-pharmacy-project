import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import type {
  StockPlanningAlert,
  StockPlanningEngineState,
  StockPlanningFilters,
  StockPlanningProduct,
  StockPlanningSupplierGroup
} from "@/modules/stock-planning";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  PredictiveAlerts,
  ReplenishmentDashboard,
  ReplenishmentFilters,
  ReplenishmentTable
} from "./stock-planning-replenishment";

const recommendationProduct: StockPlanningProduct = {
  alerts: [],
  baseUnitAbbreviation: "tab",
  categoryId: "category-1",
  categoryName: "Analgésicos",
  commercialName: "Paracetamol 500 mg",
  confidence: "high",
  coverage: { days: 30, source: "global" },
  criticality: "critical",
  draftPurchaseCount: 2,
  draftPurchaseQuantity: 50,
  expiryRiskStock: 8,
  internalCode: "MED-001",
  maturity: "operational",
  minimumStock: 10,
  productId: "product-1",
  result: {
    centralDemand: 10,
    demandQuantile: 14,
    estimatedCost: 24,
    kind: "demand_forecast",
    preferredPresentation: {
      abbreviation: "caja",
      conversionFactor: 6,
      id: "presentation-1",
      name: "Caja",
      unitId: "unit-1"
    },
    quantityBase: 12,
    safetyStock: 4,
    serviceLevel: 0.99,
    targetStock: 14,
    wasRounded: true
  },
  risks: ["critical_stockout", "replenishment", "expiry", "stale"],
  supplierId: "supplier-1",
  supplierName: "Distribuidora Andina",
  unusableStock: 3,
  usableStock: 2,
  warnings: ["draft_purchases_are_context_only"]
};

const referenceProduct: StockPlanningProduct = {
  ...recommendationProduct,
  commercialName: "Ibuprofeno 400 mg",
  confidence: "none",
  criticality: "normal",
  draftPurchaseCount: 0,
  draftPurchaseQuantity: 0,
  expiryRiskStock: 0,
  internalCode: "MED-002",
  maturity: "no_history",
  productId: "product-2",
  result: {
    kind: "configured_reference",
    quantityBase: 3,
    wasRounded: false
  },
  risks: [],
  warnings: ["missing_preferred_presentation", "missing_reliable_purchase_cost"]
};

const supplierGroups: StockPlanningSupplierGroup[] = [{
  productIds: ["product-2", "product-1"],
  summary: {
    criticalRiskCount: 1,
    expiryRiskCount: 1,
    productCount: 2,
    replenishmentCount: 1,
    staleCount: 1
  },
  supplierId: "supplier-1",
  supplierName: "Distribuidora Andina"
}];

const engineState = {
  executionInProgress: false,
  latestExecution: null,
  stale: true
} as StockPlanningEngineState;

let cleanup: (() => Promise<void>) | undefined;

beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});

afterEach(async () => {
  await cleanup?.();
  cleanup = undefined;
});

async function render(content: ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  await act(async () => root.render(content));
  cleanup = async () => {
    await act(async () => root.unmount());
    container.remove();
  };

  return container;
}

describe("stock planning replenishment presentation", () => {
  it("shows four product-count metrics and the calculation state", async () => {
    const container = await render(
      <ReplenishmentDashboard
        engineState={engineState}
        loading={false}
        summary={supplierGroups[0]!.summary}
      />
    );

    expect(container.textContent).toContain("Productos evaluados2");
    expect(container.textContent).toContain("Requieren reabastecimiento1");
    expect(container.textContent).toContain("Críticos con riesgo1");
    expect(container.textContent).toContain("Riesgo de vencimiento1");
    expect(container.textContent).toContain("Estado del último cálculoDesactualizado");
    expect(container.textContent).toContain("Productos, no unidades incompatibles");
  });

  it("prioritizes critical stockout and communicates recommendation, draft, cost and warning states", async () => {
    const onAnalyze = vi.fn();
    const container = await render(
      <ReplenishmentTable
        groups={[]}
        products={[referenceProduct, recommendationProduct]}
        onAnalyze={onAnalyze}
        onEdit={vi.fn()}
      />
    );
    const text = container.textContent ?? "";

    expect(text.indexOf("Paracetamol 500 mg")).toBeLessThan(text.indexOf("Ibuprofeno 400 mg"));
    expect(text).toContain("1 · Agotamiento crítico");
    expect(text).toContain("Seguridad: 4");
    expect(text).toContain("Meta: 14 tab");
    expect(text).toContain("12 tab");
    expect(text).toContain("Caja");
    expect(text).toContain("Bs");
    expect(text).toContain("30 días");
    expect(text).toContain("Confianza alta");
    expect(text).toContain("Cálculo desactualizado");
    expect(text).toContain("2 borrador(es) · 50 tab");
    expect(text).toContain("no se descuenta de la sugerencia");
    expect(text).toContain("Sin presentación preferida");
    expect(text).toContain("Sin costo confiable");

    const analyzeButtons = [...container.querySelectorAll("button")]
      .filter((button) => button.textContent === "Analizar");
    await act(async () => analyzeButtons[0]!.click());
    expect(onAnalyze).toHaveBeenCalledWith(recommendationProduct);
  });

  it("explains that supplier grouping is organizational only", async () => {
    const container = await render(
      <ReplenishmentTable
        groups={supplierGroups}
        products={[referenceProduct, recommendationProduct]}
        onAnalyze={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(container.textContent).toContain("Distribuidora Andina");
    expect(container.textContent).toContain("no interviene en demanda, confianza ni cantidad sugerida");
  });

  it("submits every administrative filter and supplier grouping", async () => {
    const onApply = vi.fn<(filters: StockPlanningFilters) => void>();
    const container = await render(
      <ReplenishmentFilters
        disabled={false}
        products={[recommendationProduct]}
        onApply={onApply}
      />
    );
    const input = container.querySelector("input")!;
    const selects = [...container.querySelectorAll("select")];

    await act(async () => {
      change(input, "Paracetamol");
      change(selects[0]!, "category-1");
      change(selects[1]!, "supplier-1");
      change(selects[2]!, "critical");
      change(selects[3]!, "operational");
      change(selects[4]!, "high");
      change(selects[5]!, "expiry");
      change(selects[6]!, "supplier");
    });
    await act(async () => {
      (container.querySelector("form") as HTMLFormElement).requestSubmit();
    });

    expect(onApply).toHaveBeenCalledWith({
      categoryId: "category-1",
      confidence: "high",
      criticality: "critical",
      groupBy: "supplier",
      maturity: "operational",
      risk: "expiry",
      search: "Paracetamol",
      supplierId: "supplier-1"
    });
  });

  it("renders prioritized administrative alerts", async () => {
    const alerts: StockPlanningAlert[] = [{
      executionId: "execution-1",
      id: "alert-1",
      message: "El producto crítico podría agotarse.",
      priority: "critical",
      productId: "product-1",
      type: "critical_stockout"
    }];
    const container = await render(<PredictiveAlerts alerts={alerts} />);

    expect(container.textContent).toContain("Alertas predictivas administrativas");
    expect(container.textContent).toContain("Prioridad crítica");
    expect(container.textContent).toContain("no se muestran al rol Vendedor");
  });
});

function change(element: HTMLInputElement | HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    element instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLSelectElement.prototype,
    "value"
  )?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("change", { bubbles: true }));
}
