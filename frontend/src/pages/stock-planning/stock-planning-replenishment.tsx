import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertOctagon,
  Calculator,
  CircleDollarSign,
  ClockAlert,
  Filter,
  PackageOpen,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
  Warehouse
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  StockCriticalitySchema,
  StockPlanningConfidenceSchema,
  StockPlanningMaturitySchema,
  StockPlanningProductsQuerySchema,
  StockPlanningRiskSchema
} from "@pharmacy-pos/shared";
import type {
  StockPlanningAlert,
  StockPlanningAlertPriority,
  StockPlanningEngineState,
  StockPlanningFilters,
  StockPlanningProduct,
  StockPlanningRisk,
  StockPlanningSummary,
  StockPlanningSupplierGroup
} from "@/modules/stock-planning";

const quantityFormatter = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 4 });
const moneyFormatter = new Intl.NumberFormat("es-BO", {
  currency: "BOB",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency"
});

const riskLabels: Record<StockPlanningRisk, string> = {
  critical_stockout: "Agotamiento crítico",
  expiry: "Riesgo de vencimiento",
  replenishment: "Requiere reabastecimiento",
  stale: "Cálculo desactualizado"
};

const alertPriorityLabels: Record<StockPlanningAlertPriority, string> = {
  critical: "Crítica",
  high: "Alta",
  informational: "Informativa",
  medium: "Media"
};

type FilterOption = { id: string; name: string };

