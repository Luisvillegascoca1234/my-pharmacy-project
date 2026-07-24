import {
  Activity,
  AlertTriangle,
  BarChart3,
  CircleGauge,
  ClockAlert,
  DatabaseZap,
  History,
  ScanSearch
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  StockPlanningProduct,
  StockPlanningProductAnalytics
} from "@/modules/stock-planning";
import {
  stockPlanningConfidenceLabels,
  stockPlanningMaturityLabels,
  stockPlanningModelLabels
} from "./stock-planning-labels";

const quantityFormatter = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 4 });
const decimalFormatter = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 3 });

const warningLabels: Record<string, string> = {
  backtest_unavailable: "Backtesting insuficiente",
  baseline_retained: "Baseline retenido",
  censored_days_excluded: "Días sin stock excluidos",
  high_censorship: "Censura elevada",
  insufficient_history: "Historia insuficiente",
  limited_evidence: "Evidencia limitada",
  missing_preferred_presentation: "Falta presentación preferida",
  no_observed_demand: "Sin salidas observadas"
};

export function ForecastConfidenceGuide() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/25">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border bg-background p-2">
            <CircleGauge className="size-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>Cómo leer la confianza analítica</CardTitle>
            <CardDescription className="mt-1 max-w-4xl leading-5">
              Baja, media o alta resume la calidad disponible; no representa una probabilidad de acierto ni elimina el
              criterio farmacéutico.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-px bg-border p-0 sm:grid-cols-2 xl:grid-cols-4">
        <ConfidenceFactor
          icon={History}
          title="Evidencia"
          description="Historia completa y cantidad de días con demanda observada."
        />
        <ConfidenceFactor
          icon={BarChart3}
          title="Desempeño"
          description="Error y sesgo medidos en backtesting cronológico."
        />
        <ConfidenceFactor
          icon={DatabaseZap}
          title="Censura"
          description="Días completos sin stock, que no se interpretan como demanda cero."
        />
        <ConfidenceFactor
          icon={ScanSearch}
          title="Amplitud"
          description="Separación entre los límites de la banda predictiva central del 80%."
        />
      </CardContent>
    </Card>
  );
}

function ConfidenceFactor({
  icon: Icon,
  title,
  description
}: {
  icon: typeof History;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3 bg-card p-4">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function ForecastMaturityCell({
  analytics,
  product
}: {
  analytics: StockPlanningProductAnalytics;
  product: StockPlanningProduct;
}) {
  const confidence = product.confidence ?? "none";

  return (
    <div className="min-w-48 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        <Badge variant={product.maturity === "operational" ? "default" : "secondary"}>
          {stockPlanningMaturityLabels[product.maturity]}
        </Badge>
        {confidence !== "none" ? <Badge variant="outline">Confianza {stockPlanningConfidenceLabels[confidence].toLowerCase()}</Badge> : null}
      </div>
      {analytics.freshness === "stale" ? (
        <p className="flex items-start gap-1.5 text-xs font-medium text-destructive">
          <ClockAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Último resultado disponible · desactualizado
        </p>
      ) : null}
      {analytics.evidenceLimited ? (
        <p className="text-xs leading-5 text-muted-foreground">
          {product.maturity === "no_observed_demand"
            ? "La historia suficiente no contiene salidas netas observadas."
            : "La evidencia todavía limita el uso operativo del resultado."}
        </p>
      ) : null}
    </div>
  );
}

