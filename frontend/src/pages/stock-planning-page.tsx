import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ClipboardPenLine,
  PackageCheck,
  RefreshCcw,
  ShieldAlert,
  Sparkles
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { StockCriticalitySchema } from "@pharmacy-pos/shared";
import {
  type StockCriticality,
  type StockPlanningDataError,
  type StockPlanningPresentationOption,
  type StockPlanningProduct,
  mapStockPlanningProductAnalytics,
  useStockPlanning
} from "@/modules/stock-planning";
import { ForecastConfidenceGuide, StaleForecastNotice } from "@/pages/stock-planning/stock-planning-forecast-summary";
import { StockPlanningGovernance } from "@/pages/stock-planning/stock-planning-governance";
import { StockPlanningDetail } from "@/pages/stock-planning/stock-planning-detail";
import {
  PredictiveAlerts,
  ReplenishmentDashboard,
  ReplenishmentFilters,
  ReplenishmentTable
} from "@/pages/stock-planning/stock-planning-replenishment";
import { StockPlanningParquetExports } from "@/pages/stock-planning/stock-planning-parquet-exports";

const quantityFormatter = new Intl.NumberFormat("es-BO", {
  maximumFractionDigits: 4
});

export function StockPlanningPage() {
  const planning = useStockPlanning();
  const [editingProduct, setEditingProduct] = useState<StockPlanningProduct | null>(null);
  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const productAnalytics = useMemo(
    () => planning.products.map((product) => ({
      analytics:
        planning.analyticsByProductId[product.productId] ??
        mapStockPlanningProductAnalytics(product, planning.executions),
      product
    })),
    [planning.analyticsByProductId, planning.executions, planning.products]
  );

  if (!planning.canAccess) {
    return (
      <section className="mx-auto grid max-w-3xl gap-5">
        <Alert variant="destructive">
          <ShieldAlert aria-hidden="true" />
          <AlertTitle>Acceso no autorizado</AlertTitle>
          <AlertDescription>Tu rol actual no permite consultar la planificación administrativa de stock.</AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="relative overflow-hidden rounded-xl border bg-card">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-muted/40 lg:block" />
        <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div className="space-y-3">
            <Badge className="w-fit" variant="secondary">
              Inventario farmacéutico
            </Badge>
            <div className="max-w-3xl space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Planificación de stock</h1>
              <p className="text-sm leading-6 text-muted-foreground">
                Convierte la historia operativa en una señal consultiva de abastecimiento. Cada producto conserva su
                madurez, trayectoria, banda predictiva y límites de evidencia sin confundir una referencia con un pronóstico.
              </p>
            </div>
          </div>
          <div className="grid gap-2 rounded-lg border bg-background/80 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles aria-hidden="true" className="size-4 text-primary" />
              Lectura analítica gradual
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              La referencia configurada permanece hasta que la historia habilita una predicción. La confianza resume
              calidad de evidencia, no una garantía de disponibilidad futura.
            </p>
          </div>
        </div>
      </div>

      <ReplenishmentDashboard
        engineState={planning.engineState}
        loading={planning.status === "loading"}
        summary={planning.summary}
      />

      <StockPlanningGovernance
        canGovern={planning.canGovern}
        configuration={planning.configuration}
        engineState={planning.engineState}
        error={planning.governanceError}
        executions={planning.executions}
        operation={planning.governanceStatus}
        onRun={planning.runManualExecution}
        onSave={planning.updateConfiguration}
      />

      <ForecastConfidenceGuide />
      <StaleForecastNotice products={productAnalytics} />
      <ReplenishmentFilters
        disabled={planning.status === "loading"}
        products={planning.products}
        onApply={(filters) => void planning.load(filters)}
      />
      <StockPlanningParquetExports
        executions={planning.executions}
        products={planning.products}
        surface="stock-planning"
      />
      <PredictiveAlerts alerts={planning.alerts} />

      <Card>
        <CardHeader className="gap-4 border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Recomendaciones priorizadas</CardTitle>
              <CardDescription>
                Demanda, seguridad, meta, sugerencia y riesgos en unidad base. Esta superficie no crea compras ni modifica lotes.
              </CardDescription>
            </div>
            <Button
              disabled={planning.status === "loading"}
              type="button"
              variant="outline"
              onClick={() => void planning.load()}
            >
              {planning.status === "loading" ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <PlanningState
            status={planning.status}
            onRetry={() => void planning.load()}
          />

          <ReplenishmentTable
            groups={planning.groups}
            products={planning.products}
            onAnalyze={(product) => {
              setDetailProductId(product.productId);
              void planning.loadDetail(product.productId);
            }}
            onEdit={(product) => {
              planning.clearUpdateError();
              setEditingProduct(product);
            }}
          />
        </CardContent>
      </Card>

      <StockPlanningDetail
        data={planning.detailData}
        open={detailProductId !== null}
        status={planning.detailStatus}
        onExecutionChange={(productId, executionId) => void planning.loadDetail(productId, executionId)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailProductId(null);
            planning.clearDetail();
          }
        }}
        onRetry={() => {
          if (detailProductId) void planning.loadDetail(detailProductId);
        }}
      />

      <ConfigurationDialog
        key={editingProduct?.productId ?? "closed"}
        globalCoverageDays={planning.configuration?.coverageDays ?? 30}
        open={editingProduct !== null}
        presentationOptions={
          editingProduct ? planning.presentationOptionsByProductId[editingProduct.productId] ?? [] : []
        }
        product={editingProduct}
        updateError={planning.updateError}
        updating={planning.updatingProductId === editingProduct?.productId}
        onOpenChange={(open) => {
          if (!open) {
            planning.clearUpdateError();
            setEditingProduct(null);
          }
        }}
        onSave={async (productId, input) => {
          const saved = await planning.updateProduct(productId, input);

          if (saved) {
            setEditingProduct(null);
          }
        }}
      />
    </section>
  );
}

