import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  ChevronDown,
  ClockAlert,
  Filter,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  StockCriticalitySchema,
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
  critical_stockout: "Sin stock o próximo a agotarse",
  expiry: "Parte del stock podría vencer",
  replenishment: "Stock insuficiente para los próximos días",
  stale: "Recomendación pendiente de actualización"
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
  const decisionTitle = summary.replenishmentCount === 0
    ? "No necesitas preparar compras urgentes"
    : summary.replenishmentCount === 1
      ? "Hay 1 medicamento que conviene comprar"
      : `Hay ${summary.replenishmentCount} medicamentos que conviene comprar`;

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.8fr)] lg:items-center">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingCart aria-hidden="true" className="size-5" />
          </span>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{loading ? "Revisando el inventario…" : decisionTitle}</h2>
            {summary.criticalRiskCount > 0 ? (
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Empieza por los {summary.criticalRiskCount} urgentes y revisa si ya están incluidos en una compra en borrador.
              </p>
            ) : null}
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calculator aria-hidden="true" className="size-3.5" />
              {calculationState.detail}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 overflow-hidden rounded-xl border bg-muted/20">
          <DecisionMetric label="Recomendaciones" value={loading ? "—" : summary.replenishmentCount} />
          <DecisionMetric label="Urgentes" value={loading ? "—" : summary.criticalRiskCount} />
          <DecisionMetric label="Con riesgo de vencer" value={loading ? "—" : summary.expiryRiskCount} />
        </div>
      </CardContent>
    </Card>
  );
}

function DecisionMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-r px-3 py-4 text-center last:border-r-0 sm:px-4">
      <p className="text-xl font-semibold tabular-nums sm:text-2xl">{typeof value === "number" ? quantityFormatter.format(value) : value}</p>
      <p className="mt-1 text-[0.6875rem] font-medium leading-4 text-muted-foreground">{label}</p>
    </div>
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
            <CardTitle>Encontrar medicamentos</CardTitle>
            <CardDescription className="mt-1">
              Busca por nombre o proveedor y muestra únicamente la decisión que necesitas revisar.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-3">
            <FilterField label="Producto">
              <Input
                placeholder="Nombre o código interno"
                value={filters.search ?? ""}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              />
            </FilterField>
            <FilterField label="Proveedor">
              <FilterSelect
                options={suppliers}
                value={filters.supplierId}
                onChange={(value) => setFilters((current) => ({ ...current, supplierId: value }))}
              />
            </FilterField>
            <FilterField label="Qué necesitas decidir">
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
                <NativeSelectOption value="">Todas las decisiones</NativeSelectOption>
                <NativeSelectOption value="critical_stockout">Comprar hoy</NativeSelectOption>
                <NativeSelectOption value="replenishment">Comprar pronto</NativeSelectOption>
                <NativeSelectOption value="expiry">Vigilar vencimiento</NativeSelectOption>
                <NativeSelectOption value="stale">Actualizar recomendación</NativeSelectOption>
              </NativeSelect>
            </FilterField>
          </div>
          <Collapsible className="group/filters">
            <CollapsibleTrigger asChild>
              <Button className="w-fit" type="button" variant="ghost">
                <SlidersHorizontal aria-hidden="true" />
                Más filtros
                <ChevronDown
                  aria-hidden="true"
                  className="transition-transform group-data-[state=open]/filters:rotate-180"
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="grid gap-3 rounded-lg border bg-muted/15 p-4 md:grid-cols-3">
                <FilterField label="Categoría">
                  <FilterSelect
                    options={categories}
                    value={filters.categoryId}
                    onChange={(value) => setFilters((current) => ({ ...current, categoryId: value }))}
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
                <FilterField label="Orden">
                  <NativeSelect
                    className="w-full"
                    value={filters.groupBy ?? ""}
                    onChange={(event) => setFilters((current) => ({
                      ...current,
                      groupBy: event.target.value === "supplier" ? "supplier" : undefined
                    }))}
                  >
                    <NativeSelectOption value="">Por prioridad</NativeSelectOption>
                    <NativeSelectOption value="supplier">Por proveedor</NativeSelectOption>
                  </NativeSelect>
                </FilterField>
              </div>
            </CollapsibleContent>
          </Collapsible>
          <div className="flex flex-wrap justify-end gap-2">
            <Button disabled={disabled} type="button" variant="ghost" onClick={reset}>
              <RotateCcw aria-hidden="true" />
              Restablecer
            </Button>
            <Button disabled={disabled} type="submit">
              <RefreshCcw aria-hidden="true" />
              Aplicar
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
        <AlertTitle>Sin señales adicionales</AlertTitle>
        <AlertDescription>No existen advertencias adicionales para las recomendaciones visibles.</AlertDescription>
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
        <CardTitle>Señales adicionales del cálculo</CardTitle>
        <CardDescription>
          Información complementaria para revisar casos excepcionales. No crea compras ni reserva stock.
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
  onCreatePurchase,
  onEdit,
  onReviewDraft
}: {
  groups: StockPlanningSupplierGroup[];
  products: StockPlanningProduct[];
  onAnalyze: (product: StockPlanningProduct) => void;
  onCreatePurchase?: (product: StockPlanningProduct) => void;
  onEdit: (product: StockPlanningProduct) => void;
  onReviewDraft?: (product: StockPlanningProduct) => void;
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
            <TableHead className="pl-5">Medicamento</TableHead>
            <TableHead>Qué conviene hacer</TableHead>
            <TableHead>Por qué</TableHead>
            <TableHead>Costo estimado</TableHead>
            <TableHead className="pr-5 text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedRows
            ? groupedRows.flatMap(({ group, products: supplierProducts }) => [
                <TableRow className="bg-muted/35 hover:bg-muted/35" key={`group-${group.supplierId}`}>
                  <TableCell className="pl-5" colSpan={5}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold">{group.supplierName}</p>
                      <p className="text-xs text-muted-foreground">
                        Productos agrupados para facilitar la preparación de la compra
                      </p>
                    </div>
                  </TableCell>
                </TableRow>,
                ...supplierProducts.map((product) => (
                  <ReplenishmentRow key={product.productId} product={product} onAnalyze={onAnalyze} onCreatePurchase={onCreatePurchase} onEdit={onEdit} onReviewDraft={onReviewDraft} />
                ))
              ])
            : sortedProducts.map((product) => (
                <ReplenishmentRow key={product.productId} product={product} onAnalyze={onAnalyze} onCreatePurchase={onCreatePurchase} onEdit={onEdit} onReviewDraft={onReviewDraft} />
              ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ReplenishmentRow({
  onAnalyze,
  onCreatePurchase,
  onEdit,
  onReviewDraft,
  product
}: {
  onAnalyze: (product: StockPlanningProduct) => void;
  onCreatePurchase?: (product: StockPlanningProduct) => void;
  onEdit: (product: StockPlanningProduct) => void;
  onReviewDraft?: (product: StockPlanningProduct) => void;
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
        <p className="mt-1 text-xs text-muted-foreground">Proveedor: {product.supplierName}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Stock actual: {quantityFormatter.format(product.usableStock)} {product.baseUnitAbbreviation}
        </p>
      </TableCell>
      <TableCell className="min-w-56">
        <p className="text-lg font-semibold">
          {product.result.quantityBase > 0
            ? `Comprar ${quantityFormatter.format(product.result.quantityBase)} ${product.baseUnitAbbreviation}`
            : "No comprar por ahora"}
        </p>
        {product.result.preferredPresentation ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Pedir en {product.result.preferredPresentation.name.toLowerCase()} completa
            {product.result.wasRounded ? " · cantidad ajustada" : ""}
          </p>
        ) : product.result.quantityBase > 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">Cantidad en unidades mínimas</p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">Cubre aproximadamente {product.coverage.days} días</p>
        {draftCount > 0 ? (
          <div className="mt-3 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-2 text-xs leading-5">
            Ya hay {draftCount} {draftCount === 1 ? "borrador" : "borradores"} con {quantityFormatter.format(draftQuantity)} {product.baseUnitAbbreviation}. Revísalo antes de duplicar la compra.
          </div>
        ) : null}
      </TableCell>
      <TableCell className="min-w-56">
        <div className="flex flex-wrap gap-1.5">
          {risks.length > 0
            ? risks.map((risk) => (
                <Badge key={risk} variant={risk === "critical_stockout" || risk === "stale" ? "destructive" : "outline"}>
                  {riskLabels[risk]}
                </Badge>
              ))
            : <Badge variant="secondary">Stock suficiente</Badge>}
        </div>
        {(product.expiryRiskStock ?? 0) > 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Podrían vencer {quantityFormatter.format(product.expiryRiskStock ?? 0)} {product.baseUnitAbbreviation}
          </p>
        ) : null}
      </TableCell>
      <TableCell className="min-w-40">
        {recommendation?.estimatedCost !== undefined ? (
          <p className="font-medium">{moneyFormatter.format(recommendation.estimatedCost)}</p>
        ) : (
          <span className="text-sm text-muted-foreground">Por confirmar con proveedor</span>
        )}
      </TableCell>
      <TableCell className="pr-5 text-right">
        <div className="flex min-w-40 flex-col items-stretch gap-2">
          {draftCount > 0 && onReviewDraft ? (
            <Button size="sm" type="button" onClick={() => onReviewDraft(product)}>
              <ShoppingCart aria-hidden="true" />
              Revisar borrador
            </Button>
          ) : onCreatePurchase && product.result.quantityBase > 0 ? (
            <Button size="sm" type="button" onClick={() => onCreatePurchase(product)}>
              <ShoppingCart aria-hidden="true" />
              Crear compra
            </Button>
          ) : null}
          <Button size="sm" type="button" variant="outline" onClick={() => onAnalyze(product)}>
            Ver detalles
          </Button>
          <Button size="sm" type="button" variant="ghost" onClick={() => onEdit(product)}>
            Ajustar
          </Button>
        </div>
      </TableCell>
    </TableRow>
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
    return { label: "Comprar hoy", rank: 4, variant: "destructive" as const };
  }
  if (risks.includes("replenishment")) {
    return { label: "Comprar pronto", rank: 3, variant: "default" as const };
  }
  if (risks.includes("expiry")) {
    return { label: "Vigilar vencimiento", rank: 2, variant: "outline" as const };
  }
  return { label: "Sin compra urgente", rank: 1, variant: "secondary" as const };
}

function comparePriority(first: StockPlanningProduct, second: StockPlanningProduct) {
  return getProductPriority(second).rank - getProductPriority(first).rank ||
    first.commercialName.localeCompare(second.commercialName, "es");
}

function getCalculationState(engineState: StockPlanningEngineState | null) {
  if (!engineState) return { detail: "Todavía no hay recomendaciones disponibles.", label: "pendientes" };
  if (engineState.executionInProgress) return { detail: "Se están actualizando las cantidades sugeridas.", label: "actualizándose" };
  if (engineState.stale) return { detail: "Conviene actualizar antes de preparar una compra.", label: "por actualizar" };
  if (!engineState.latestExecution) return { detail: "Actualiza la pantalla para generar las primeras recomendaciones.", label: "pendientes" };
  if (engineState.latestExecution.status === "failed") return { detail: "No se pudieron actualizar; conserva la última lista disponible.", label: "con error" };
  if (engineState.latestExecution.status === "succeeded_with_warnings") return { detail: "La lista puede usarse, pero contiene casos que requieren revisión.", label: "con advertencias" };
  return { detail: "La lista está lista para preparar compras.", label: "vigentes" };
}

function getAlertPriorityRank(priority: StockPlanningAlertPriority) {
  if (priority === "critical") return 4;
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}