export function ReplenishmentDashboard({
  engineState,
  loading,
  summary
}: {
  engineState: StockPlanningEngineState | null;
  loading: boolean;
  summary: StockPlanningSummary;
}) {
  const calculationState = getCalculationState(engineState);

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <DashboardMetric
        detail="Catálogo visible según los filtros aplicados"
        icon={Warehouse}
        label="Productos evaluados"
        loading={loading}
        value={summary.productCount}
      />
      <DashboardMetric
        detail="Productos, no unidades incompatibles"
        icon={PackageOpen}
        label="Requieren reabastecimiento"
        loading={loading}
        value={summary.replenishmentCount}
      />
      <DashboardMetric
        detail="Criticidad clínica y riesgo de quiebre"
        icon={AlertOctagon}
        label="Críticos con riesgo"
        loading={loading}
        tone="danger"
        value={summary.criticalRiskCount}
      />
      <DashboardMetric
        detail="Stock que podría vencer antes del consumo"
        icon={TriangleAlert}
        label="Riesgo de vencimiento"
        loading={loading}
        value={summary.expiryRiskCount}
      />
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
          <div>
            <CardDescription>Estado del último cálculo</CardDescription>
            <CardTitle className="mt-2 text-xl">{loading ? "Consultando…" : calculationState.label}</CardTitle>
          </div>
          <Calculator aria-hidden="true" className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-xs leading-5 text-muted-foreground">{calculationState.detail}</p>
          {summary.staleCount > 0 ? (
            <Badge className="mt-2" variant="destructive">
              {summary.staleCount} resultado(s) desactualizado(s)
            </Badge>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardMetric({
  detail,
  icon: Icon,
  label,
  loading,
  tone = "default",
  value
}: {
  detail: string;
  icon: typeof PackageOpen;
  label: string;
  loading: boolean;
  tone?: "danger" | "default" | "warning";
  value: number;
}) {
  const iconClass = tone === "danger" ? "text-destructive" : "text-primary";

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-2 text-2xl">{loading ? "—" : quantityFormatter.format(value)}</CardTitle>
        </div>
        <Icon aria-hidden="true" className={`size-4 ${iconClass}`} />
      </CardHeader>
      <CardContent>
        <p className="text-xs leading-5 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

export function ReplenishmentFilters({
  disabled,
  onApply,
  products
}: {
  disabled: boolean;
  onApply: (filters: StockPlanningFilters) => void;
  products: StockPlanningProduct[];
}) {
  const [filters, setFilters] = useState<StockPlanningFilters>({});
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [suppliers, setSuppliers] = useState<FilterOption[]>([]);

  useEffect(() => {
    setCategories((current) => mergeOptions(current, products.map((product) => ({
      id: product.categoryId,
      name: product.categoryName
    }))));
    setSuppliers((current) => mergeOptions(current, products.map((product) => ({
      id: product.supplierId,
      name: product.supplierName
    }))));
  }, [products]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply(cleanFilters(filters));
  }

  function reset() {
    setFilters({});
    onApply({});
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border bg-muted/30 p-2">
            <Filter aria-hidden="true" className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle>Priorizar el abastecimiento</CardTitle>
            <CardDescription className="mt-1">
              Filtra señales farmacéuticas. La agrupación por proveedor organiza la lectura y no modifica el pronóstico.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <FilterField label="Producto">
              <Input
                placeholder="Nombre o código interno"
                value={filters.search ?? ""}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </FilterField>
            <FilterField label="Categoría">
              <FilterSelect
                options={categories}
                value={filters.categoryId}
                onChange={(value) => setFilters((current) => ({ ...current, categoryId: value }))}
              />
            </FilterField>
            <FilterField label="Proveedor">
              <FilterSelect
                options={suppliers}
                value={filters.supplierId}
                onChange={(value) => setFilters((current) => ({ ...current, supplierId: value }))}
              />
            </FilterField>
            <FilterField label="Criticidad">
              <NativeSelect
                className="w-full"
                value={filters.criticality ?? ""}
                onChange={(event) => {
                  const result = StockCriticalitySchema.safeParse(event.target.value);
                  setFilters((current) => ({
                    ...current,
                    criticality: result.success ? result.data : undefined
                  }));
                }}
              >
                <NativeSelectOption value="">Todas</NativeSelectOption>
                <NativeSelectOption value="critical">Crítica</NativeSelectOption>
                <NativeSelectOption value="high">Alta</NativeSelectOption>
                <NativeSelectOption value="normal">Normal</NativeSelectOption>
              </NativeSelect>
            </FilterField>
            <FilterField label="Madurez">
              <NativeSelect
                className="w-full"
                value={filters.maturity ?? ""}
                onChange={(event) => {
                  const result = StockPlanningMaturitySchema.safeParse(event.target.value);
                  setFilters((current) => ({
                    ...current,
                    maturity: result.success ? result.data : undefined
                  }));
                }}
              >
                <NativeSelectOption value="">Todas</NativeSelectOption>
                <NativeSelectOption value="no_history">Sin historial</NativeSelectOption>
                <NativeSelectOption value="low_confidence">Baja confianza</NativeSelectOption>
                <NativeSelectOption value="operational">Predicción operativa</NativeSelectOption>
                <NativeSelectOption value="no_observed_demand">Sin demanda observada</NativeSelectOption>
              </NativeSelect>
            </FilterField>
            <FilterField label="Confianza">
              <NativeSelect
                className="w-full"
                value={filters.confidence ?? ""}
                onChange={(event) => {
                  const result = StockPlanningConfidenceSchema.safeParse(event.target.value);
                  setFilters((current) => ({
                    ...current,
                    confidence: result.success ? result.data : undefined
                  }));
                }}
              >
                <NativeSelectOption value="">Todas</NativeSelectOption>
                <NativeSelectOption value="high">Alta</NativeSelectOption>
                <NativeSelectOption value="medium">Media</NativeSelectOption>
                <NativeSelectOption value="low">Baja</NativeSelectOption>
                <NativeSelectOption value="none">Sin calificar</NativeSelectOption>
              </NativeSelect>
            </FilterField>
            <FilterField label="Riesgo">
              <NativeSelect
                className="w-full"
                value={filters.risk ?? ""}
                onChange={(event) => {
                  const result = StockPlanningRiskSchema.safeParse(event.target.value);
                  setFilters((current) => ({
                    ...current,
                    risk: result.success ? result.data : undefined
                  }));
                }}
              >
                <NativeSelectOption value="">Todos</NativeSelectOption>
                <NativeSelectOption value="critical_stockout">Agotamiento crítico</NativeSelectOption>
                <NativeSelectOption value="replenishment">Reabastecimiento</NativeSelectOption>
                <NativeSelectOption value="expiry">Vencimiento</NativeSelectOption>
                <NativeSelectOption value="stale">Cálculo desactualizado</NativeSelectOption>
              </NativeSelect>
            </FilterField>
            <FilterField label="Presentación">
              <NativeSelect
                className="w-full"
                value={filters.groupBy ?? ""}
                onChange={(event) => setFilters((current) => ({
                  ...current,
                  groupBy: event.target.value === "supplier" ? "supplier" : undefined
                }))}
              >
                <NativeSelectOption value="">Lista priorizada</NativeSelectOption>
                <NativeSelectOption value="supplier">Agrupar por proveedor</NativeSelectOption>
              </NativeSelect>
            </FilterField>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button disabled={disabled} type="button" variant="ghost" onClick={reset}>
              <RotateCcw aria-hidden="true" />
              Limpiar
            </Button>
            <Button disabled={disabled} type="submit">
              <RefreshCcw aria-hidden="true" />
              Aplicar filtros
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function PredictiveAlerts({ alerts }: { alerts: StockPlanningAlert[] }) {
  if (alerts.length === 0) {
    return (
      <Alert>
        <ShieldCheck aria-hidden="true" />
        <AlertTitle>Sin alertas predictivas vigentes</AlertTitle>
        <AlertDescription>El último resultado no generó señales administrativas para los productos visibles.</AlertDescription>
      </Alert>
    );
  }

  const prioritizedAlerts = [...alerts].sort((first, second) =>
    getAlertPriorityRank(second.priority) - getAlertPriorityRank(first.priority) ||
    first.id.localeCompare(second.id)
  );

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Alertas predictivas administrativas</CardTitle>
        <CardDescription>
          Derivadas del último resultado; no crean compras, no reservan stock y no se muestran al rol Vendedor.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2 pt-5 lg:grid-cols-2">
        {prioritizedAlerts.map((alert) => (
          <div className="flex items-start gap-3 rounded-lg border bg-muted/15 p-3" key={alert.id}>
            <ClockAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <Badge variant={alert.priority === "critical" ? "destructive" : "outline"}>
                Prioridad {alertPriorityLabels[alert.priority].toLowerCase()}
              </Badge>
              <p className="mt-2 text-sm leading-5">{alert.message}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ReplenishmentTable({
  groups,
  products,
  onAnalyze,
  onEdit
}: {
  groups: StockPlanningSupplierGroup[];
  products: StockPlanningProduct[];
  onAnalyze: (product: StockPlanningProduct) => void;
  onEdit: (product: StockPlanningProduct) => void;
}) {
  const sortedProducts = useMemo(() => [...products].sort(comparePriority), [products]);
  const groupedRows = useMemo(() => {
    if (groups.length === 0) return null;
    const productById = new Map(sortedProducts.map((product) => [product.productId, product]));
    return groups.map((group) => ({
      group,
      products: group.productIds
        .map((productId) => productById.get(productId))
        .filter((product): product is StockPlanningProduct => product !== undefined)
        .sort(comparePriority)
    }));
  }, [groups, sortedProducts]);

  if (products.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Prioridad y producto</TableHead>
            <TableHead>Demanda</TableHead>
            <TableHead>Seguridad y meta</TableHead>
            <TableHead>Sugerencia</TableHead>
            <TableHead>Presentación</TableHead>
            <TableHead>Costo estimado</TableHead>
            <TableHead>Cobertura</TableHead>
            <TableHead>Confianza</TableHead>
            <TableHead>Riesgos y estado</TableHead>
            <TableHead>Compras en borrador</TableHead>
            <TableHead className="pr-5 text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedRows
            ? groupedRows.flatMap(({ group, products: supplierProducts }) => [
                <TableRow className="bg-muted/35 hover:bg-muted/35" key={`group-${group.supplierId}`}>
                  <TableCell className="pl-5" colSpan={11}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{group.supplierName}</p>
                      <p className="text-xs text-muted-foreground">
                        Agrupación operativa · no interviene en demanda, confianza ni cantidad sugerida
                      </p>
                    </div>
                  </TableCell>
                </TableRow>,
                ...supplierProducts.map((product) => (
                  <ReplenishmentRow key={product.productId} product={product} onAnalyze={onAnalyze} onEdit={onEdit} />
                ))
              ])
            : sortedProducts.map((product) => (
                <ReplenishmentRow key={product.productId} product={product} onAnalyze={onAnalyze} onEdit={onEdit} />
              ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ReplenishmentRow({
  onAnalyze,
  onEdit,
  product
}: {
  onAnalyze: (product: StockPlanningProduct) => void;
  onEdit: (product: StockPlanningProduct) => void;
  product: StockPlanningProduct;
}) {
  const recommendation = product.result.kind === "demand_forecast" ? product.result : null;
  const priority = getProductPriority(product);
  const risks = product.risks ?? [];
  const draftQuantity = product.draftPurchaseQuantity ?? 0;
  const draftCount = product.draftPurchaseCount ?? 0;

  return (
    <TableRow>
      <TableCell className="min-w-64 pl-5">
        <Badge variant={priority.variant}>{priority.label}</Badge>
        <p className="mt-2 font-medium">{product.commercialName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {product.internalCode} · {product.categoryName} · {product.supplierName}
        </p>
      </TableCell>
      <TableCell className="min-w-40">
        <Quantity value={recommendation?.centralDemand ?? product.forecast?.centralDemand} unit={product.baseUnitAbbreviation} />
        <p className="mt-1 text-xs text-muted-foreground">
          {recommendation ? `Cuantil ${(recommendation.serviceLevel * 100).toFixed(0)}%: ${quantityFormatter.format(recommendation.demandQuantile)}` : "Referencia configurada · no es pronóstico"}
        </p>
      </TableCell>
      <TableCell className="min-w-40">
        {recommendation ? (
          <>
            <p>Seguridad: <strong>{quantityFormatter.format(recommendation.safetyStock)}</strong></p>
            <p className="mt-1">Meta: <strong>{quantityFormatter.format(recommendation.targetStock)}</strong> {product.baseUnitAbbreviation}</p>
            <p className="mt-1 text-xs text-muted-foreground">Piso mínimo: {quantityFormatter.format(product.minimumStock)}</p>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Disponible al habilitarse el pronóstico</span>
        )}
      </TableCell>
      <TableCell className="min-w-36">
        <p className="text-lg font-semibold">{quantityFormatter.format(product.result.quantityBase)} {product.baseUnitAbbreviation}</p>
        <p className="mt-1 text-xs text-muted-foreground">{product.result.wasRounded ? "Redondeada hacia presentación completa" : "En unidad base"}</p>
      </TableCell>
      <TableCell className="min-w-44">
        {product.result.preferredPresentation ? (
          <>
            <p className="font-medium">{product.result.preferredPresentation.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              1 {product.result.preferredPresentation.abbreviation} = {quantityFormatter.format(product.result.preferredPresentation.conversionFactor)} {product.baseUnitAbbreviation}
            </p>
          </>
        ) : (
          <StatusNote icon={Warehouse} text="Sin presentación preferida; sugerencia en unidad base" />
        )}
      </TableCell>
      <TableCell className="min-w-36">
        {recommendation?.estimatedCost !== undefined ? (
          <>
            <p className="font-medium">{moneyFormatter.format(recommendation.estimatedCost)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Estimación secundaria con último costo confiable</p>
          </>
        ) : (
          <StatusNote icon={CircleDollarSign} text="Sin costo confiable; estimación omitida" />
        )}
      </TableCell>
      <TableCell className="min-w-36">
        <p className="font-medium">{product.coverage.days} días</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Stock utilizable: {quantityFormatter.format(product.usableStock)} {product.baseUnitAbbreviation}
        </p>
      </TableCell>
      <TableCell className="min-w-36">
        <Badge variant={product.confidence === "high" ? "default" : "secondary"}>
          {getConfidenceLabel(product)}
        </Badge>
        <p className="mt-1 text-xs text-muted-foreground">Calidad de evidencia, no garantía</p>
      </TableCell>
      <TableCell className="min-w-52">
        <div className="flex flex-wrap gap-1.5">
          {risks.length > 0
            ? risks.map((risk) => (
                <Badge key={risk} variant={risk === "critical_stockout" || risk === "stale" ? "destructive" : "outline"}>
                  {riskLabels[risk]}
                </Badge>
              ))
            : <Badge variant="secondary">Sin riesgos predictivos</Badge>}
        </div>
        {(product.expiryRiskStock ?? 0) > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            En riesgo: {quantityFormatter.format(product.expiryRiskStock ?? 0)} {product.baseUnitAbbreviation}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="min-w-48">
        {draftCount > 0 ? (
          <>
            <p className="font-medium">{draftCount} borrador(es) · {quantityFormatter.format(draftQuantity)} {product.baseUnitAbbreviation}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Contexto informativo: no se descuenta de la sugerencia.</p>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Sin compras en borrador</span>
        )}
      </TableCell>
      <TableCell className="pr-5 text-right">
        <div className="flex justify-end gap-2">
          <Button size="sm" type="button" onClick={() => onAnalyze(product)}>
            Analizar
          </Button>
          <Button size="sm" type="button" variant="outline" onClick={() => onEdit(product)}>
            Configurar
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function Quantity({ unit, value }: { unit: string; value: number | undefined }) {
  return value === undefined
    ? <span className="text-sm text-muted-foreground">Sin demanda prevista</span>
    : <p className="font-medium">{quantityFormatter.format(value)} {unit}</p>;
}

function StatusNote({ icon: Icon, text }: { icon: typeof Warehouse; text: string }) {
  return (
    <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
      <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      {text}
    </p>
  );
}

function FilterField({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function FilterSelect({
  onChange,
  options,
  value
}: {
  onChange: (value: string | undefined) => void;
  options: FilterOption[];
  value: string | undefined;
}) {
  return (
    <NativeSelect className="w-full" value={value ?? ""} onChange={(event) => onChange(event.target.value || undefined)}>
      <NativeSelectOption value="">Todos</NativeSelectOption>
      {options.map((option) => (
        <NativeSelectOption key={option.id} value={option.id}>{option.name}</NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

function mergeOptions(current: FilterOption[], incoming: FilterOption[]) {
  const options = new Map(current.map((option) => [option.id, option]));
  incoming.forEach((option) => options.set(option.id, option));
  return [...options.values()].sort((first, second) => first.name.localeCompare(second.name, "es"));
}

function cleanFilters(filters: StockPlanningFilters): StockPlanningFilters {
  return StockPlanningProductsQuerySchema.parse(
    Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== undefined && value !== "")
    )
  );
}

function getProductPriority(product: StockPlanningProduct) {
  const risks = product.risks ?? [];
  if (risks.includes("critical_stockout")) {
    return { label: "1 · Agotamiento crítico", rank: 4, variant: "destructive" as const };
  }
  if (risks.includes("replenishment")) {
    return { label: "2 · Reposición urgente", rank: 3, variant: "default" as const };
  }
  if (risks.includes("expiry")) {
    return { label: "3 · Vigilar vencimiento", rank: 2, variant: "outline" as const };
  }
  return { label: "4 · Seguimiento", rank: 1, variant: "secondary" as const };
}

function comparePriority(first: StockPlanningProduct, second: StockPlanningProduct) {
  return getProductPriority(second).rank - getProductPriority(first).rank ||
    first.commercialName.localeCompare(second.commercialName, "es");
}

function getConfidenceLabel(product: StockPlanningProduct) {
  if (product.confidence === "high") return "Confianza alta";
  if (product.confidence === "medium") return "Confianza media";
  if (product.confidence === "low") return "Confianza baja";
  return product.maturity === "no_history" ? "Sin historial" : "Sin calificar";
}

function getCalculationState(engineState: StockPlanningEngineState | null) {
  if (!engineState) return { detail: "Aún no existe una ejecución registrada.", label: "Sin cálculo" };
  if (engineState.executionInProgress) return { detail: "El motor está procesando una nueva ejecución.", label: "En curso" };
  if (engineState.stale) return { detail: "Se conserva el último resultado disponible y requiere actualización.", label: "Desactualizado" };
  if (!engineState.latestExecution) return { detail: "El motor todavía no completó su primera ejecución.", label: "Pendiente" };
  if (engineState.latestExecution.status === "failed") return { detail: "La última ejecución falló; revisa la evidencia conservada.", label: "Fallido" };
  if (engineState.latestExecution.status === "succeeded_with_warnings") return { detail: "La ejecución terminó con advertencias por revisar.", label: "Con advertencias" };
  return { detail: "La última ejecución terminó correctamente.", label: "Vigente" };
}

function getAlertPriorityRank(priority: StockPlanningAlertPriority) {
  if (priority === "critical") return 4;
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}
