import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CreateProduct, ProductType, UpdateProductUnits } from "@pharmacy-pos/shared";
import { Edit3, PackagePlus, RefreshCcw, Save, Search, ShieldAlert } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useProductsCatalog } from "@/modules/products";
import { createEmptyProductForm, selectProductFormUiActions, selectProductFormUiState, useProductFormUiStore } from "./products/product-form-ui-store";
import { productStatusLabels, productTypeLabels } from "./products/product-labels";

const productTypes = Object.keys(productTypeLabels) as ProductType[];
const PRODUCT_SEARCH_DEBOUNCE_MS = 350;

export function ProductsPage() {
  const catalog = useProductsCatalog();
  const { newProductForm } = useProductFormUiStore(useShallow(selectProductFormUiState));
  const { patchNewProductForm, resetNewProductForm, setNewProductField } = useProductFormUiStore(useShallow(selectProductFormUiActions));
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [editProductForm, setEditProductForm] = useState<CreateProduct>(createEmptyProductForm());
  const [conversionRows, setConversionRows] = useState<Array<{ unitId: string; conversionFactor: number }>>([]);
  const [searchInput, setSearchInput] = useState(catalog.search);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const debouncedSearchInput = useDebouncedValue(searchInput, PRODUCT_SEARCH_DEBOUNCE_MS);

  const hasCatalogBase = catalog.categories.length > 0 && catalog.units.length > 0 && catalog.suppliers.length > 0;
  const selectedProduct = useMemo(
    () => catalog.products.find((product) => product.id === selectedProductId) ?? null,
    [catalog.products, selectedProductId]
  );

  const form = selectedProduct ? editProductForm : newProductForm;
  const defaultProductReferences = useMemo(
    () => ({
      categoryId: catalog.categories[0]?.id || "",
      baseUnitId: catalog.units[0]?.id || "",
      supplierId: catalog.suppliers[0]?.id || ""
    }),
    [catalog.categories, catalog.suppliers, catalog.units]
  );

  useEffect(() => {
    if (!selectedProduct) {
      patchNewProductForm({
        categoryId: newProductForm.categoryId || defaultProductReferences.categoryId,
        baseUnitId: newProductForm.baseUnitId || defaultProductReferences.baseUnitId,
        supplierId: newProductForm.supplierId || defaultProductReferences.supplierId
      });
      return;
    }

    setEditProductForm({
      internalCode: selectedProduct.internalCode,
      barcode: selectedProduct.barcode,
      commercialName: selectedProduct.commercialName,
      genericName: selectedProduct.genericName,
      description: selectedProduct.description,
      type: selectedProduct.type,
      categoryId: selectedProduct.categoryId,
      baseUnitId: selectedProduct.baseUnitId,
      supplierId: selectedProduct.supplierId,
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
  }, [defaultProductReferences, newProductForm.baseUnitId, newProductForm.categoryId, newProductForm.supplierId, patchNewProductForm, selectedProduct]);

  useEffect(() => {
    setSearchInput(catalog.search);
  }, [catalog.search]);

  useEffect(() => {
    if (debouncedSearchInput === catalog.search) {
      return;
    }

    catalog.setSearch(debouncedSearchInput);
  }, [catalog.search, catalog.setSearch, debouncedSearchInput]);

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
      await catalog.saveProduct(buildProductSubmitPayload(form), selectedProduct?.id);
      setSelectedProductId(null);
      setEditProductForm(createEmptyProductForm());
      resetNewProductForm(defaultProductReferences);
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
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
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[92px]">Código</TableHead>
                  <TableHead className="w-[34%]">Producto</TableHead>
                  <TableHead className="w-[28%]">Clasificación</TableHead>
                  <TableHead className="w-[72px]">Unidad</TableHead>
                  <TableHead className="w-[124px]">Venta</TableHead>
                  <TableHead className="w-[92px] text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalog.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="min-w-0 font-mono text-xs">
                      <span className="block truncate" title={product.internalCode}>
                        {product.internalCode}
                      </span>
                    </TableCell>
                    <TableCell className="min-w-0 whitespace-normal">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate font-medium text-foreground" title={product.commercialName}>
                          {product.commercialName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground" title={productTypeLabels[product.type]}>
                          {productTypeLabels[product.type]}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0 whitespace-normal">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-foreground" title={product.category.name}>
                          {product.category.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground" title={product.supplier.businessName}>
                          {product.supplier.businessName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-0">
                      <span className="block truncate" title={product.baseUnit.abbreviation}>
                        {product.baseUnit.abbreviation}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-medium text-foreground">Bs {product.salePrice.toFixed(2)}</span>
                        <Badge variant={product.status === "active" ? "default" : "secondary"}>
                          {productStatusLabels[product.status]}
                        </Badge>
                      </div>
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
                    <TableCell className="h-32 text-center text-muted-foreground" colSpan={6}>
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
                      disabled
                      value={selectedProduct ? form.internalCode ?? "" : "Automático al guardar"}
                      readOnly
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Código de barras</FieldLabel>
                    <Input
                      disabled={!catalog.canManage}
                      value={form.barcode ?? ""}
                      onChange={(event) => setProductFormField("barcode", event.target.value || undefined)}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Nombre comercial</FieldLabel>
                  <Input
                    required
                    disabled={!catalog.canManage}
                    value={form.commercialName}
                    onChange={(event) => setProductFormField("commercialName", event.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel>Principio activo</FieldLabel>
                  <Input
                    disabled={!catalog.canManage}
                    value={form.genericName ?? ""}
                    onChange={(event) => setProductFormField("genericName", event.target.value || undefined)}
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
                      onChange={(event) => setProductFormField("categoryId", event.target.value)}
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
                      onChange={(event) => setProductFormField("baseUnitId", event.target.value)}
                    >
                      {catalog.units.map((unit) => (
                        <NativeSelectOption key={unit.id} value={unit.id}>
                          {unit.name} ({unit.abbreviation})
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Proveedor</FieldLabel>
                  <NativeSelect
                    required
                    className="w-full"
                    disabled={!catalog.canManage || catalog.suppliers.length === 0}
                    value={form.supplierId}
                    onChange={(event) => setProductFormField("supplierId", event.target.value)}
                  >
                    {catalog.suppliers.map((supplier) => (
                      <NativeSelectOption key={supplier.id} value={supplier.id}>
                        {supplier.businessName}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Tipo</FieldLabel>
                    <NativeSelect
                      className="w-full"
                      disabled={!catalog.canManage}
                      value={form.type}
                      onChange={(event) => setProductFormField("type", event.target.value as ProductType)}
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
                      onChange={(event) => setProductFormField("salePrice", getNumberInputValue(event.currentTarget))}
                    />
                  </Field>
                </div>

                <FieldGroup className="grid gap-3 sm:grid-cols-2">
                  <BooleanField
                    disabled={!catalog.canManage}
                    label="Inventariable"
                    value={form.isInventoryTracked}
                    onChange={(value) => setProductFormField("isInventoryTracked", value)}
                  />
                  <BooleanField
                    disabled={!catalog.canManage}
                    label="Exige lote"
                    value={form.requiresBatch}
                    onChange={(value) => setProductFormField("requiresBatch", value)}
                  />
                  <BooleanField
                    disabled={!catalog.canManage}
                    label="Exige vencimiento"
                    value={form.requiresExpiration}
                    onChange={(value) => setProductFormField("requiresExpiration", value)}
                  />
                  <BooleanField
                    disabled={!catalog.canManage}
                    label="Requiere receta"
                    value={form.requiresPrescription}
                    onChange={(value) => setProductFormField("requiresPrescription", value)}
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
                      setEditProductForm(createEmptyProductForm());
                      resetNewProductForm(defaultProductReferences);
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
                        onChange={(event) => {
                          const unitId = event.target.value;

                          setConversionRows((rows) =>
                            rows.map((currentRow, currentIndex) =>
                              currentIndex === index ? { ...currentRow, unitId } : currentRow
                            )
                          );
                        }}
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
                        onChange={(event) => {
                          const conversionFactor = getPositiveNumberInputValue(event.currentTarget);

                          setConversionRows((rows) =>
                            rows.map((currentRow, currentIndex) =>
                              currentIndex === index ? { ...currentRow, conversionFactor } : currentRow
                            )
                          );
                        }}
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

  function setProductFormField<Field extends keyof CreateProduct>(field: Field, value: CreateProduct[Field]) {
    if (selectedProduct) {
      setEditProductForm((currentForm) => ({
        ...currentForm,
        [field]: value
      }));
      return;
    }

    setNewProductField(field, value);
  }
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

function getNumberInputValue(input: HTMLInputElement) {
  return Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : 0;
}

function getPositiveNumberInputValue(input: HTMLInputElement) {
  return Number.isFinite(input.valueAsNumber) && input.valueAsNumber > 0 ? input.valueAsNumber : 1;
}

function buildProductSubmitPayload(form: CreateProduct): CreateProduct {
  return {
    ...form,
    barcode: normalizeOptionalText(form.barcode),
    genericName: normalizeOptionalText(form.genericName),
    description: normalizeOptionalText(form.description),
    laboratoryName: normalizeOptionalText(form.laboratoryName),
    sanitaryRegistration: normalizeOptionalText(form.sanitaryRegistration),
    internalCode: normalizeOptionalText(form.internalCode),
    minimumStock: normalizeNonNegativeNumber(form.minimumStock),
    salePrice: normalizeNonNegativeNumber(form.salePrice)
  };
}

function normalizeOptionalText(value: string | undefined) {
  const normalizedValue = value?.trim();

  return normalizedValue || undefined;
}

function normalizeNonNegativeNumber(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : 0;
}
