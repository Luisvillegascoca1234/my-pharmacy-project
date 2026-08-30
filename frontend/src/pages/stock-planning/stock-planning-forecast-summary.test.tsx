import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import type {
  StockPlanningProduct,
  StockPlanningProductAnalytics
} from "@/modules/stock-planning";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  ForecastConfidenceGuide,
  ForecastDemandCell,
  ForecastMaturityCell,
  ForecastQualityCell,
  ForecastWarnings,
  StaleForecastNotice
} from "./stock-planning-forecast-summary";

const referenceProduct: StockPlanningProduct = {
  baseUnitAbbreviation: "tab",
  categoryId: "category-1",
  categoryName: "Analgésicos",
  commercialName: "Analgésico prueba",
  confidence: "none",
  coverage: { days: 30, source: "global" },
  criticality: "normal",
  internalCode: "MED-001",
  maturity: "no_history",
  minimumStock: 20,
  productId: "product-1",
  result: {
    kind: "configured_reference",
    quantityBase: 12,
    wasRounded: false
  },
  supplierId: "supplier-1",
  supplierName: "Proveedor prueba",
  usableStock: 8,
  warnings: ["missing_preferred_presentation"]
};

const forecastProduct: StockPlanningProduct = {
  ...referenceProduct,
  confidence: "low",
  maturity: "low_confidence",
  forecast: {
    centralDemand: 90,
    censoredDays: 34,
    demandDays: 18,
    engineVersion: "explainable-forecast-v1",
    executionId: "execution-previous",
    fingerprint: "forecast-fingerprint",
    historyDays: 120,
    lower80: 60,
    metrics: {
      bias: -0.25,
      evaluatedPoints: 28,
      meanAbsoluteError: 1.5,
      scaledError: 0.9
    },
    model: "recent_naive",
    parameters: { window: 28 },
    points: [],
    rulesVersion: "forecast-rules-v1",
    upper80: 130
  },
  warnings: ["baseline_retained", "high_censorship", "censored_days_excluded"]
};

const referenceAnalytics: StockPlanningProductAnalytics = {
  available: false,
  baselineRetained: false,
  degraded: false,
  evidenceLimited: true,
  freshness: "reference",
  intervalWidth80: null,
  latestCompletedExecutionId: null
};

const staleAnalytics: StockPlanningProductAnalytics = {
  available: true,
  baselineRetained: true,
  degraded: true,
  evidenceLimited: true,
  freshness: "stale",
  intervalWidth80: 70,
  latestCompletedExecutionId: "execution-current"
};

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

describe("stock planning forecast communication", () => {
  it("explains confidence as evidence, performance, censorship and width rather than accuracy", async () => {
    const container = await render(<ForecastConfidenceGuide />);

    expect(container.textContent).toContain("no representa una probabilidad de acierto");
    expect(container.textContent).toContain("Datos disponibles");
    expect(container.textContent).toContain("Desempeño");
    expect(container.textContent).toContain("Días sin stock");
    expect(container.textContent).toContain("Amplitud");
  });

  it("keeps the configured reference explicit when no forecast is enabled", async () => {
    const container = await render(
      <ForecastDemandCell analytics={referenceAnalytics} product={referenceProduct} />
    );

    expect(container.textContent).toContain("12 tab");
    expect(container.textContent).toContain("Referencia configurada · no es pronóstico");
    expect(container.textContent).toContain("no exista evidencia habilitada");
  });

  it("shows forecast units, baseline, degradation, censorship and stale fallback", async () => {
    const container = await render(
      <div>
        <ForecastMaturityCell analytics={staleAnalytics} product={forecastProduct} />
        <ForecastDemandCell analytics={staleAnalytics} product={forecastProduct} />
        <ForecastQualityCell analytics={staleAnalytics} product={forecastProduct} />
        <ForecastWarnings analytics={staleAnalytics} product={forecastProduct} />
        <StaleForecastNotice products={[{ analytics: staleAnalytics, product: forecastProduct }]} />
      </div>
    );

    expect(container.textContent).toContain("Baja confianza");
    expect(container.textContent).toContain("Último resultado disponible · desactualizado");
    expect(container.textContent).toContain("Banda central 80%: 60–130 tab");
    expect(container.textContent).toContain("Error absoluto: 1,5 tab/día");
    expect(container.textContent).toContain("Sesgo: -0,25 tab/día");
    expect(container.textContent).toContain("34 días completos sin stock");
    expect(container.textContent).toContain("Se conservó el método anterior");
    expect(container.textContent).toContain("Hay pocos datos confiables");
  });

  it.each([
    ["no_history", "none", "Sin historial"],
    ["low_confidence", "low", "Baja confianza"],
    ["operational", "high", "Datos suficientes"],
    ["no_observed_demand", "none", "Sin demanda observada"]
  ] as const)("renders maturity %s as %s", async (maturity, confidence, expectedLabel) => {
    const product: StockPlanningProduct = {
      ...forecastProduct,
      confidence,
      maturity
    };
    const container = await render(
      <ForecastMaturityCell analytics={staleAnalytics} product={product} />
    );

    expect(container.textContent).toContain(expectedLabel);
  });
});
