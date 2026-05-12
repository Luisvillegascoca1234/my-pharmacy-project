import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import type { Product, PurchaseStatus, Supplier } from "@pharmacy-pos/shared";
import { AlertCircle, ArrowLeft, Ban, CalendarClock, PackageCheck, PackagePlus, Plus, Save, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { resetProductsCatalogStore, useProductsCatalog } from "@/modules/products";
import { resetPurchasesStore, usePurchases, type PurchaseDraftItemForm } from "@/modules/purchases";
import { resetSuppliersStore, useSuppliers } from "@/modules/suppliers";

type PurchaseFormPageProps = {
  mode: "create" | "detail";
};

type ValidationResult = {
  itemErrors: Record<number, string>;
  message: string | null;
};

const supplierPickerPageSize = 100;

const purchaseStatusLabels: Record<PurchaseStatus, string> = {
  cancelled: "Anulada",
  draft: "Borrador",
  received: "Recibida"
};

const moneyFormatter = new Intl.NumberFormat("es-BO", {
  currency: "BOB",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: "currency"
});

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function getPurchaseStatusVariant(status: PurchaseStatus) {
  if (status === "received") {
    return "default";
  }

  if (status === "cancelled") {
    return "destructive";
  }

  return "secondary";
}

function toComparableItemKey(item: PurchaseDraftItemForm) {
  return [
    item.productId,
    item.unitId,
    item.batchNumber.trim().toUpperCase(),
    item.expirationDate.trim()
  ].join("|");
}

function getProductById(products: Product[], productId: string) {
  return products.find((product) => product.id === productId);
}

function getConfiguredUnits(product?: Product) {
  if (!product) {
    return [];
  }

  return product.units.length > 0
    ? product.units
    : [
        {
          id: product.baseUnit.id,
          productId: product.id,
          unitId: product.baseUnitId,
          unit: product.baseUnit,
          conversionFactor: 1,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        }
      ];
}

function getLineTotal(item: PurchaseDraftItemForm) {
  return Number(item.quantity || 0) * Number(item.unitCost || 0);
}

function validateDraft(items: PurchaseDraftItemForm[], products: Product[]): ValidationResult {
  const itemErrors: Record<number, string> = {};
  const seenKeys = new Map<string, number>();

  items.forEach((item, index) => {
    const product = getProductById(products, item.productId);
    const configuredUnits = getConfiguredUnits(product);

    if (!item.productId || !item.unitId) {
      itemErrors[index] = "Selecciona producto y unidad.";
      return;
    }

    if (!product) {
      itemErrors[index] = "El producto seleccionado ya no está disponible en el catálogo.";
      return;
    }

    if (!configuredUnits.some((unit) => unit.unitId === item.unitId)) {
      itemErrors[index] = "La unidad no está configurada para este producto.";
      return;
    }

    if (Number(item.quantity) <= 0) {
      itemErrors[index] = "La cantidad debe ser mayor a cero.";
      return;
    }

    if (Number(item.unitCost) < 0) {
      itemErrors[index] = "El costo unitario no puede ser negativo.";
      return;
    }

    if (product.isInventoryTracked && (!item.batchNumber.trim() || !item.expirationDate.trim())) {
      itemErrors[index] = "Los items inventariables requieren lote y vencimiento.";
      return;
    }

    const key = toComparableItemKey(item);
    const duplicateIndex = seenKeys.get(key);

    if (duplicateIndex !== undefined) {
      itemErrors[index] = `Item duplicado con la fila ${duplicateIndex + 1}.`;
      return;
    }

    seenKeys.set(key, index);
  });

  return {
    itemErrors,
    message: Object.keys(itemErrors).length > 0 ? "Corrige los items antes de guardar el borrador." : null
  };
}

function formatDate(value?: string) {
  if (!value) {
    return "Pendiente";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function formatDateTime(value?: string) {
  if (!value) {
    return "Pendiente";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(parsedDate);
}

function formatOptionalText(value?: string) {
  return value?.trim() ? value.trim() : "Sin registrar";
}

export function PurchaseFormPage({ mode }: PurchaseFormPageProps) {
  const navigate = useNavigate();
  const params = useParams();
  const purchaseId = params.id;
  const isCreateMode = mode === "create";
  const purchases = usePurchases({ autoLoadList: false });
  const suppliers = useSuppliers();
  const productsCatalog = useProductsCatalog();
  const [localError, setLocalError] = useState<string | null>(null);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [receiveNotes, setReceiveNotes] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState<string | null>(null);

  const selectedPurchase = purchases.selectedPurchase;
  const isLoadingDetail = !isCreateMode && purchases.detailStatus === "loading";
  const isSaving = purchases.saveStatus === "loading";
  const isReceiving = purchases.receiveStatus === "loading";
  const isCancelling = purchases.cancelStatus === "loading";
  const isNotFound = !isCreateMode && purchases.detailStatus === "error" && purchases.errorStatusCode === 404;
  const isDraft = isCreateMode || selectedPurchase?.status === "draft";
  const canEdit = purchases.canManage && isDraft && !isLoadingDetail;
  const canOperateDraft = purchases.canManage && !isCreateMode && selectedPurchase?.status === "draft" && !isLoadingDetail;
  const canReceive = canOperateDraft && !purchases.isDirty && !isReceiving && !isCancelling;
  const canCancel = canOperateDraft && !isReceiving && !isCancelling;
  const activeProducts = useMemo(() => productsCatalog.products.filter((product) => product.status === "active"), [productsCatalog.products]);
  const activeSuppliers = useMemo(() => suppliers.items.filter((supplier) => supplier.status === "active"), [suppliers.items]);
  const selectedSupplierOption = selectedPurchase?.supplier;
  const supplierOptions = useMemo(() => {
    if (!selectedSupplierOption || activeSuppliers.some((supplier) => supplier.id === selectedSupplierOption.id)) {
      return activeSuppliers;
    }

    return [...activeSuppliers, selectedSupplierOption as Supplier];
  }, [activeSuppliers, selectedSupplierOption]);
  const subtotal = useMemo(() => purchases.draftForm.items.reduce((total, item) => total + getLineTotal(item), 0), [purchases.draftForm.items]);
  const validation = useMemo(() => validateDraft(purchases.draftForm.items, activeProducts), [activeProducts, purchases.draftForm.items]);
  const canSubmit =
    canEdit &&
    !isSaving &&
    purchases.draftForm.supplierId.trim().length > 0 &&
    purchases.draftForm.purchaseDate.trim().length > 0 &&
    purchases.draftForm.items.length > 0;

  useEffect(() => {
    return () => {
      resetPurchasesStore();
      resetSuppliersStore();
      resetProductsCatalogStore();
    };
  }, []);

  useEffect(() => {
    if (suppliers.pagination.pageSize !== supplierPickerPageSize) {
      suppliers.setPageSize(supplierPickerPageSize);
    }

    if (suppliers.status !== "active") {
      suppliers.setStatus("active");
    }
  }, [suppliers.pagination.pageSize, suppliers.setPageSize, suppliers.setStatus, suppliers.status]);

  useEffect(() => {
    if (isCreateMode) {
      purchases.resetDraftForm();
      return;
    }

    if (!purchaseId) {
      return;
    }

    const controller = new AbortController();

    void purchases.loadPurchase(purchaseId, controller.signal);

    return () => controller.abort();
  }, [isCreateMode, purchaseId]);

  if (!isCreateMode && !purchaseId) {
    return <Navigate replace to="/purchases" />;
  }

  if (!purchases.canManage) {
    return (
      <section className="grid gap-5">
        <Button asChild className="w-fit" variant="outline">
          <Link to="/purchases">
            <ArrowLeft aria-hidden="true" />
            Volver
          </Link>
        </Button>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Permiso insuficiente</EmptyTitle>
            <EmptyDescription>Tu rol actual no permite gestionar borradores de compra.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </section>
    );
  }

  async function saveForm() {
    setLocalError(null);

    if (validation.message) {
      setLocalError(validation.message);
      return;
    }

    const purchase = await purchases.saveDraftForm(isCreateMode ? undefined : purchaseId);

    if (!purchase) {
      return;
    }

    if (isCreateMode) {
      navigate(`/purchases/${purchase.id}`, { replace: true });
    }
  }

  function updateItem(index: number, field: keyof PurchaseDraftItemForm, value: string | number) {
    setLocalError(null);
    purchases.setDraftItemField(index, field, value as never);
  }

  function updateProduct(index: number, productId: string) {
    const product = getProductById(activeProducts, productId);
    const firstUnitId = getConfiguredUnits(product)[0]?.unitId ?? "";

    setLocalError(null);
    purchases.setDraftItemField(index, "productId", productId);
    purchases.setDraftItemField(index, "unitId", firstUnitId);
    purchases.setDraftItemField(index, "batchNumber", "");
    purchases.setDraftItemField(index, "expirationDate", "");
  }

  const title = isCreateMode ? "Nueva compra" : "Detalle de compra";
  const status = selectedPurchase?.status ?? "draft";
  const displayTotal = selectedPurchase && !purchases.isDirty ? selectedPurchase.totalAmount : subtotal;
  const errorTitle = purchases.receiveStatus === "error" ? "No se pudo recibir" : purchases.cancelStatus === "error" ? "No se pudo anular" : "No se pudo guardar";
  const syncAlertTitle = isDraft ? (purchases.isDirty ? "Hay cambios pendientes" : "Borrador sincronizado") : "Historial de compra";
  const syncAlertDescription = isDraft
    ? purchases.isDirty
      ? "Guarda el borrador antes de continuar con recepción o revisión operativa."
      : "La información visible coincide con el último guardado exitoso."
    : "La compra se muestra en modo de solo lectura.";

  function openReceiveDialog() {
    setLocalError(null);

    if (!canReceive) {
      return;
    }

    setReceiveNotes(selectedPurchase?.receiveNotes ?? "");
    setReceiveDialogOpen(true);
  }

  async function receivePurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!purchaseId || !canReceive) {
      return;
    }

    const purchase = await purchases.receivePurchase(purchaseId, { receiveNotes });

    if (purchase) {
      setReceiveDialogOpen(false);
      setReceiveNotes("");
    }
  }

  function openCancelDialog() {
    setLocalError(null);

    if (!canCancel) {
      return;
    }

    setCancelReason("");
    setCancelReasonError(null);
    setCancelDialogOpen(true);
  }

  async function cancelPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!purchaseId || !canCancel) {
      return;
    }

    const normalizedReason = cancelReason.trim();

    if (normalizedReason.length < 3 || normalizedReason.length > 240) {
      setCancelReasonError("El motivo debe tener entre 3 y 240 caracteres.");
      return;
    }

    const purchase = await purchases.cancelPurchase(purchaseId, { cancelReason: normalizedReason });

    if (purchase) {
      setCancelDialogOpen(false);
      setCancelReason("");
      setCancelReasonError(null);
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Button asChild className="w-fit" variant="outline">
            <Link to="/purchases">
              <ArrowLeft aria-hidden="true" />
              Volver
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">{title}</h1>
            <Badge variant={getPurchaseStatusVariant(status)}>{purchaseStatusLabels[status]}</Badge>
            {purchases.isDirty ? <Badge variant="secondary">Cambios pendientes</Badge> : null}
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Prepara proveedor, fecha comercial e items del borrador antes de recibir inventario.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {isDraft ? (
            <Button disabled={!canSubmit || Boolean(validation.message)} type="button" onClick={saveForm}>
              {isSaving ? <Spinner /> : <Save aria-hidden="true" />}
              Guardar borrador
            </Button>
          ) : null}
          {canOperateDraft ? (
            <>
              <Button disabled={!canReceive} type="button" variant="outline" onClick={openReceiveDialog}>
                {isReceiving ? <Spinner /> : <PackageCheck aria-hidden="true" />}
                Recibir
              </Button>
              <Button disabled={!canCancel} type="button" variant="destructive" onClick={openCancelDialog}>
                {isCancelling ? <Spinner /> : <Ban aria-hidden="true" />}
                Anular
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {isLoadingDetail ? (
        <div className="flex min-h-60 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Cargando compra...
        </div>
      ) : isNotFound ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackagePlus aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Compra no encontrada</EmptyTitle>
            <EmptyDescription>La compra solicitada no existe o ya no está disponible para tu sesión.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          {!isDraft ? (
            <Alert>
              <CalendarClock aria-hidden="true" />
              <AlertTitle>Compra solo lectura</AlertTitle>
              <AlertDescription>Las compras recibidas o anuladas no permiten editar encabezado ni items.</AlertDescription>
            </Alert>
          ) : null}

          {canOperateDraft && purchases.isDirty ? (
            <Alert>
              <AlertCircle aria-hidden="true" />
              <AlertTitle>Recepción bloqueada</AlertTitle>
              <AlertDescription>Guarda el borrador antes de recibir la compra.</AlertDescription>
            </Alert>
          ) : null}

          {localError || purchases.error || productsCatalog.error || suppliers.error ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertTitle>{errorTitle}</AlertTitle>
              <AlertDescription>{localError ?? purchases.error ?? productsCatalog.error ?? suppliers.error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-5">
              <Card>
                <CardHeader>
                  <CardTitle>Encabezado</CardTitle>
                  <CardDescription>El proveedor debe estar activo para nuevas compras.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Proveedor</FieldLabel>
                    <NativeSelect
                      disabled={!canEdit || suppliers.listStatus === "loading"}
                      value={purchases.draftForm.supplierId}
                      onChange={(event) => {
                        setLocalError(null);
                        purchases.setDraftField("supplierId", event.target.value);
                      }}
                    >
                      <NativeSelectOption value="">Seleccionar proveedor</NativeSelectOption>
                      {supplierOptions.map((supplier) => (
                        <NativeSelectOption key={supplier.id} value={supplier.id}>
                          {supplier.businessName}
                          {supplier.status === "inactive" ? " (histórico)" : ""}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel>Fecha comercial</FieldLabel>
                    <Input
                      disabled={!canEdit}
                      type="date"
                      value={purchases.draftForm.purchaseDate}
                      onChange={(event) => {
                        setLocalError(null);
                        purchases.setDraftField("purchaseDate", event.target.value);
                      }}
                    />
                  </Field>
                  <Field className="md:col-span-2">
                    <FieldLabel>Notas</FieldLabel>
                    <Textarea
                      disabled={!canEdit}
                      placeholder="Notas internas de compra"
                      value={purchases.draftForm.notes}
                      onChange={(event) => {
                        setLocalError(null);
                        purchases.setDraftField("notes", event.target.value);
                      }}
                    />
                  </Field>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="gap-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Items</CardTitle>
                      <CardDescription>Selecciona productos activos y una unidad configurada por producto.</CardDescription>
                    </div>
                    <Button disabled={!canEdit} type="button" variant="outline" onClick={() => purchases.addDraftItem()}>
                      <Plus aria-hidden="true" />
                      Agregar item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="overflow-x-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-64">Producto</TableHead>
                          <TableHead className="min-w-40">Unidad</TableHead>
                          <TableHead className="min-w-28">Cantidad</TableHead>
                          <TableHead className="min-w-32">Costo unitario</TableHead>
                          <TableHead className="min-w-36">Lote</TableHead>
                          <TableHead className="min-w-40">Vencimiento</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="w-14 text-right">Quitar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchases.draftForm.items.map((item, index) => {
                          const product = getProductById(activeProducts, item.productId);
                          const configuredUnits = getConfiguredUnits(product);
                          const tracked = product?.isInventoryTracked ?? selectedPurchase?.items[index]?.isInventoryTracked ?? true;

                          return (
                            <TableRow key={`${index}-${item.productId}-${item.unitId}`}>
                              <TableCell className="align-top">
                                <Field>
                                  <FieldLabel className="sr-only">Producto</FieldLabel>
                                  <NativeSelect disabled={!canEdit} value={item.productId} onChange={(event) => updateProduct(index, event.target.value)}>
                                    <NativeSelectOption value="">Seleccionar producto</NativeSelectOption>
                                    {activeProducts.map((productOption) => (
                                      <NativeSelectOption key={productOption.id} value={productOption.id}>
                                        {productOption.commercialName}
                                      </NativeSelectOption>
                                    ))}
                                  </NativeSelect>
                                  {!canEdit && selectedPurchase?.items[index]?.productName ? (
                                    <FieldDescription>{selectedPurchase.items[index].productName}</FieldDescription>
                                  ) : null}
                                  <FieldError>{validation.itemErrors[index]}</FieldError>
                                </Field>
                              </TableCell>
                              <TableCell className="align-top">
                                <NativeSelect disabled={!canEdit || configuredUnits.length === 0} value={item.unitId} onChange={(event) => updateItem(index, "unitId", event.target.value)}>
                                  <NativeSelectOption value="">Unidad</NativeSelectOption>
                                  {configuredUnits.map((productUnit) => (
                                    <NativeSelectOption key={productUnit.unitId} value={productUnit.unitId}>
                                      {productUnit.unit.abbreviation}
                                    </NativeSelectOption>
                                  ))}
                                </NativeSelect>
                                {!canEdit && selectedPurchase?.items[index]?.unitName ? (
                                  <FieldDescription>{selectedPurchase.items[index].unitName}</FieldDescription>
                                ) : null}
                              </TableCell>
                              <TableCell className="align-top">
                                <Input
                                  disabled={!canEdit}
                                  min="0.0001"
                                  step="0.0001"
                                  type="number"
                                  value={item.quantity}
                                  onChange={(event) => updateItem(index, "quantity", Number(event.target.value))}
                                />
                              </TableCell>
                              <TableCell className="align-top">
                                <Input
                                  disabled={!canEdit}
                                  min="0"
                                  step="0.01"
                                  type="number"
                                  value={item.unitCost}
                                  onChange={(event) => updateItem(index, "unitCost", Number(event.target.value))}
                                />
                              </TableCell>
                              <TableCell className="align-top">
                                <Input
                                  disabled={!canEdit || !tracked}
                                  placeholder={tracked ? "LOT-001" : "No aplica"}
                                  value={tracked ? item.batchNumber : ""}
                                  onChange={(event) => updateItem(index, "batchNumber", event.target.value)}
                                />
                              </TableCell>
                              <TableCell className="align-top">
                                <Input
                                  disabled={!canEdit || !tracked}
                                  type="date"
                                  value={tracked ? item.expirationDate : ""}
                                  onChange={(event) => updateItem(index, "expirationDate", event.target.value)}
                                />
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-right align-top font-medium">{formatMoney(getLineTotal(item))}</TableCell>
                              <TableCell className="text-right align-top">
                                <Button
                                  aria-label="Quitar item"
                                  disabled={!canEdit || purchases.draftForm.items.length <= 1}
                                  size="icon"
                                  type="button"
                                  variant="ghost"
                                  onClick={() => purchases.removeDraftItem(index)}
                                >
                                  <Trash2 aria-hidden="true" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {productsCatalog.status === "loading" ? (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Spinner />
                      Actualizando catálogo de productos...
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
                <CardDescription>El total final se recalcula y confirma en backend al guardar.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Fecha</span>
                    <span className="font-medium">{formatDate(purchases.draftForm.purchaseDate)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Items</span>
                    <span className="font-medium">{purchases.draftForm.items.length}</span>
                  </div>
                  <div className="flex justify-between gap-4 border-t pt-3 text-base">
                    <span className="font-medium">Total visual</span>
                    <span className="font-semibold">{formatMoney(displayTotal)}</span>
                  </div>
                </div>
                <Alert>
                  <AlertTitle>{syncAlertTitle}</AlertTitle>
                  <AlertDescription>{syncAlertDescription}</AlertDescription>
                </Alert>
                {isDraft ? (
                  <Button disabled={!canSubmit || Boolean(validation.message)} type="button" onClick={saveForm}>
                    {isSaving ? <Spinner /> : <Save aria-hidden="true" />}
                    Guardar borrador
                  </Button>
                ) : null}
                {canOperateDraft ? (
                  <div className="grid gap-2">
                    <Button disabled={!canReceive} type="button" variant="outline" onClick={openReceiveDialog}>
                      {isReceiving ? <Spinner /> : <PackageCheck aria-hidden="true" />}
                      Recibir compra
                    </Button>
                    <Button disabled={!canCancel} type="button" variant="destructive" onClick={openCancelDialog}>
                      {isCancelling ? <Spinner /> : <Ban aria-hidden="true" />}
                      Anular compra
                    </Button>
                  </div>
                ) : null}
                {!isCreateMode && selectedPurchase ? (
                  <>
                    <Separator />
                    <div className="grid gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Proveedor</p>
                        <p className="font-medium">{selectedPurchase.supplier.businessName}</p>
                        <p className="text-xs text-muted-foreground">NIT: {formatOptionalText(selectedPurchase.supplier.nit)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Creada por</p>
                        <p className="font-medium">{selectedPurchase.createdByUser.fullName}</p>
                        <p className="text-xs text-muted-foreground">{selectedPurchase.createdByUser.email}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-muted-foreground">Creación</p>
                          <p className="font-medium">{formatDateTime(selectedPurchase.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Actualización</p>
                          <p className="font-medium">{formatDateTime(selectedPurchase.updatedAt)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Recepción</p>
                        <p className="font-medium">{formatDateTime(selectedPurchase.receivedAt)}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedPurchase.receivedByUser
                            ? `${selectedPurchase.receivedByUser.fullName} · ${selectedPurchase.receivedByUser.email}`
                            : "Sin usuario receptor"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Notas de recepción</p>
                        <p className="font-medium">{formatOptionalText(selectedPurchase.receiveNotes)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Anulación</p>
                        <p className="font-medium">{formatDateTime(selectedPurchase.cancelledAt)}</p>
                        <p className="text-xs text-muted-foreground">{formatOptionalText(selectedPurchase.cancelReason)}</p>
                      </div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </>
      )}
      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent>
          <form className="grid gap-4" onSubmit={receivePurchase}>
            <DialogHeader>
              <DialogTitle>Recibir compra</DialogTitle>
              <DialogDescription>Confirma que los items del borrador ingresarán al inventario con los datos guardados.</DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel>Notas de recepción</FieldLabel>
              <Textarea
                disabled={isReceiving}
                maxLength={240}
                placeholder="Opcional"
                value={receiveNotes}
                onChange={(event) => setReceiveNotes(event.target.value)}
              />
              <FieldDescription>Opcional, máximo 240 caracteres.</FieldDescription>
            </Field>
            <DialogFooter>
              <Button disabled={isReceiving} type="button" variant="outline" onClick={() => setReceiveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={!canReceive} type="submit">
                {isReceiving ? <Spinner /> : <PackageCheck aria-hidden="true" />}
                Confirmar recepción
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <form className="grid gap-4" onSubmit={cancelPurchase}>
            <DialogHeader>
              <DialogTitle>Anular compra</DialogTitle>
              <DialogDescription>
                La compra quedará como historial de solo lectura. Si hay cambios pendientes, no se guardarán antes de anular.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel>Motivo de anulación</FieldLabel>
              <Textarea
                required
                aria-invalid={Boolean(cancelReasonError)}
                disabled={isCancelling}
                maxLength={240}
                minLength={3}
                value={cancelReason}
                onChange={(event) => {
                  setCancelReason(event.target.value);
                  setCancelReasonError(null);
                }}
              />
              <FieldDescription>Entre 3 y 240 caracteres.</FieldDescription>
              <FieldError>{cancelReasonError}</FieldError>
            </Field>
            <DialogFooter>
              <Button disabled={isCancelling} type="button" variant="outline" onClick={() => setCancelDialogOpen(false)}>
                Cancelar
              </Button>
              <Button disabled={!canCancel} type="submit" variant="destructive">
                {isCancelling ? <Spinner /> : <Ban aria-hidden="true" />}
                Confirmar anulación
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
