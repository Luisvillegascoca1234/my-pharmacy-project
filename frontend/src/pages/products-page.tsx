import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CreateProduct, ProductType, UpdateProductUnits } from "@pharmacy-pos/shared";
import { Edit3, PackagePlus, RefreshCcw, Save, Search, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProductsCatalog } from "@/modules/products";
import { productStatusLabels, productTypeLabels } from "./products/product-labels";

const productTypes = Object.keys(productTypeLabels) as ProductType[];

const emptyProductForm: CreateProduct = {
  internalCode: "",
  barcode: undefined,
  commercialName: "",
  genericName: undefined,
  description: undefined,
  type: "medicine",
  categoryId: "",
  baseUnitId: "",
  laboratoryName: undefined,
  sanitaryRegistration: undefined,
  isMedicine: true,
  isOverTheCounter: false,
  requiresPrescription: false,
  isInventoryTracked: true,
  requiresBatch: true,
  requiresExpiration: true,
  minimumStock: 0,
  salePrice: 0
};

export function ProductsPage() {
  const catalog = useProductsCatalog();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProduct>(emptyProductForm);
  const [conversionRows, setConversionRows] = useState<Array<{ unitId: string; conversionFactor: number }>>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hasCatalogBase = catalog.categories.length > 0 && catalog.units.length > 0;
  const selectedProduct = useMemo(
    () => catalog.products.find((product) => product.id === selectedProductId) ?? null,
    [catalog.products, selectedProductId]
  );

  useEffect(() => {
    if (!selectedProduct) {
      setForm((currentForm) => ({
        ...currentForm,
        categoryId: currentForm.categoryId || catalog.categories[0]?.id || "",
        baseUnitId: currentForm.baseUnitId || catalog.units[0]?.id || ""
      }));
      return;
    }

    setForm({
      internalCode: selectedProduct.internalCode,
      barcode: selectedProduct.barcode,
      commercialName: selectedProduct.commercialName,
      genericName: selectedProduct.genericName,
      description: selectedProduct.description,
      type: selectedProduct.type,
      categoryId: selectedProduct.categoryId,
      baseUnitId: selectedProduct.baseUnitId,
      laboratoryName: selectedProduct.laboratoryName,
      sanitaryRegistration: selectedProduct.sanitaryRegistration,
      isMedicine: selectedProduct.isMedicine,
      isOverTheCounter: selectedProduct.isOverTheCounter,
      requiresPrescription: selectedProduct.requiresPrescription,
      isInventoryTracked: selectedProduct.isInventoryTracked,
      requiresBatch: selectedProduct.requiresBatch,
      requiresExpiration: selectedProduct.requiresExpiration,
      minimumStock: selectedProduct.minimumStock,
      salePrice: selectedProduct.salePrice
    });
    setConversionRows(
      selectedProduct.units.length > 0
        ? selectedProduct.units.map((unit) => ({ unitId: unit.unitId, conversionFactor: unit.conversionFactor }))
        : [{ unitId: selectedProduct.baseUnitId, conversionFactor: 1 }]
    );
  }, [catalog.categories, catalog.units, selectedProduct]);

  const summary = useMemo(
    () => ({
      total: catalog.products.length,
      active: catalog.products.filter((product) => product.status === "active").length,
      prescription: catalog.products.filter((product) => product.requiresPrescription).length
    }),
    [catalog.products]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    try {
      await catalog.saveProduct(form, selectedProduct?.id);
      setSelectedProductId(null);
      setForm({
        ...emptyProductForm,
        categoryId: catalog.categories[0]?.id || "",
        baseUnitId: catalog.units[0]?.id || ""
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo guardar el producto.");
    }
  }

  async function handleSaveConversions() {
    if (!selectedProduct) {
      return;
    }

    setSubmitError(null);

    try {
      const payload: UpdateProductUnits = {
        units: ensureBaseUnit(conversionRows, selectedProduct.baseUnitId)
      };

      await catalog.saveProductUnits(selectedProduct.id, payload);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudieron guardar las conversiones.");
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Catálogo farmacéutico
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Productos</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Base comercial y sanitaria para compras, lotes, FEFO y ventas. El costo real se definirá por lote.
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3 xl:w-[520px]">
          <Metric label="Total" value={summary.total} />
          <Metric label="Activos" value={summary.active} />
          <Metric label="Con receta" value={summary.prescription} />
        </div>
      </div>

      {catalog.error ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <ShieldAlert aria-hidden="true" className="size-4" />
          {catalog.error}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Lista de productos</CardTitle>
                <CardDescription>Consulta rápida por código, nombre comercial, genérico o código de barras.</CardDescription>
              </div>
              <div className="relative lg:w-80">
                <Search aria-hidden="true" className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Buscar producto"
                  value={catalog.search}
                  onChange={(event) => catalog.setSearch(event.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalog.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-xs">{product.internalCode}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{product.commercialName}</p>
                        <p className="text-xs text-muted-foreground">{productTypeLabels[product.type]}</p>
                      </div>
                    </TableCell>
                    <TableCell>{product.category.name}</TableCell>
                    <TableCell>{product.baseUnit.abbreviation}</TableCell>
                    <TableCell>Bs {product.salePrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={product.status === "active" ? "default" : "secondary"}>
                        {productStatusLabels[product.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedProductId(product.id)}>
                        <Edit3 aria-hidden="true" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {catalog.products.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-32 text-center text-muted-foreground" colSpan={7}>
                      {catalog.status === "loading" ? "Cargando productos..." : "Todavía no hay productos registrados."}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <CardTitle>{selectedProduct ? "Editar producto" : "Nuevo producto"}</CardTitle>
              <CardDescription>
                {catalog.canManage ? "Registra datos sanitarios y comerciales mínimos." : "Tu rol permite solo consulta."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Código interno</FieldLabel>
                    <Input
                      required
                      disabled={!catalog.canManage}
                      value={form.internalCode}
                      onChange={(event) => setForm({ ...form, internalCode: event.target.value })}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Código de barras</FieldLabel>
                    <Input
                      disabled={!catalog.canManage}
                      value={form.barcode ?? ""}
                      onChange={(event) => setForm({ ...form, barcode: event.target.value || undefined })}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Nombre comercial</FieldLabel>
                  <Input
                    required
                    disabled={!catalog.canManage}
                    value={form.commercialName}
                    onChange={(event) => setForm({ ...form, commercialName: event.target.value })}
                  />
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Categoría</FieldLabel>
                    <NativeSelect
                      required
                      className="w-full"
                      disabled={!catalog.canManage || catalog.categories.length === 0}
                      value={form.categoryId}
                      onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                    >
                      {catalog.categories.map((category) => (
                        <NativeSelectOption key={category.id} value={category.id}>
                          {category.name}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel>Unidad base</FieldLabel>
                    <NativeSelect
                      required
                      className="w-full"
                      disabled={!catalog.canManage || catalog.units.length === 0}
                      value={form.baseUnitId}
                      onChange={(event) => setForm({ ...form, baseUnitId: event.target.value })}
                    >
                      {catalog.units.map((unit) => (
                        <NativeSelectOption key={unit.id} value={unit.id}>
                          {unit.name} ({unit.abbreviation})
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Tipo</FieldLabel>
                    <NativeSelect
                      className="w-full"
                      disabled={!catalog.canManage}
                      value={form.type}
                      onChange={(event) => setForm({ ...form, type: event.target.value as ProductType })}
                    >
                      {productTypes.map((type) => (
                        <NativeSelectOption key={type} value={type}>
                          {productTypeLabels[type]}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel>Precio de venta</FieldLabel>
                    <Input
                      min="0"
                      required
                      step="0.01"
                      type="number"
                      disabled={!catalog.canManage}
                      value={form.salePrice}
                      onChange={(event) => setForm({ ...form, salePrice: Number(event.target.value) })}
                    />
                  </Field>
                </div>

                <FieldGroup className="grid gap-3 sm:grid-cols-2">
                  <BooleanField
                    disabled={!catalog.canManage}
                    label="Inventariable"
                    value={form.isInventoryTracked}
                    onChange={(value) => setForm({ ...form, isInventoryTracked: value })}
                  />
                  <BooleanField
                    disabled={!catalog.canManage}
                    label="Exige lote"
                    value={form.requiresBatch}
                    onChange={(value) => setForm({ ...form, requiresBatch: value })}
                  />
                  <BooleanField
                    disabled={!catalog.canManage}
                    label="Exige vencimiento"
                    value={form.requiresExpiration}
                    onChange={(value) => setForm({ ...form, requiresExpiration: value })}
                  />
                  <BooleanField
                    disabled={!catalog.canManage}
                    label="Requiere receta"
                    value={form.requiresPrescription}
                    onChange={(value) => setForm({ ...form, requiresPrescription: value })}
                  />
                </FieldGroup>

                {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

                <div className="flex gap-2">
                  <Button disabled={!catalog.canManage || !hasCatalogBase} type="submit">
                    <Save aria-hidden="true" />
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedProductId(null);
                      setForm({ ...emptyProductForm, categoryId: catalog.categories[0]?.id || "", baseUnitId: catalog.units[0]?.id || "" });
                    }}
                  >
                    <PackagePlus aria-hidden="true" />
                    Nuevo
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversiones</CardTitle>
              <CardDescription>Define presentaciones comerciales hacia la unidad base.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {selectedProduct ? (
                <>
                  {conversionRows.map((row, index) => (
                    <div key={`${row.unitId}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_120px]">
                      <NativeSelect
                        className="w-full"
                        disabled={!catalog.canManage}
                        value={row.unitId}
                        onChange={(event) =>
                          setConversionRows((rows) =>
                            rows.map((currentRow, currentIndex) =>
                              currentIndex === index ? { ...currentRow, unitId: event.target.value } : currentRow
                            )
                          )
                        }
                      >
                        {catalog.units.map((unit) => (
                          <NativeSelectOption key={unit.id} value={unit.id}>
                            {unit.name}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                      <Input
                        min="0.0001"
                        step="0.0001"
                        type="number"
                        disabled={!catalog.canManage || row.unitId === selectedProduct.baseUnitId}
                        value={row.unitId === selectedProduct.baseUnitId ? 1 : row.conversionFactor}
                        onChange={(event) =>
                          setConversionRows((rows) =>
                            rows.map((currentRow, currentIndex) =>
                              currentIndex === index ? { ...currentRow, conversionFactor: Number(event.target.value) } : currentRow
                            )
                          )
                        }
                      />
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button
                      disabled={!catalog.canManage || catalog.units.length === 0}
                      type="button"
                      variant="outline"
                      onClick={() => setConversionRows((rows) => [...rows, { unitId: catalog.units[0]?.id ?? "", conversionFactor: 1 }])}
                    >
                      Agregar
                    </Button>
                    <Button disabled={!catalog.canManage} type="button" onClick={() => void handleSaveConversions()}>
                      <RefreshCcw aria-hidden="true" />
                      Actualizar
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">Selecciona un producto para editar sus presentaciones.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function BooleanField({
  disabled,
  label,
  value,
  onChange
}: {
  disabled?: boolean;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm has-disabled:cursor-not-allowed has-disabled:opacity-60">
      <Checkbox checked={value} disabled={disabled} onCheckedChange={(checked) => onChange(checked === true)} />
      {label}
    </label>
  );
}

function ensureBaseUnit(rows: Array<{ unitId: string; conversionFactor: number }>, baseUnitId: string) {
  const normalizedRows = rows.filter((row) => row.unitId);

  if (!normalizedRows.some((row) => row.unitId === baseUnitId)) {
    return [{ unitId: baseUnitId, conversionFactor: 1 }, ...normalizedRows];
  }

  return normalizedRows.map((row) => (row.unitId === baseUnitId ? { ...row, conversionFactor: 1 } : row));
}
