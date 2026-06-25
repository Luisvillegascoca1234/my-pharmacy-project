import type {
  DailySalesReportRow,
  ExpiringProduct,
  InventoryValuationLot,
  InventoryValuationProduct,
  ReportsRequestStatus
} from "@/modules/reports";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, CalendarDays, ChevronDown, Clock3, PackageSearch, RefreshCcw, ShieldAlert, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { REPORTS_DEFAULT_EXPIRING_DAYS, useReports } from "@/modules/reports";

const boliviaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/La_Paz",
  year: "numeric"
});

const displayDateFormatter = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "America/La_Paz",
  year: "numeric"
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/La_Paz"
});

const moneyFormatter = new Intl.NumberFormat("es-BO", {
  currency: "BOB",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency"
});

const quantityFormatter = new Intl.NumberFormat("es-BO", {
  maximumFractionDigits: 4
});

export function ReportsPage() {
  const reports = useReports({
    autoLoadExpiringProducts: true,
    autoLoadInventoryValuation: true
  });
  const today = getTodayInBolivia();

  useEffect(() => {
    if (!reports.canReadReports) {
      return;
    }

    if (!reports.dailySalesFromDate) {
      reports.setDailySalesFromDate(today);
    }

    if (!reports.dailySalesToDate) {
      reports.setDailySalesToDate(today);
    }
  }, [reports, today]);

  useEffect(() => {
    if (!reports.canReadReports || !reports.dailySalesFromDate || !reports.dailySalesToDate) {
      return;
    }

    void reports.loadDailySalesReport();
  }, [reports.canReadReports, reports.dailySalesFromDate, reports.dailySalesToDate, reports.loadDailySalesReport]);

  const dailyRows = reports.dailySalesReport?.data ?? [];
  const valuationRows = reports.inventoryValuationReport?.data ?? [];
  const expiringRows = reports.expiringProductsReport?.data ?? [];
  const dailyTotals = getDailySalesTotals(dailyRows);
  const isAnyReportLoading =
    reports.dailySalesStatus === "loading" ||
    reports.inventoryValuationStatus === "loading" ||
    reports.expiringProductsStatus === "loading";

  if (!reports.canReadReports) {
    return (
      <section className="mx-auto grid max-w-3xl gap-5">
        <Alert variant="destructive">
          <ShieldAlert aria-hidden="true" />
          <AlertTitle>Acceso no autorizado</AlertTitle>
          <AlertDescription>Tu rol actual no permite consultar reportes operativos administrativos.</AlertDescription>
        </Alert>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Análisis operativo
          </Badge>
          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Reportes operativos</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Lectura administrativa de ventas diarias, valuación del inventario disponible y lotes próximos a vencer con corte
              horario de Bolivia.
            </p>
          </div>
        </div>
        <Button disabled={isAnyReportLoading} variant="outline" onClick={() => void reloadAllReports(reports)}>
          {isAnyReportLoading ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
          Recargar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={TrendingUp} label="Neto vendido" value={moneyFormatter.format(dailyTotals.netSalesAmount)} />
        <MetricCard icon={CalendarDays} label="Ventas registradas" value={quantityFormatter.format(dailyTotals.saleCount)} />
        <MetricCard
          icon={PackageSearch}
          label="Valuación disponible"
          value={moneyFormatter.format(reports.inventoryValuationReport?.totalValue ?? 0)}
        />
        <MetricCard icon={Clock3} label="Lotes por vencer" value={quantityFormatter.format(expiringRows.length)} />
      </div>

      <DailySalesSection
        fromDate={reports.dailySalesFromDate}
        rows={dailyRows}
        status={reports.dailySalesStatus}
        toDate={reports.dailySalesToDate}
        totals={dailyTotals}
        onFromDateChange={reports.setDailySalesFromDate}
        onReload={reports.loadDailySalesReport}
        onToDateChange={reports.setDailySalesToDate}
      />

      <InventoryValuationSection
        generatedAt={reports.inventoryValuationReport?.generatedAt}
        rows={valuationRows}
        search={reports.inventoryValuationSearch}
        status={reports.inventoryValuationStatus}
        totalValue={reports.inventoryValuationReport?.totalValue ?? 0}
        onReload={reports.loadInventoryValuationReport}
        onSearchChange={reports.setInventoryValuationSearch}
      />

      <ExpiringProductsSection
        days={reports.expiringDays}
        generatedAt={reports.expiringProductsReport?.generatedAt}
        rows={expiringRows}
        search={reports.expiringSearch}
        status={reports.expiringProductsStatus}
        onDaysChange={reports.setExpiringDays}
        onReload={reports.loadExpiringProductsReport}
        onSearchChange={reports.setExpiringSearch}
      />
    </section>
  );
}

type ReportsHookValue = ReturnType<typeof useReports>;

function reloadAllReports(reports: ReportsHookValue) {
  return Promise.all([
    reports.loadDailySalesReport(),
    reports.loadInventoryValuationReport(),
    reports.loadExpiringProductsReport()
  ]);
}

function MetricCard({
  icon: Icon,
  label,
  value
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <Icon aria-hidden="true" className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

type DailySalesTotals = {
  cancelledAmount: number;
  cancelledCount: number;
  grossSalesAmount: number;
  netSalesAmount: number;
  returnedAmount: number;
  returnedCount: number;
  saleCount: number;
};

function DailySalesSection({
  fromDate,
  rows,
  status,
  toDate,
  totals,
  onFromDateChange,
  onReload,
  onToDateChange
}: {
  fromDate: string;
  rows: DailySalesReportRow[];
  status: ReportsRequestStatus;
  toDate: string;
  totals: DailySalesTotals;
  onFromDateChange: (value: string) => void;
  onReload: () => Promise<void>;
  onToDateChange: (value: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Ventas diarias</CardTitle>
            <CardDescription>
              Bruto, anulaciones POS, devoluciones administrativas y neto por fecha operativa en Bolivia.
            </CardDescription>
          </div>
          <Button disabled={status === "loading"} type="button" variant="outline" onClick={() => void onReload()}>
            {status === "loading" ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
            Consultar
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <DateField label="Desde" value={fromDate} onChange={onFromDateChange} />
          <DateField label="Hasta" value={toDate} onChange={onToDateChange} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-5">
          <CompactMetric label="Bruto" value={moneyFormatter.format(totals.grossSalesAmount)} />
          <CompactMetric label="Anulaciones POS" value={moneyFormatter.format(totals.cancelledAmount)} />
          <CompactMetric label="Devoluciones adm." value={moneyFormatter.format(totals.returnedAmount)} />
          <CompactMetric label="Neto" value={moneyFormatter.format(totals.netSalesAmount)} />
          <CompactMetric label="Conteos" value={`${totals.saleCount} ventas`} />
        </div>

        <ReportState status={status} emptyTitle="Sin ventas en el rango" loadingText="Calculando ventas diarias..." />

        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">Anulaciones POS</TableHead>
                  <TableHead className="text-right">Devoluciones adm.</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="font-medium">{formatDate(row.date)}</TableCell>
                    <TableCell className="text-right">{moneyFormatter.format(row.grossSalesAmount)}</TableCell>
                    <TableCell className="text-right">{moneyFormatter.format(row.cancelledAmount)}</TableCell>
                    <TableCell className="text-right">{moneyFormatter.format(row.returnedAmount)}</TableCell>
                    <TableCell className="text-right font-medium">{moneyFormatter.format(row.netSalesAmount)}</TableCell>
                    <TableCell className="text-right">
                      {row.saleCount} total · {row.cancelledCount} anul. · {row.returnedCount} dev.
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function InventoryValuationSection({
  generatedAt,
  rows,
  search,
  status,
  totalValue,
  onReload,
  onSearchChange
}: {
  generatedAt?: string;
  rows: InventoryValuationProduct[];
  search: string;
  status: ReportsRequestStatus;
  totalValue: number;
  onReload: () => Promise<void>;
  onSearchChange: (value: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Valuación de inventario disponible</CardTitle>
            <CardDescription>Total por producto con detalle expandible de lotes, vencimiento y costo real.</CardDescription>
          </div>
          <Button disabled={status === "loading"} type="button" variant="outline" onClick={() => void onReload()}>
            {status === "loading" ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
            Actualizar
          </Button>
        </div>
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,360px)_1fr] lg:items-end">
          <FieldGroup label="Buscar producto">
            <Input
              placeholder="Nombre comercial, genérico o código"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </FieldGroup>
          <div className="grid gap-3 sm:grid-cols-2">
            <CompactMetric label="Total general" value={moneyFormatter.format(totalValue)} />
            <CompactMetric label="Generado" value={generatedAt ? formatDateTime(generatedAt) : "Pendiente"} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ReportState status={status} emptyTitle="Sin inventario disponible" loadingText="Valuando lotes disponibles..." />

        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-md border">
            {rows.map((product, index) => (
              <ProductValuationRow key={product.productId} product={product} showSeparator={index > 0} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ProductValuationRow({
  product,
  showSeparator
}: {
  product: InventoryValuationProduct;
  showSeparator: boolean;
}) {
  return (
    <Collapsible>
      {showSeparator ? <Separator /> : null}
      <div className="grid gap-3 p-4">
        <CollapsibleTrigger asChild>
          <button className="grid w-full gap-3 text-left md:grid-cols-[1fr_180px_160px_32px] md:items-center" type="button">
            <ProductIdentity
              code={product.internalCode}
              genericName={product.genericName}
              name={product.commercialName}
            />
            <div className="text-sm md:text-right">
              <p className="font-medium">
                {quantityFormatter.format(product.totalAvailableQuantity)} {product.baseUnit.abbreviation}
              </p>
              <p className="text-xs text-muted-foreground">Disponible</p>
            </div>
            <div className="text-sm md:text-right">
              <p className="font-medium">{moneyFormatter.format(product.totalValue)}</p>
              <p className="text-xs text-muted-foreground">{product.lots.length} lote(s)</p>
            </div>
            <ChevronDown aria-hidden="true" className="hidden size-4 text-muted-foreground md:block" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <LotsTable baseUnitAbbreviation={product.baseUnit.abbreviation} lots={product.lots} />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function LotsTable({
  baseUnitAbbreviation,
  lots
}: {
  baseUnitAbbreviation: string;
  lots: InventoryValuationLot[];
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-md border bg-muted/20">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lote</TableHead>
            <TableHead>Vencimiento</TableHead>
            <TableHead className="text-right">Disponible</TableHead>
            <TableHead className="text-right">Costo base</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lots.map((lot) => (
            <TableRow key={lot.batchId}>
              <TableCell>{lot.batchNumber ?? "Sin número"}</TableCell>
              <TableCell>{formatOptionalDate(lot.expirationDate)}</TableCell>
              <TableCell className="text-right">
                {quantityFormatter.format(lot.availableQuantity)} {baseUnitAbbreviation}
              </TableCell>
              <TableCell className="text-right">{moneyFormatter.format(lot.unitCostBase)}</TableCell>
              <TableCell className="text-right font-medium">{moneyFormatter.format(lot.totalValue)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ExpiringProductsSection({
  days,
  generatedAt,
  rows,
  search,
  status,
  onDaysChange,
  onReload,
  onSearchChange
}: {
  days: number;
  generatedAt?: string;
  rows: ExpiringProduct[];
  search: string;
  status: ReportsRequestStatus;
  onDaysChange: (value: number) => void;
  onReload: () => Promise<void>;
  onSearchChange: (value: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Próximos vencimientos</CardTitle>
            <CardDescription>Lotes disponibles dentro del horizonte operativo elegido.</CardDescription>
          </div>
          <Button disabled={status === "loading"} type="button" variant="outline" onClick={() => void onReload()}>
            {status === "loading" ? <Spinner /> : <RefreshCcw aria-hidden="true" />}
            Actualizar
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-[220px_minmax(220px,360px)_1fr] md:items-end">
          <FieldGroup label="Horizonte en días">
            <Input
              min={1}
              placeholder={String(REPORTS_DEFAULT_EXPIRING_DAYS)}
              type="number"
              value={days}
              onChange={(event) => onDaysChange(parsePositiveDays(event.target.value))}
            />
          </FieldGroup>
          <FieldGroup label="Buscar producto">
            <Input
              placeholder="Nombre comercial, genérico o código"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </FieldGroup>
          <CompactMetric label="Generado" value={generatedAt ? formatDateTime(generatedAt) : "Pendiente"} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <ReportState status={status} emptyTitle="Sin lotes próximos a vencer" loadingText="Buscando vencimientos..." />

        {rows.length > 0 ? (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead className="text-right">Días</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.batchId}>
                    <TableCell>
                      <ProductIdentity code={item.internalCode} genericName={item.genericName} name={item.commercialName} />
                    </TableCell>
                    <TableCell>{item.batchNumber ?? "Sin número"}</TableCell>
                    <TableCell>{formatDate(item.expirationDate)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={item.daysUntilExpiration <= 7 ? "destructive" : "secondary"}>
                        {item.daysUntilExpiration}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{quantityFormatter.format(item.availableQuantity)}</TableCell>
                    <TableCell className="text-right font-medium">{moneyFormatter.format(item.totalValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DateField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <FieldGroup label={label}>
      <Input type="date" value={value} onChange={(event) => onChange(event.target.value)} />
    </FieldGroup>
  );
}

function FieldGroup({
  children,
  label
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function CompactMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ProductIdentity({
  code,
  genericName,
  name
}: {
  code: string;
  genericName?: string;
  name: string;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="truncate font-medium text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground">
        {code}
        {genericName ? ` · ${genericName}` : ""}
      </p>
    </div>
  );
}

function ReportState({
  emptyTitle,
  loadingText,
  status
}: {
  emptyTitle: string;
  loadingText: string;
  status: ReportsRequestStatus;
}) {
  if (status === "loading") {
    return (
      <div className="flex min-h-20 items-center justify-center gap-2 rounded-md border bg-muted/20 text-sm text-muted-foreground">
        <Spinner />
        {loadingText}
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <Alert variant="destructive">
        <ShieldAlert aria-hidden="true" />
        <AlertTitle>Permiso insuficiente</AlertTitle>
        <AlertDescription>La sesión actual no tiene autorización para leer este reporte.</AlertDescription>
      </Alert>
    );
  }

  if (status === "error") {
    return (
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>No se pudo cargar el reporte</AlertTitle>
        <AlertDescription>Revisa los filtros y vuelve a intentar la consulta.</AlertDescription>
      </Alert>
    );
  }

  if (status === "empty") {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackageSearch aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>No hay datos disponibles para los filtros actuales.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return null;
}

function getDailySalesTotals(rows: DailySalesReportRow[]): DailySalesTotals {
  return rows.reduce(
    (totals, row) => ({
      cancelledAmount: totals.cancelledAmount + row.cancelledAmount,
      cancelledCount: totals.cancelledCount + row.cancelledCount,
      grossSalesAmount: totals.grossSalesAmount + row.grossSalesAmount,
      netSalesAmount: totals.netSalesAmount + row.netSalesAmount,
      returnedAmount: totals.returnedAmount + row.returnedAmount,
      returnedCount: totals.returnedCount + row.returnedCount,
      saleCount: totals.saleCount + row.saleCount
    }),
    {
      cancelledAmount: 0,
      cancelledCount: 0,
      grossSalesAmount: 0,
      netSalesAmount: 0,
      returnedAmount: 0,
      returnedCount: 0,
      saleCount: 0
    }
  );
}

function parsePositiveDays(value: string) {
  if (!value.trim()) {
    return REPORTS_DEFAULT_EXPIRING_DAYS;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : REPORTS_DEFAULT_EXPIRING_DAYS;
}

function getTodayInBolivia() {
  return boliviaDateFormatter.format(new Date());
}

function formatDate(value: string) {
  return displayDateFormatter.format(new Date(`${value}T00:00:00-04:00`));
}

function formatOptionalDate(value?: string) {
  return value ? formatDate(value) : "Sin vencimiento";
}

function formatDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}
