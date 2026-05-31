import { useMemo, useState } from "react";
import type { InventoryStockStatus } from "@/modules/inventory";
import { AlertCircle, Boxes, ChevronLeft, ChevronRight, PackageSearch, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFefoPreview, useInventoryStock } from "@/modules/inventory";

const stockStatusLabels: Record<InventoryStockStatus | "all", string> = {
  all: "Todos los estados",
  available: "Disponible",
  low_stock: "Stock bajo",
  out_of_stock: "Agotado",
  expired: "Vencido",
  near_expiration: "Próximo a vencer"
};

const stockStatusOptions: Array<InventoryStockStatus | "all"> = [
  "all",
  "available",
  "low_stock",
  "out_of_stock",
  "near_expiration",
  "expired"
];

const quantityFormatter = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 4 });
const moneyFormatter = new Intl.NumberFormat("es-BO", { currency: "BOB", maximumFractionDigits: 2, style: "currency" });

export function BatchesPage() {
  const stock = useInventoryStock();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [previewQuantity, setPreviewQuantity] = useState<number | undefined>();
  const fefo = useFefoPreview(selectedProductId || null, previewQuantity);
  const fefoData = fefo.data;
  const products = useMemo(() => {
    const seen = new Set<string>();

    return stock.items
      .map((item) => item.product)
      .filter((product) => {
        if (seen.has(product.id)) {
          return false;
        }

        seen.add(product.id);
        return true;
      });
  }, [stock.items]);
  const isLoading = stock.status === "loading";

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Inventario por lote
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Lotes y stock</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Stock agrupado por producto, lote y vencimiento, conservando internamente cada capa de compra.
            </p>
          </div>
        </div>
      </div>

      {stock.error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>No se pudo cargar inventario</AlertTitle>
          <AlertDescription>{stock.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="gap-4">
            <div>
              <CardTitle>Stock actual</CardTitle>
              <CardDescription>Las cantidades están normalizadas a la unidad base del producto.</CardDescription>
            </div>
            <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px]">
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Buscar producto, código o lote"
                  value={stock.search}
                  onChange={(event) => stock.setSearch(event.target.value)}
                />
              </div>
              <Field>
                <FieldLabel className="sr-only">Estado</FieldLabel>
                <NativeSelect
                  value={stock.statusFilter}
                  onChange={(event) => stock.setStatusFilter(event.target.value as InventoryStockStatus | "all")}
                >
                  {stockStatusOptions.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {stockStatusLabels[status]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Lote</TableHead>
                    <TableHead>Vencimiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Disponible</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Capas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.items.map((item) => (
                    <TableRow key={`${item.productId}-${item.batchNumber ?? "none"}-${item.expirationDate ?? "none"}`}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{item.product.commercialName}</p>
                          <p className="text-xs text-muted-foreground">{item.product.internalCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.batchNumber ?? "Sin lote"}</TableCell>
                      <TableCell>{formatDate(item.expirationDate)}</TableCell>
                      <TableCell>
                        <Badge variant={getStockVariant(item.status)}>{stockStatusLabels[item.status]}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {quantityFormatter.format(item.totalAvailableQuantity)} {item.product.baseUnit.abbreviation}
                      </TableCell>
                      <TableCell className="text-right">{moneyFormatter.format(item.totalValue)}</TableCell>
                      <TableCell className="text-right">{item.layerCount}</TableCell>
                    </TableRow>
                  ))}
                  {stock.items.length === 0 ? (
                    <TableRow>
                      <TableCell className="h-56" colSpan={7}>
                        {isLoading ? (
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Spinner />
                            Cargando stock...
                          </div>
                        ) : (
                          <Empty className="border-0">
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <Boxes aria-hidden="true" />
                              </EmptyMedia>
                              <EmptyTitle>Sin stock visible</EmptyTitle>
                              <EmptyDescription>Recibe una compra para generar lotes disponibles.</EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <span>
                {stock.pagination.total === 0
                  ? "Sin resultados"
                  : `Mostrando ${stock.items.length} de ${stock.pagination.total} agrupaciones`}
              </span>
              <div className="flex items-center gap-2">
                <Button disabled={stock.pagination.page <= 1 || isLoading} size="sm" variant="outline" onClick={() => stock.setPage(stock.pagination.page - 1)}>
                  <ChevronLeft aria-hidden="true" />
                  Anterior
                </Button>
                <span className="min-w-24 text-center">
                  Página {stock.pagination.page} de {Math.max(stock.pagination.totalPages, 1)}
                </span>
                <Button disabled={stock.pagination.page >= stock.pagination.totalPages || isLoading} size="sm" variant="outline" onClick={() => stock.setPage(stock.pagination.page + 1)}>
                  Siguiente
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>FEFO visible</CardTitle>
            <CardDescription>Simula el orden de salida recomendado sin modificar inventario.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field>
              <FieldLabel>Producto</FieldLabel>
              <NativeSelect value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
                <NativeSelectOption value="">Seleccionar producto</NativeSelectOption>
                {products.map((product) => (
                  <NativeSelectOption key={product.id} value={product.id}>
                    {product.commercialName}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel>Cantidad a simular</FieldLabel>
              <Input
                min="0.0001"
                step="0.0001"
                type="number"
                value={previewQuantity ?? ""}
                onChange={(event) => setPreviewQuantity(Number.isFinite(event.currentTarget.valueAsNumber) ? event.currentTarget.valueAsNumber : undefined)}
              />
            </Field>
            {fefo.error ? (
              <Alert variant="destructive">
                <AlertCircle aria-hidden="true" />
                <AlertTitle>No se pudo calcular FEFO</AlertTitle>
                <AlertDescription>{fefo.error}</AlertDescription>
              </Alert>
            ) : null}
            {!selectedProductId ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PackageSearch aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>Selecciona un producto</EmptyTitle>
                  <EmptyDescription>El orden FEFO omite lotes vencidos o sin saldo.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid gap-3">
                {fefo.status === "loading" ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner />
                    Calculando FEFO...
                  </p>
                ) : null}
                {fefoData ? (
                  <>
                    <div className="rounded-md border bg-muted/30 p-3 text-sm">
                      <p className="font-medium text-foreground">
                        Disponible: {quantityFormatter.format(fefoData.totalAvailableQuantity)}
                      </p>
                      <p className="text-muted-foreground">
                        {fefoData.requestedQuantity
                          ? fefoData.canFulfill
                            ? "La cantidad solicitada puede cubrirse."
                            : "La cantidad solicitada supera el stock disponible."
                          : "Vista ordenada por vencimiento."}
                      </p>
                    </div>
                    {fefoData.allocations.map((allocation) => (
                      <div key={allocation.batchId} className="rounded-md border p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium">{allocation.batchNumber ?? "Sin lote"}</span>
                          <span>{formatDate(allocation.expirationDate)}</span>
                        </div>
                        <p className="text-muted-foreground">
                          Disponible {quantityFormatter.format(allocation.availableQuantity)}
                          {fefoData.requestedQuantity ? ` · Toma ${quantityFormatter.format(allocation.allocatedQuantity)}` : ""}
                        </p>
                      </div>
                    ))}
                  </>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return "Sin vencimiento";
  }

  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function getStockVariant(status: InventoryStockStatus) {
  return status === "expired" || status === "out_of_stock" ? "destructive" : status === "available" ? "default" : "secondary";
}
