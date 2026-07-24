import { useMemo } from "react";
import { Archive, BadgeCheck, CalendarRange, Download, FilterX, Info, ShieldAlert, TableProperties } from "lucide-react";
import type { StockPlanningExecution, StockPlanningProduct } from "@/modules/stock-planning";
import {
  type StockPlanningParquetExportError,
  type StockPlanningParquetExportStatus,
  type StockPlanningParquetFile,
  useExports
} from "@/modules/exports";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";

type FilterOption = { id: string; name: string };

export function StockPlanningParquetExports({
  executions,
  products,
  surface
}: {
  executions: StockPlanningExecution[];
  products: StockPlanningProduct[];
  surface: "exports" | "stock-planning";
}) {
  const exportsState = useExports();
  const productOptions = useMemo(
    () => products
      .map((product) => ({ id: product.productId, name: `${product.commercialName} · ${product.internalCode}` }))
      .sort(compareOptions),
    [products]
  );
  const categoryOptions = useMemo(
    () => uniqueOptions(products.map((product) => ({ id: product.categoryId, name: product.categoryName }))),
    [products]
  );
  const supplierOptions = useMemo(
    () => uniqueOptions(products.map((product) => ({ id: product.supplierId, name: product.supplierName }))),
    [products]
  );
  const successfulExecutions = useMemo(
    () => executions.filter((execution) =>
      execution.status === "succeeded" || execution.status === "succeeded_with_warnings"
    ),
    [executions]
  );
  const filters = exportsState.stockPlanningFilters;
  const datesAreReady = Boolean(filters.fromDate && filters.toDate);

  async function downloadObservations() {
    saveParquetFile(await exportsState.downloadStockPlanningObservationsParquet());
  }

  async function downloadResults() {
    saveParquetFile(await exportsState.downloadStockPlanningResultsParquet());
  }

  function reduceRange() {
    const through = filters.toDate ? new Date(`${filters.toDate}T00:00:00`) : new Date();
    const from = new Date(through);
    from.setDate(from.getDate() - 89);
    exportsState.setStockPlanningFilters({
      fromDate: toLocalDateInput(from),
      toDate: toLocalDateInput(through)
    });
    exportsState.clearStockPlanningObservationsExport();
    exportsState.clearStockPlanningResultsExport();
  }

  return (
    <Card className={surface === "stock-planning" ? "overflow-hidden border-primary/20" : "overflow-hidden"}>
      <CardHeader className="gap-4 border-b bg-muted/15">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Parquet · esquema 1.0.0</Badge>
              <Badge variant="outline">Compresión Zstandard</Badge>
            </div>
            <CardTitle>Datos analíticos de planificación</CardTitle>
            <CardDescription className="mt-1.5 leading-6">
              Define el universo farmacéutico y descarga observaciones históricas o resultados calculados como conjuntos
              independientes, tipados y auditables.
            </CardDescription>
          </div>
          <div className="flex items-start gap-2 rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
            <Archive aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>Generación bajo demanda, sin conservar archivos permanentes.</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 pt-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <FilterField label="Desde · obligatorio">
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(event) => exportsState.setStockPlanningFilters({ fromDate: event.target.value })}
            />
          </FilterField>
          <FilterField label="Hasta · obligatorio">
            <Input
              type="date"
              value={filters.toDate}
              onChange={(event) => exportsState.setStockPlanningFilters({ toDate: event.target.value })}
            />
          </FilterField>
          <FilterField label="Producto">
            <FilterSelect
              emptyLabel="Todos los productos"
              options={productOptions}
              value={filters.productId}
              onChange={(productId) => exportsState.setStockPlanningFilters({ productId })}
            />
          </FilterField>
          <FilterField label="Categoría">
            <FilterSelect
              emptyLabel="Todas las categorías"
              options={categoryOptions}
              value={filters.categoryId}
              onChange={(categoryId) => exportsState.setStockPlanningFilters({ categoryId })}
            />
          </FilterField>
          <FilterField label="Proveedor">
            <FilterSelect
              emptyLabel="Todos los proveedores"
              options={supplierOptions}
              value={filters.supplierId}
              onChange={(supplierId) => exportsState.setStockPlanningFilters({ supplierId })}
            />
          </FilterField>
        </div>

        {!datesAreReady ? (
          <Alert>
            <CalendarRange aria-hidden="true" />
            <AlertTitle>Completa el rango analítico</AlertTitle>
            <AlertDescription>
              Ambas fechas son obligatorias y el intervalo máximo es de cinco años.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-2">
          <ParquetDatasetCard
            description="Demanda bruta, devoluciones, demanda neta, censura y snapshots de stock por fecha. Son observaciones operativas, no pronósticos."
            error={exportsState.stockPlanningObservationsError}
            icon={TableProperties}
            status={exportsState.stockPlanningObservationsStatus}
            title="Serie temporal · observaciones"
            disabled={!exportsState.canDownloadExports || !datesAreReady}
            onDownload={() => void downloadObservations()}
            onReduceRange={reduceRange}
          />

          <ParquetDatasetCard
            description="Trayectoria, banda del 80%, modelo, confianza, métricas y recomendación de una ejecución inmutable. Son resultados calculados."
            error={exportsState.stockPlanningResultsError}
            icon={BadgeCheck}
            status={exportsState.stockPlanningResultsStatus}
            title="Predicciones · resultados calculados"
            disabled={!exportsState.canDownloadExports || !datesAreReady || !filters.executionId}
            onDownload={() => void downloadResults()}
            onReduceRange={reduceRange}
          >
            <FilterField label="Ejecución predictiva · obligatoria">
              <NativeSelect
                className="w-full"
                value={filters.executionId}
                onChange={(event) => exportsState.setStockPlanningFilters({ executionId: event.target.value })}
              >
                <NativeSelectOption value="">Seleccionar ejecución</NativeSelectOption>
                {successfulExecutions.map((execution) => (
                  <NativeSelectOption key={execution.id} value={execution.id}>
                    {formatExecution(execution)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FilterField>
          </ParquetDatasetCard>
        </div>

        {!exportsState.canDownloadExports ? (
          <Alert variant="destructive">
            <ShieldAlert aria-hidden="true" />
            <AlertTitle>Descarga restringida</AlertTitle>
            <AlertDescription>
              Solo Administración y Superadministración pueden generar archivos analíticos. El rol Vendedor no accede a esta operación.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ParquetDatasetCard({
  children,
  description,
  disabled,
  error,
  icon: Icon,
  onDownload,
  onReduceRange,
  status,
  title
}: {
  children?: React.ReactNode;
  description: string;
  disabled: boolean;
  error: StockPlanningParquetExportError | null;
  icon: typeof TableProperties;
  onDownload: () => void;
  onReduceRange: () => void;
  status: StockPlanningParquetExportStatus;
  title: string;
}) {
  const loading = status === "loading";
  return (
    <div className="grid content-start gap-4 rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted/30">
          <Icon aria-hidden="true" className="size-5 text-primary" />
        </span>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
      <DatasetState error={error} status={status} onReduceRange={onReduceRange} />
      <Button disabled={disabled || loading} type="button" onClick={onDownload}>
        {loading ? <Spinner /> : <Download aria-hidden="true" />}
        Descargar Parquet
      </Button>
    </div>
  );
}

function DatasetState({
  error,
  onReduceRange,
  status
}: {
  error: StockPlanningParquetExportError | null;
  onReduceRange: () => void;
  status: StockPlanningParquetExportStatus;
}) {
  if (status === "loading") {
    return <p className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> Generando archivo tipado…</p>;
  }
  if (status === "success") {
    return (
      <Alert>
        <BadgeCheck aria-hidden="true" />
        <AlertTitle>Archivo generado</AlertTitle>
        <AlertDescription>
          La auditoría registra la generación del archivo, no la finalización de la descarga en el navegador.
        </AlertDescription>
      </Alert>
    );
  }
  if (!error) {
    return <p className="flex items-center gap-2 text-sm text-muted-foreground"><Info aria-hidden="true" className="size-4" /> Listo para generar con los filtros actuales.</p>;
  }
  const isLimit = error.code === "row-limit" || error.code === "range-too-large";
  return (
    <Alert variant="destructive">
      <ShieldAlert aria-hidden="true" />
      <AlertTitle>{isLimit ? "El conjunto solicitado supera los límites" : "No se pudo generar este conjunto"}</AlertTitle>
      <AlertDescription className="grid gap-3">
        <span>{getErrorMessage(error)}</span>
        {isLimit ? (
          <Button className="w-fit" size="sm" type="button" variant="outline" onClick={onReduceRange}>
            <FilterX aria-hidden="true" />
            Reducir a 90 días
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

function FilterField({ children, label }: { children: React.ReactNode; label: string }) {
  return <div className="grid gap-1.5"><Label>{label}</Label>{children}</div>;
}

function FilterSelect({
  emptyLabel,
  onChange,
  options,
  value
}: {
  emptyLabel: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  value: string;
}) {
  return (
    <NativeSelect className="w-full" value={value} onChange={(event) => onChange(event.target.value)}>
      <NativeSelectOption value="">{emptyLabel}</NativeSelectOption>
      {options.map((option) => <NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>)}
    </NativeSelect>
  );
}

function uniqueOptions(options: FilterOption[]) {
  return [...new Map(options.map((option) => [option.id, option])).values()].sort(compareOptions);
}

function compareOptions(first: FilterOption, second: FilterOption) {
  return first.name.localeCompare(second.name, "es");
}

function formatExecution(execution: StockPlanningExecution) {
  const date = new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(execution.startedAt));
  return `${date} · v${execution.configurationVersion}`;
}

function getErrorMessage(error: StockPlanningParquetExportError) {
  if (error.code === "row-limit") return "La selección excede 1.000.000 de filas. Acorta el rango o elige producto, categoría o proveedor.";
  if (error.code === "range-too-large") return "El intervalo supera cinco años. Reduce las fechas antes de volver a intentar.";
  if (error.code === "execution-not-found") return "La ejecución seleccionada ya no está disponible como resultado exitoso.";
  if (error.code === "validation") return "Revisa el rango, los filtros y la ejecución seleccionada.";
  if (error.code === "forbidden") return "Tu rol no tiene permiso para descargar este conjunto.";
  if (error.code === "session-invalid") return "La sesión venció. Vuelve a iniciar sesión antes de descargar.";
  return "Ocurrió un problema inesperado. Puedes reintentar sin afectar la otra descarga.";
}

function saveParquetFile(file: StockPlanningParquetFile | null) {
  if (!file) return;
  const blob = new Blob([file.content], { type: file.contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function toLocalDateInput(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