function PlanningState({
  status,
  onRetry
}: {
  status: ReturnType<typeof useStockPlanning>["status"];
  onRetry: () => void;
}) {
  if (status === "loading") {
    return (
      <div className="grid gap-3 p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Consultando productos y referencias configuradas…
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (status === "empty") {
    return (
      <Empty className="m-5 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageCheck aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>Catálogo activo vacío</EmptyTitle>
          <EmptyDescription>
            Registra o activa productos farmacéuticos para preparar su criticidad, cobertura y presentación.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (status === "forbidden") {
    return (
      <Alert className="m-5" variant="destructive">
        <ShieldAlert aria-hidden="true" />
        <AlertTitle>Permiso insuficiente</AlertTitle>
        <AlertDescription>La sesión actual no puede consultar planificación de stock.</AlertDescription>
      </Alert>
    );
  }

  if (status === "error") {
    return (
      <Alert className="m-5" variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>No se pudo cargar la planificación</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>La consulta falló. Puedes volver a intentar sin perder cambios ya guardados.</span>
          <Button size="sm" type="button" variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

type ConfigurationDialogProps = {
  globalCoverageDays: number;
  open: boolean;
  presentationOptions: StockPlanningPresentationOption[];
  product: StockPlanningProduct | null;
  updateError: StockPlanningDataError | null;
  updating: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    productId: string,
    input: {
      coverageDays: number | null;
      criticality: StockCriticality;
      preferredPresentationId: string | null;
    }
  ) => Promise<void>;
};

function ConfigurationDialog({
  globalCoverageDays,
  open,
  presentationOptions,
  product,
  updateError,
  updating,
  onOpenChange,
  onSave
}: ConfigurationDialogProps) {
  const [criticality, setCriticality] = useState<StockCriticality>(product?.criticality ?? "normal");
  const [coverageMode, setCoverageMode] = useState<"global" | "product">(product?.coverage.source ?? "global");
  const [coverageDays, setCoverageDays] = useState(String(product?.coverage.days ?? globalCoverageDays));
  const [preferredPresentationId, setPreferredPresentationId] = useState(
    product?.result.preferredPresentation?.id ?? ""
  );
  const parsedCoverageDays = Number(coverageDays);
  const coverageIsValid =
    coverageMode === "global" ||
    (Number.isInteger(parsedCoverageDays) && parsedCoverageDays >= 1 && parsedCoverageDays <= 365);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!product || !coverageIsValid) {
      return;
    }

    await onSave(product.productId, {
      coverageDays: coverageMode === "global" ? null : parsedCoverageDays,
      criticality,
      preferredPresentationId: preferredPresentationId || null
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form className="contents" onSubmit={(event) => void handleSubmit(event)}>
          <DialogHeader>
            <DialogTitle>Parámetros de reposición</DialogTitle>
            <DialogDescription>
              {product
                ? `${product.commercialName} · ${product.internalCode}. Los cambios afectan referencias futuras y no modifican inventario.`
                : "Selecciona un producto para editar su configuración."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {updateError ? (
              <Alert variant="destructive">
                <AlertCircle aria-hidden="true" />
                <AlertTitle>No se guardaron los cambios</AlertTitle>
                <AlertDescription>{getUpdateErrorMessage(updateError)}</AlertDescription>
              </Alert>
            ) : null}

            <Field label="Criticidad farmacéutica">
              <NativeSelect
                className="w-full"
                value={criticality}
                onChange={(event) => {
                  const result = StockCriticalitySchema.safeParse(event.target.value);
                  if (result.success) setCriticality(result.data);
                }}
              >
                <NativeSelectOption value="normal">Normal · protección 90%</NativeSelectOption>
                <NativeSelectOption value="high">Alta · protección 95%</NativeSelectOption>
                <NativeSelectOption value="critical">Crítica · protección 99%</NativeSelectOption>
              </NativeSelect>
            </Field>

            <Field label="Origen de cobertura">
              <NativeSelect
                className="w-full"
                value={coverageMode}
                onChange={(event) => {
                  if (event.target.value === "global" || event.target.value === "product") {
                    setCoverageMode(event.target.value);
                  }
                }}
              >
                <NativeSelectOption value="global">Heredar cobertura global ({globalCoverageDays} días)</NativeSelectOption>
                <NativeSelectOption value="product">Usar cobertura específica</NativeSelectOption>
              </NativeSelect>
            </Field>

            {coverageMode === "product" ? (
              <Field label="Cobertura específica en días">
                <Input
                  aria-invalid={!coverageIsValid}
                  max={365}
                  min={1}
                  step={1}
                  type="number"
                  value={coverageDays}
                  onChange={(event) => setCoverageDays(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">Admite entre 1 y 365 días.</p>
              </Field>
            ) : (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                El producto seguirá automáticamente la cobertura global vigente de {globalCoverageDays} días.
              </div>
            )}

            <Field label="Presentación preferida de reposición">
              <NativeSelect
                className="w-full"
                value={preferredPresentationId}
                onChange={(event) => setPreferredPresentationId(event.target.value)}
              >
                <NativeSelectOption value="">Sin presentación · mantener unidad base</NativeSelectOption>
                {presentationOptions.map((option) => (
                  <NativeSelectOption key={option.id} value={option.id}>
                    {option.name} ({option.abbreviation}) · {quantityFormatter.format(option.conversionFactor)} unidades base
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              {presentationOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Este producto todavía no tiene conversiones comerciales configuradas.
                </p>
              ) : null}
            </Field>
          </div>

          <DialogFooter>
            <Button disabled={updating} type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button disabled={updating || !coverageIsValid || !product} type="submit">
              {updating ? <Spinner /> : <ClipboardPenLine aria-hidden="true" />}
              Guardar parámetros
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getUpdateErrorMessage(error: StockPlanningDataError) {
  switch (error.code) {
    case "forbidden":
      return "Tu rol ya no permite modificar estos parámetros.";
    case "not-found":
      return "El producto ya no está disponible en el catálogo activo.";
    case "session-invalid":
      return "La sesión dejó de ser válida. Vuelve a iniciar sesión antes de guardar.";
    case "validation":
      return "Revisa la cobertura y la presentación seleccionada antes de intentarlo nuevamente.";
    default:
      return "Ocurrió un problema al guardar. Inténtalo nuevamente.";
  }
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
