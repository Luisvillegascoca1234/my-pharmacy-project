import { useEffect } from "react";
import { Link } from "react-router-dom";
import type { PurchaseStatusFilter } from "@/modules/purchases";
import {
  AlertCircle,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Plus,
  Search,
  ShoppingCart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { resetPurchasesStore, usePurchases } from "@/modules/purchases";
import { resetSuppliersStore, useSuppliers } from "@/modules/suppliers";

const purchaseStatusLabels: Record<Exclude<PurchaseStatusFilter, "all">, string> = {
  cancelled: "Anulada",
  draft: "Borrador",
  received: "Recibida"
};

const purchaseStatusFilterLabels: Record<PurchaseStatusFilter, string> = {
  all: "Todos los estados",
  ...purchaseStatusLabels
};

const purchaseStatusOptions: PurchaseStatusFilter[] = ["all", "draft", "received", "cancelled"];
const supplierFilterPageSize = 100;

const moneyFormatter = new Intl.NumberFormat("es-BO", {
  currency: "BOB",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency"
});

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function formatDate(value?: string) {
  if (!value) {
    return "Pendiente";
  }

  const [datePart] = value.split("T");
  const [year, month, day] = datePart.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function getPurchaseStatusVariant(status: Exclude<PurchaseStatusFilter, "all">) {
  if (status === "received") {
    return "default";
  }

  if (status === "cancelled") {
    return "destructive";
  }

  return "secondary";
}

export function PurchasesPage() {
  const purchases = usePurchases();
  const suppliers = useSuppliers();
  const isLoading = purchases.listStatus === "loading";
  const isInitialLoading = isLoading && purchases.items.length === 0;
  const hasFilters =
    purchases.search.trim().length > 0 ||
    purchases.status !== "all" ||
    purchases.supplierId.trim().length > 0 ||
    purchases.fromDate.trim().length > 0 ||
    purchases.toDate.trim().length > 0;
  const paginationStart =
    purchases.pagination.total === 0 ? 0 : (purchases.pagination.page - 1) * purchases.pagination.pageSize + 1;
  const paginationEnd = Math.min(purchases.pagination.page * purchases.pagination.pageSize, purchases.pagination.total);
  const supplierPageSize = suppliers.pagination.pageSize;
  const setSupplierPageSize = suppliers.setPageSize;

  useEffect(() => {
    return () => {
      resetPurchasesStore();
      resetSuppliersStore();
    };
  }, []);

  useEffect(() => {
    if (supplierPageSize !== supplierFilterPageSize) {
      setSupplierPageSize(supplierFilterPageSize);
    }
  }, [setSupplierPageSize, supplierPageSize]);

  if (!purchases.canManage) {
    return (
      <section className="grid gap-5">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Compras y abastecimiento
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Compras</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              La gestión de compras está disponible para administración y superadministración.
            </p>
          </div>
        </div>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Permiso insuficiente</EmptyTitle>
            <EmptyDescription>Tu rol actual no permite consultar ni gestionar compras recibidas.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Compras y abastecimiento
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Compras</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Consulta compras por proveedor, estado, fecha comercial y recepción antes de registrar ingresos de inventario.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/purchases/new">
            <Plus aria-hidden="true" />
            Nueva compra
          </Link>
        </Button>
      </div>

      {purchases.error ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle aria-hidden="true" className="size-4" />
          {purchases.error}
        </div>
      ) : null}

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3">
            <div>
              <CardTitle>Lista de compras</CardTitle>
              <CardDescription>Filtra compras registradas sin depender de datos simulados ni clientes internos.</CardDescription>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_190px_220px_160px_160px]">
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Buscar compra o proveedor"
                  value={purchases.search}
                  onChange={(event) => purchases.setSearch(event.target.value)}
                />
              </div>
              <Field>
                <FieldLabel className="sr-only">Estado</FieldLabel>
                <NativeSelect
                  className="w-full"
                  value={purchases.status}
                  onChange={(event) => purchases.setStatus(event.target.value as PurchaseStatusFilter)}
                >
                  {purchaseStatusOptions.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {purchaseStatusFilterLabels[status]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel className="sr-only">Proveedor</FieldLabel>
                <NativeSelect
                  className="w-full"
                  disabled={suppliers.listStatus === "loading" && suppliers.items.length === 0}
                  value={purchases.supplierId}
                  onChange={(event) => purchases.setSupplierId(event.target.value)}
                >
                  <NativeSelectOption value="">Todos los proveedores</NativeSelectOption>
                  {suppliers.items.map((supplier) => (
                    <NativeSelectOption key={supplier.id} value={supplier.id}>
                      {supplier.businessName}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel className="sr-only">Desde</FieldLabel>
                <Input
                  aria-label="Desde"
                  type="date"
                  value={purchases.fromDate}
                  onChange={(event) => purchases.setFromDate(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel className="sr-only">Hasta</FieldLabel>
                <Input
                  aria-label="Hasta"
                  type="date"
                  value={purchases.toDate}
                  onChange={(event) => purchases.setToDate(event.target.value)}
                />
              </Field>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha comercial</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Recepción</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.items.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{purchase.supplier.businessName}</p>
                        <p className="text-xs text-muted-foreground">{purchase.supplier.nit || "Sin NIT"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CalendarClock aria-hidden="true" className="size-4 text-muted-foreground" />
                        {formatDate(purchase.purchaseDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPurchaseStatusVariant(purchase.status)}>{purchaseStatusLabels[purchase.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm text-foreground">{formatDate(purchase.receivedAt)}</p>
                        <p className="text-xs text-muted-foreground">
                          {purchase.receivedByUserId ? "Recepción registrada" : "Sin recepción"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatMoney(purchase.totalAmount)}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/purchases/${purchase.id}`}>
                          <Eye aria-hidden="true" />
                          Ver
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {purchases.items.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-56" colSpan={6}>
                      {isInitialLoading ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Spinner />
                          Cargando compras...
                        </div>
                      ) : (
                        <Empty className="border-0">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              {hasFilters ? <FileText aria-hidden="true" /> : <ShoppingCart aria-hidden="true" />}
                            </EmptyMedia>
                            <EmptyTitle>{hasFilters ? "No hay compras con esos filtros" : "Todavía no hay compras registradas"}</EmptyTitle>
                            <EmptyDescription>
                              {hasFilters
                                ? "Ajusta proveedor, estado, fechas o búsqueda para ampliar los resultados."
                                : "Registra una compra para preparar la recepción de inventario."}
                            </EmptyDescription>
                          </EmptyHeader>
                          {!hasFilters ? (
                            <EmptyContent>
                              <Button asChild variant="outline">
                                <Link to="/purchases/new">
                                  <Plus aria-hidden="true" />
                                  Nueva compra
                                </Link>
                              </Button>
                            </EmptyContent>
                          ) : null}
                        </Empty>
                      )}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>
              {purchases.pagination.total === 0
                ? "Sin resultados"
                : `Mostrando ${paginationStart}-${paginationEnd} de ${purchases.pagination.total} compras`}
            </p>
            <div className="flex items-center gap-2">
              {isLoading && purchases.items.length > 0 ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  Actualizando
                </span>
              ) : null}
              <Button
                disabled={purchases.pagination.page <= 1 || isLoading}
                size="sm"
                type="button"
                variant="outline"
                onClick={() => purchases.setPage(purchases.pagination.page - 1)}
              >
                <ChevronLeft aria-hidden="true" />
                Anterior
              </Button>
              <span className="min-w-24 text-center">
                Página {purchases.pagination.page} de {Math.max(purchases.pagination.totalPages, 1)}
              </span>
              <Button
                disabled={purchases.pagination.page >= purchases.pagination.totalPages || isLoading}
                size="sm"
                type="button"
                variant="outline"
                onClick={() => purchases.setPage(purchases.pagination.page + 1)}
              >
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
