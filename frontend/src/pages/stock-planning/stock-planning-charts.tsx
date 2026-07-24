import type { ReactNode } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import type { StockPlanningDetailAnalytics } from "@/modules/stock-planning";

const quantityFormatter = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 3 });
const dateFormatter = new Intl.DateTimeFormat("es-BO", {
  day: "2-digit",
  month: "short",
  year: "numeric"
});
const dateTimeFormatter = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/La_Paz"
});

const demandConfig = {
  demand: { color: "var(--chart-1)", label: "Demanda real" },
  forecast: { color: "var(--chart-3)", label: "Pronóstico" },
  band80: { color: "var(--chart-4)", label: "Banda central 80%" },
  censoredMarker: { color: "var(--muted-foreground)", label: "Día censurado" }
} satisfies ChartConfig;

const stockConfig = {
  stock: { color: "var(--chart-2)", label: "Stock" },
  target: { color: "var(--chart-5)", label: "Meta" }
} satisfies ChartConfig;

const performanceConfig = {
  scaledError: { color: "var(--chart-3)", label: "Error escalado" },
  bias: { color: "var(--chart-5)", label: "Sesgo" }
} satisfies ChartConfig;

export function StockPlanningCharts({
  analytics,
  baseUnitAbbreviation
}: {
  analytics: StockPlanningDetailAnalytics;
  baseUnitAbbreviation: string;
}) {
  return (
    <>
      <ChartCard
        description="La zona sombreada representa el intervalo predictivo central del 80%."
        title="Demanda real frente a pronóstico"
      >
        {analytics.demand.length === 0 ? <EmptyChart message="No hay observaciones ni trayectoria para esta ejecución." /> : (
          <ChartContainer className="h-72 w-full aspect-auto" config={demandConfig}>
            <ComposedChart accessibilityLayer data={analytics.demand}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" minTickGap={32} tickFormatter={formatShortDate} />
              <YAxis tickFormatter={formatQuantityTick} width={54} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => formatQuantityTooltip(value, name, baseUnitAbbreviation)} labelFormatter={formatShortDate} />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area dataKey="band80" fill="var(--color-band80)" fillOpacity={0.16} stroke="var(--color-band80)" strokeWidth={1} type="monotone" />
              <Line dataKey="demand" dot={false} stroke="var(--color-demand)" strokeWidth={2} type="monotone" />
              <Line dataKey="forecast" dot={false} stroke="var(--color-forecast)" strokeWidth={2.5} type="monotone" />
              <Line dataKey="censoredMarker" dot={{ fill: "var(--color-censoredMarker)", r: 3 }} legendType="circle" stroke="transparent" />
            </ComposedChart>
          </ChartContainer>
        )}
      </ChartCard>

      <ChartCard
        description="Stock físico registrado en cada snapshot diario contra la meta de la ejecución seleccionada."
        title="Stock frente a meta"
      >
        {analytics.stock.length === 0 ? <EmptyChart message="No hay snapshots de inventario en el periodo histórico." /> : (
          <ChartContainer className="h-72 w-full aspect-auto" config={stockConfig}>
            <ComposedChart accessibilityLayer data={analytics.stock}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" minTickGap={32} tickFormatter={formatShortDate} />
              <YAxis tickFormatter={formatQuantityTick} width={54} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => formatQuantityTooltip(value, name, baseUnitAbbreviation)} labelFormatter={formatShortDate} />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area dataKey="stock" fill="var(--color-stock)" fillOpacity={0.12} stroke="var(--color-stock)" strokeWidth={2} type="stepAfter" />
              <Line dataKey="target" dot={false} stroke="var(--color-target)" strokeDasharray="6 4" strokeWidth={2} />
            </ComposedChart>
          </ChartContainer>
        )}
      </ChartCard>

      <ChartCard
        description="El error usa una escala relativa; el sesgo se expresa en la unidad base y conserva su signo."
        title="Error y sesgo históricos"
      >
        {analytics.performance.length === 0 ? <EmptyChart message="No hay métricas históricas comparables." /> : (
          <ChartContainer className="h-72 w-full aspect-auto" config={performanceConfig}>
            <ComposedChart accessibilityLayer data={analytics.performance}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" minTickGap={32} tickFormatter={formatShortDateTime} />
              <YAxis tickFormatter={formatMetricTick} width={54} yAxisId="error" />
              <YAxis orientation="right" tickFormatter={formatQuantityTick} width={54} yAxisId="bias" />
              <ReferenceLine stroke="var(--border)" y={0} yAxisId="bias" />
              <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => formatPerformanceTooltip(value, name, baseUnitAbbreviation)} labelFormatter={formatShortDateTime} />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line dataKey="scaledError" stroke="var(--color-scaledError)" strokeWidth={2.5} yAxisId="error" />
              <Line dataKey="bias" stroke="var(--color-bias)" strokeDasharray="5 4" strokeWidth={2} yAxisId="bias" />
            </ComposedChart>
          </ChartContainer>
        )}
      </ChartCard>
    </>
  );
}

function ChartCard({ children, description, title }: { children: ReactNode; description: string; title: string }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid h-72 place-items-center rounded-lg border border-dashed bg-muted/20 px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function formatShortDate(value: unknown) {
  return typeof value === "string"
    ? dateFormatter.format(new Date(`${value}T12:00:00-04:00`))
    : "";
}

function formatShortDateTime(value: unknown) {
  return typeof value === "string" ? dateTimeFormatter.format(new Date(value)) : "";
}

function formatQuantityTick(value: number) {
  return quantityFormatter.format(value);
}

function formatMetricTick(value: number) {
  return quantityFormatter.format(value);
}

function formatQuantityTooltip(value: unknown, name: unknown, unit: string) {
  const key = typeof name === "string" ? name : "";
  const label = demandConfig[key as keyof typeof demandConfig]?.label ??
    stockConfig[key as keyof typeof stockConfig]?.label ??
    key;
  const formatted = Array.isArray(value)
    ? `${quantityFormatter.format(Number(value[0]))}–${quantityFormatter.format(Number(value[1]))}`
    : quantityFormatter.format(Number(value));
  return <TooltipRow label={label} value={`${formatted} ${unit}`} />;
}

function formatPerformanceTooltip(value: unknown, name: unknown, unit: string) {
  const key = typeof name === "string" ? name : "";
  const label = performanceConfig[key as keyof typeof performanceConfig]?.label ?? key;
  const suffix = key === "bias" ? ` ${unit}` : " (escala relativa)";
  return <TooltipRow label={label} value={`${quantityFormatter.format(Number(value))}${suffix}`} />;
}

function TooltipRow({ label, value }: { label: ReactNode; value: string }) {
  return (
    <div className="flex w-full min-w-48 items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium tabular-nums">{value}</span>
    </div>
  );
}
