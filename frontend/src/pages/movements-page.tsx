import type { InventoryMovementType } from "@/modules/inventory";
import { Activity, AlertCircle, ChevronLeft, ChevronRight, Search } from "lucide-react";
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
import { useInventoryMovements } from "@/modules/inventory";

const movementTypeLabels: Record<InventoryMovementType | "all", string> = {
  all: "Todos los movimientos",
  inventory_adjustment: "Ajuste manual",
  purchase_cancelled: "Anulación de compra",
  purchase_received: "Compra recibida"
};

const movementTypes: Array<InventoryMovementType | "all"> = ["all", "purchase_received", "purchase_cancelled", "inventory_adjustment"];
const quantityFormatter = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 4 });
const moneyFormatter = new Intl.NumberFormat("es-BO", { currency: "BOB", maximumFractionDigits: 4, style: "currency" });

export function MovementsPage() {
  const movements = useInventoryMovements();
  const isLoading = movements.status === "loading";

  return (
    <section className="grid gap-5">
      <div className="space-y-2">
        <Badge className="w-fit" variant="secondary">
          Kardex operativo
        </Badge>
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Movimientos</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Historial trazable de entradas, anulaciones y ajustes con cantidades en unidad base.
          </p>
        </div>
      </div>

      {movements.error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>No se pudo cargar el kardex</AlertTitle>
          <AlertDescription>{movements.error}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Kardex de inventario</CardTitle>
            <CardDescription>Los ajustes negativos y anulaciones se registran como cantidades negativas.</CardDescription>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px]">
            <div className="relative">
              <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Buscar producto, lote o motivo"
                value={movements.search}
                onChange={(event) => movements.setSearch(event.target.value)}
              />
            </div>
            <Field>
              <FieldLabel className="sr-only">Tipo</FieldLabel>
              <NativeSelect value={movements.type} onChange={(event) => movements.setType(event.target.value as InventoryMovementType | "all")}>
                {movementTypes.map((type) => (
                  <NativeSelectOption key={type} value={type}>
                    {movementTypeLabels[type]}
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
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Costo base</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.items.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDateTime(movement.createdAt)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{movement.product.commercialName}</p>
                        <p className="text-xs text-muted-foreground">{movement.product.internalCode}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{movement.batchNumber ?? "Sin lote"}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(movement.expirationDate)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={movement.quantityBase < 0 ? "destructive" : "secondary"}>{movementTypeLabels[movement.type]}</Badge>
                      {movement.reason ? <p className="mt-1 text-xs text-muted-foreground">{movement.reason}</p> : null}
                    </TableCell>
                    <TableCell>{movement.actorUser?.fullName ?? "Sistema"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {quantityFormatter.format(movement.quantityBase)} {movement.product.baseUnit.abbreviation}
                    </TableCell>
                    <TableCell className="text-right">{moneyFormatter.format(movement.unitCostBase)}</TableCell>
                  </TableRow>
                ))}
                {movements.items.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-56" colSpan={7}>
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Spinner />
                          Cargando movimientos...
                        </div>
                      ) : (
                        <Empty className="border-0">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <Activity aria-hidden="true" />
                            </EmptyMedia>
                            <EmptyTitle>Sin movimientos</EmptyTitle>
                            <EmptyDescription>Recibe una compra o registra un ajuste para alimentar el kardex.</EmptyDescription>
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
              {movements.pagination.total === 0
                ? "Sin resultados"
                : `Mostrando ${movements.items.length} de ${movements.pagination.total} movimientos`}
            </span>
            <div className="flex items-center gap-2">
              <Button disabled={movements.pagination.page <= 1 || isLoading} size="sm" variant="outline" onClick={() => movements.setPage(movements.pagination.page - 1)}>
                <ChevronLeft aria-hidden="true" />
                Anterior
              </Button>
              <span className="min-w-24 text-center">
                Página {movements.pagination.page} de {Math.max(movements.pagination.totalPages, 1)}
              </span>
              <Button disabled={movements.pagination.page >= movements.pagination.totalPages || isLoading} size="sm" variant="outline" onClick={() => movements.setPage(movements.pagination.page + 1)}>
                Siguiente
                <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
