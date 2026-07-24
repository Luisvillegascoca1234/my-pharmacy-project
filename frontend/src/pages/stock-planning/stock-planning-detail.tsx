import {
  Activity,
  AlertTriangle,
  Ban,
  Boxes,
  GitCompareArrows,
  Sigma
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  StockPlanningDetailData,
  StockPlanningDetailStatus,
  StockPlanningProductDetailResponse
} from "@/modules/stock-planning";
import { StockPlanningCharts } from "./stock-planning-charts";
import {
  stockPlanningConfidenceLabels,
  stockPlanningMaturityLabels,
  stockPlanningModelLabels
} from "./stock-planning-labels";

const quantityFormatter = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 3 });
const dateFormatter = new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/La_Paz"
});


type StockPlanningDetailProps = {
  data: StockPlanningDetailData | null;
  open: boolean;
  status: StockPlanningDetailStatus;
  onExecutionChange: (productId: string, executionId: string) => void;
  onOpenChange: (open: boolean) => void;
  onRetry: () => void;
};

export function StockPlanningDetail({
  data,
  open,
  status,
  onExecutionChange,
  onOpenChange,
  onRetry
}: StockPlanningDetailProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,90rem)]">
        <DialogHeader className="border-b bg-muted/25 px-5 py-4 pr-14">
          <DialogTitle className="flex flex-wrap items-center gap-2 text-lg">
            <Activity aria-hidden="true" className="size-5 text-primary" />
            Análisis temporal del producto
            {data?.detail.product.status === "inactive" ? <Badge variant="secondary">Inactivo</Badge> : null}
          </DialogTitle>
          <DialogDescription>
            {data
              ? `${data.detail.product.commercialName} · ${data.detail.product.internalCode} · lectura histórica en ${data.detail.product.baseUnitAbbreviation}`
              : "Demanda, inventario, desempeño y trazabilidad por ejecución."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="min-h-0 flex-1">
          <div className="grid gap-5 p-5">
            {status === "loading" ? <DetailSkeleton /> : null}
            {status === "error" ? (
              <Alert variant="destructive">
                <AlertTriangle aria-hidden="true" />
                <AlertTitle>No se pudo abrir el análisis</AlertTitle>
                <AlertDescription className="flex items-center justify-between gap-3">
                  La evidencia histórica no está disponible en este momento.
                  <Button size="sm" type="button" variant="outline" onClick={onRetry}>Reintentar</Button>
                </AlertDescription>
              </Alert>
            ) : null}
            {status === "success" && data ? (
              <DetailContent data={data} onExecutionChange={onExecutionChange} />
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function DetailContent({
  data,
  onExecutionChange
}: {
  data: StockPlanningDetailData;
  onExecutionChange: (productId: string, executionId: string) => void;
}) {
  const { detail, analytics } = data;
  const result = detail.result;
  const latestSnapshot = detail.snapshots.at(-1);

  return (
    <>
      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Modelo" value={stockPlanningModelLabels[result.model ?? "none"]} detail={`Motor ${detail.execution.engineVersion}`} />
          <Metric label="Madurez" value={stockPlanningMaturityLabels[result.maturity]} detail={`${result.historyDays} días de historia`} />
          <Metric label="Confianza" value={stockPlanningConfidenceLabels[result.confidence]} detail="Calidad de evidencia, no probabilidad" />
          <Metric label="Censura" value={`${result.censoredDays} días`} detail={`${result.demandDays} días con demanda`} />
        </div>
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="grid gap-2 p-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="planning-execution">
              Ejecución analizada
            </label>
            <NativeSelect
              id="planning-execution"
              value={detail.execution.id}
              onChange={(event) => onExecutionChange(detail.product.id, event.target.value)}
            >
              {detail.history.map((execution) => (
                <NativeSelectOption key={execution.executionId} value={execution.executionId}>
                  {formatDateTime(execution.startedAt)} · {stockPlanningConfidenceLabels[execution.confidence]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <p className="text-xs leading-5 text-muted-foreground">
              Abre por defecto la última ejecución exitosa. La comparación usa su anterior inmediata.
            </p>
          </CardContent>
        </Card>
      </section>

      {detail.laterFailedExecutions.length > 0 ? (
        <Alert variant="destructive">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>Se conserva la última ejecución exitosa</AlertTitle>
          <AlertDescription>
            Hubo {detail.laterFailedExecutions.length} fallo(s) posterior(es). El análisis visible sigue siendo la última evidencia válida;
            el más reciente ocurrió el {formatDateTime(detail.laterFailedExecutions.at(-1)!.startedAt)}.
          </AlertDescription>
        </Alert>
      ) : null}

      {!detail.recommendationAvailable ? (
        <Alert>
          <Ban aria-hidden="true" />
          <AlertTitle>Historia conservada sin recomendación vigente</AlertTitle>
          <AlertDescription>
            Este producto está inactivo. Sus resultados permanecen disponibles para auditoría, pero no se presenta una cantidad sugerida
            como recomendación operativa.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <StockPlanningCharts
          analytics={analytics}
          baseUnitAbbreviation={detail.product.baseUnitAbbreviation}
        />

        <ComparisonCard detail={detail} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2"><Boxes className="size-4" /> Lotes y vencimientos</CardTitle>
            <CardDescription>Composición del snapshot más reciente, con estado y disponibilidad por lote.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 pt-4">
            {latestSnapshot?.lots.length ? latestSnapshot.lots.map((lot) => (
              <div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center" key={lot.batchId}>
                <div>
                  <p className="font-medium">{lot.batchNumber ?? "Lote sin número"}</p>
                  <p className="text-xs text-muted-foreground">
                    Vence: {lot.expirationDate ? formatDate(lot.expirationDate) : "sin fecha registrada"}
                  </p>
                </div>
                <Badge variant={lot.status === "active" ? "outline" : "secondary"}>{batchStatusLabels[lot.status]}</Badge>
                <p className="font-mono text-sm font-semibold tabular-nums">
                  {quantityFormatter.format(lot.availableQuantity)} {detail.product.baseUnitAbbreviation}
                </p>
              </div>
            )) : <p className="text-sm text-muted-foreground">El snapshot seleccionado no contiene lotes disponibles.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2"><Sigma className="size-4" /> Fórmula y evidencia</CardTitle>
            <CardDescription>Regla reproducible, parámetros y huella de la ejecución seleccionada.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4">
            <code className="block overflow-x-auto rounded-lg border bg-muted/35 p-3 text-xs leading-5">{result.formula}</code>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(result.parameters).length === 0 ? (
                <p className="text-sm text-muted-foreground sm:col-span-2">Esta ejecución no utilizó parámetros de modelo.</p>
              ) : Object.entries(result.parameters).map(([key, value]) => (
                <div className="rounded-md border px-3 py-2" key={key}>
                  <p className="text-xs text-muted-foreground">{parameterLabels[key] ?? "Parámetro técnico"}</p>
                  <p className="mt-1 font-mono text-sm">{formatParameterValue(value)}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-1 text-xs text-muted-foreground">
              <p>Versión de configuración: {detail.execution.configurationVersion}</p>
              <p className="break-all">Huella: {detail.execution.fingerprint}</p>
              <p>Zona operativa: {detail.timezone}</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}

function ComparisonCard({ detail }: { detail: StockPlanningProductDetailResponse }) {
  const comparison = detail.comparison;
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2"><GitCompareArrows className="size-4" /> Comparación inmediata</CardTitle>
        <CardDescription>Cambios contra la ejecución exitosa anterior, sin reescribir resultados.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 pt-4">
        {!comparison ? (
          <p className="text-sm text-muted-foreground">No existe una ejecución anterior comparable.</p>
        ) : (
          <>
            <Delta change={comparison.demand} label="Demanda prevista" unit={detail.product.baseUnitAbbreviation} />
            <Delta change={comparison.targetStock} label="Meta de inventario" unit={detail.product.baseUnitAbbreviation} />
            <Delta change={comparison.suggestedQuantity} label="Cantidad sugerida" unit={detail.product.baseUnitAbbreviation} />
            <div className="grid grid-cols-2 gap-3 rounded-lg border p-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Modelo anterior → actual</p>
                <p className="mt-1 font-medium">{stockPlanningModelLabels[comparison.model.previous ?? "none"]} → {stockPlanningModelLabels[comparison.model.current ?? "none"]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Confianza anterior → actual</p>
                <p className="mt-1 font-medium">{stockPlanningConfidenceLabels[comparison.confidence.previous]} → {stockPlanningConfidenceLabels[comparison.confidence.current]}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Delta({
  change,
  label,
  unit
}: {
  change: { current: number; delta: number; previous: number } | null;
  label: string;
  unit: string;
}) {
  return (
    <div className="grid gap-1 rounded-lg border px-3 py-2 sm:grid-cols-[1fr_auto] sm:items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      {change === null ? <span className="text-sm">No aplica</span> : (
        <span className="font-mono text-sm font-semibold tabular-nums">
          {quantityFormatter.format(change.previous)} → {quantityFormatter.format(change.current)} {unit}
          <span className="ml-2 text-muted-foreground">
            ({change.delta > 0 ? "+" : ""}{quantityFormatter.format(change.delta)} {unit})
          </span>
        </span>
      )}
    </div>
  );
}

function Metric({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-2 text-lg font-semibold">{value}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton className="h-28" key={index} />)}</div>
      <div className="grid gap-4 xl:grid-cols-2"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>
    </div>
  );
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00-04:00`));
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

function formatParameterValue(value: string | number | boolean) {
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return typeof value === "number" ? quantityFormatter.format(value) : value;
}

const parameterLabels: Record<string, string> = {
  alpha: "Suavizado de nivel (alfa)",
  beta: "Suavizado de tendencia (beta)",
  biasCorrection: "Corrección de sesgo",
  damped: "Tendencia amortiguada",
  damping: "Factor de amortiguación",
  lookbackDays: "Días retrospectivos",
  periodDays: "Periodo estacional en días",
  probabilityAlpha: "Suavizado de probabilidad",
  quantityAlpha: "Suavizado de cantidad",
  windowDays: "Ventana móvil en días"
};

const batchStatusLabels = { active: "Activo", depleted: "Agotado", blocked: "Bloqueado", cancelled: "Cancelado" } as const;