export function ForecastDemandCell({
  analytics,
  product
}: {
  analytics: StockPlanningProductAnalytics;
  product: StockPlanningProduct;
}) {
  const forecast = product.forecast;

  if (!forecast) {
    return (
      <div className="min-w-52">
        <p className="font-semibold">
          {quantityFormatter.format(product.result.quantityBase)} {product.baseUnitAbbreviation}
        </p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">Referencia configurada · no es pronóstico</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Se conserva mientras no exista evidencia habilitada para pronosticar.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-56 space-y-1">
      <p className="font-semibold">
        {quantityFormatter.format(forecast.centralDemand)} {product.baseUnitAbbreviation}
      </p>
      <p className="text-xs text-muted-foreground">Demanda prevista acumulada · {product.coverage.days} días</p>
      <p className="text-xs">
        Banda central 80%:{" "}
        <span className="font-medium">
          {quantityFormatter.format(forecast.lower80)}–{quantityFormatter.format(forecast.upper80)}{" "}
          {product.baseUnitAbbreviation}
        </span>
      </p>
      <p className="text-xs text-muted-foreground">
        Amplitud: {quantityFormatter.format(analytics.intervalWidth80 ?? 0)} {product.baseUnitAbbreviation}
      </p>
    </div>
  );
}

export function ForecastQualityCell({
  analytics,
  product
}: {
  analytics: StockPlanningProductAnalytics;
  product: StockPlanningProduct;
}) {
  const forecast = product.forecast;

  if (!forecast) {
    return <span className="text-sm text-muted-foreground">Sin modelo ni backtesting disponibles</span>;
  }

  return (
    <div className="min-w-60 space-y-1.5 text-xs">
      <p className="text-sm font-medium">
        {forecast.model ? stockPlanningModelLabels[forecast.model] : "Sin modelo seleccionado"}
      </p>
      <p>
        Error absoluto:{" "}
        <span className="font-medium">
          {decimalFormatter.format(forecast.metrics.meanAbsoluteError)} {product.baseUnitAbbreviation}/día
        </span>
      </p>
      <p>
        Error escalado: <span className="font-medium">{decimalFormatter.format(forecast.metrics.scaledError)}</span>{" "}
        <span className="text-muted-foreground">(índice adimensional)</span>
      </p>
      <p>
        Sesgo:{" "}
        <span className="font-medium">
          {decimalFormatter.format(forecast.metrics.bias)} {product.baseUnitAbbreviation}/día
        </span>
      </p>
      <p>
        Censura: <span className="font-medium">{forecast.censoredDays} días completos sin stock</span>
      </p>
      <p className="text-muted-foreground">
        Evidencia: {forecast.historyDays} días de historia · {forecast.demandDays} días con demanda
      </p>
      {analytics.baselineRetained ? (
        <p className="flex items-start gap-1.5 rounded-md border bg-muted/30 p-2 leading-4">
          <Activity className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Se retuvo el baseline porque ningún candidato demostró una mejora suficiente.
        </p>
      ) : null}
      {analytics.degraded ? (
        <p className="flex items-start gap-1.5 rounded-md border bg-muted/30 p-2 leading-4">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          La madurez se redujo por calidad de evidencia; el cálculo sigue siendo consultivo.
        </p>
      ) : null}
    </div>
  );
}

export function ForecastWarnings({
  analytics,
  product
}: {
  analytics: StockPlanningProductAnalytics;
  product: StockPlanningProduct;
}) {
  const visibleWarnings = product.warnings.filter((warning) => warning !== "baseline_retained");

  if (visibleWarnings.length === 0 && analytics.freshness !== "stale") {
    return <Badge variant="secondary">Sin advertencias analíticas</Badge>;
  }

  return (
    <div className="flex min-w-48 flex-wrap gap-1.5">
      {analytics.freshness === "stale" ? (
        <Badge variant="destructive">
          <ClockAlert aria-hidden="true" />
          Resultado desactualizado
        </Badge>
      ) : null}
      {visibleWarnings.map((warning) => (
        <Badge key={warning} variant="outline">
          {warningLabels[warning] ?? "Advertencia del cálculo"}
        </Badge>
      ))}
    </div>
  );
}

export function StaleForecastNotice({ products }: { products: Array<{
  analytics: StockPlanningProductAnalytics;
  product: StockPlanningProduct;
}> }) {
  const staleCount = products.filter(({ analytics }) => analytics.freshness === "stale").length;

  if (staleCount === 0) return null;

  return (
    <Alert>
      <ClockAlert aria-hidden="true" />
      <AlertTitle>Hay resultados conservados de una ejecución anterior</AlertTitle>
      <AlertDescription>
        {staleCount} producto(s) no recibió un resultado nuevo en la última ejecución completada. Se muestra su último
        pronóstico disponible como desactualizado, sin ocultar los resultados vigentes de los demás productos.
      </AlertDescription>
    </Alert>
  );
}
