import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Building2, ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { resetSuppliersStore, useSuppliers, type SupplierStatusFilter } from "@/modules/suppliers";

const supplierStatusLabels: Record<Exclude<SupplierStatusFilter, "all">, string> = {
  active: "Activo",
  inactive: "Inactivo"
};

const supplierStatusFilterLabels: Record<SupplierStatusFilter, string> = {
  all: "Todos",
  ...supplierStatusLabels
};

const supplierStatusOptions: SupplierStatusFilter[] = ["all", "active", "inactive"];

export function SuppliersPage() {
  const suppliers = useSuppliers();
  const isLoading = suppliers.listStatus === "loading";
  const isInitialLoading = isLoading && suppliers.items.length === 0;
  const hasFilters = suppliers.search.trim().length > 0 || suppliers.status !== "all";
  const paginationStart = suppliers.pagination.total === 0 ? 0 : (suppliers.pagination.page - 1) * suppliers.pagination.pageSize + 1;
  const paginationEnd = Math.min(suppliers.pagination.page * suppliers.pagination.pageSize, suppliers.pagination.total);

  useEffect(() => {
    return () => resetSuppliersStore();
  }, []);

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Compras y abastecimiento
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Proveedores</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Consulta proveedores por razón social, NIT o contacto para preparar compras y recepciones.
            </p>
          </div>
        </div>
        <Button asChild>
          <Link to="/suppliers/new">
            <Plus aria-hidden="true" />
            Nuevo proveedor
          </Link>
        </Button>
      </div>

      {suppliers.error ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle aria-hidden="true" className="size-4" />
          {suppliers.error}
        </div>
      ) : null}

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Lista de proveedores</CardTitle>
              <CardDescription>Filtra el padrón comercial sin cargar datos fuera del contrato de proveedores.</CardDescription>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(220px,1fr)_180px] lg:w-[560px]">
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Buscar proveedor"
                  value={suppliers.search}
                  onChange={(event) => suppliers.setSearch(event.target.value)}
                />
              </div>
              <Field>
                <FieldLabel className="sr-only">Estado</FieldLabel>
                <NativeSelect
                  className="w-full"
                  value={suppliers.status}
                  onChange={(event) => suppliers.setStatus(event.target.value as SupplierStatusFilter)}
                >
                  {supplierStatusOptions.map((status) => (
                    <NativeSelectOption key={status} value={status}>
                      {supplierStatusFilterLabels[status]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razón social</TableHead>
                  <TableHead>NIT</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.items.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{supplier.businessName}</p>
                        <p className="text-xs text-muted-foreground">{supplier.address || "Sin dirección registrada"}</p>
                      </div>
                    </TableCell>
                    <TableCell>{supplier.nit || "Sin NIT"}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm text-foreground">{supplier.contactName || "Sin contacto registrado"}</p>
                        <p className="text-xs text-muted-foreground">{supplier.phone || "Sin teléfono"}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.status === "active" ? "default" : "secondary"}>{supplierStatusLabels[supplier.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/suppliers/${supplier.id}`}>
                            <Eye aria-hidden="true" />
                            Ver
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/suppliers/${supplier.id}`}>
                            <Pencil aria-hidden="true" />
                            Editar
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {suppliers.items.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-56" colSpan={5}>
                      {isInitialLoading ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Spinner />
                          Cargando proveedores...
                        </div>
                      ) : (
                        <Empty className="border-0">
                          <EmptyHeader>
                            <EmptyMedia variant="icon">
                              <Building2 aria-hidden="true" />
                            </EmptyMedia>
                            <EmptyTitle>{hasFilters ? "No hay proveedores con esos filtros" : "Todavía no hay proveedores registrados"}</EmptyTitle>
                            <EmptyDescription>
                              {hasFilters
                                ? "Ajusta la búsqueda o el estado para ampliar los resultados."
                                : "Registra un proveedor para usarlo en compras y recepciones."}
                            </EmptyDescription>
                          </EmptyHeader>
                          {!hasFilters ? (
                            <EmptyContent>
                              <Button asChild variant="outline">
                                <Link to="/suppliers/new">
                                  <Plus aria-hidden="true" />
                                  Nuevo proveedor
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
              {suppliers.pagination.total === 0
                ? "Sin resultados"
                : `Mostrando ${paginationStart}-${paginationEnd} de ${suppliers.pagination.total} proveedores`}
            </p>
            <div className="flex items-center gap-2">
              {isLoading && suppliers.items.length > 0 ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  Actualizando
                </span>
              ) : null}
              <Button
                disabled={suppliers.pagination.page <= 1 || isLoading}
                size="sm"
                type="button"
                variant="outline"
                onClick={() => suppliers.setPage(suppliers.pagination.page - 1)}
              >
                <ChevronLeft aria-hidden="true" />
                Anterior
              </Button>
              <span className="min-w-24 text-center">
                Página {suppliers.pagination.page} de {Math.max(suppliers.pagination.totalPages, 1)}
              </span>
              <Button
                disabled={suppliers.pagination.page >= suppliers.pagination.totalPages || isLoading}
                size="sm"
                type="button"
                variant="outline"
                onClick={() => suppliers.setPage(suppliers.pagination.page + 1)}
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
