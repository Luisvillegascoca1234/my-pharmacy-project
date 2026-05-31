import { type FormEvent, useMemo, useState } from "react";
import { AlertCircle, ClipboardList, PackageSearch, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useInventoryAdjustment, useInventoryBatches, useInventoryStock } from "@/modules/inventory";

const quantityFormatter = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 4 });

export function AdjustmentsPage() {
  const stock = useInventoryStock();
  const adjustment = useInventoryAdjustment();
  const [selectedProductId, setSelectedProductId] = useState("");
  const batches = useInventoryBatches(selectedProductId || null);
  const [batchId, setBatchId] = useState("");
  const [countedQuantity, setCountedQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
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
  const selectedBatch = batches.items.find((batch) => batch.id === batchId) ?? null;
  const countedValue = Number(countedQuantity);
  const difference = selectedBatch && Number.isFinite(countedValue) ? countedValue - selectedBatch.availableQuantity : 0;
  const isSaving = adjustment.status === "loading";

  async function saveAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);

    if (!batchId) {
      setLocalError("Selecciona una capa de inventario.");
      return;
    }

    if (!Number.isFinite(countedValue) || countedValue < 0) {
      setLocalError("El stock contado debe ser un número mayor o igual a cero.");
      return;
    }

    if (reason.trim().length < 3) {
      setLocalError("El motivo debe tener al menos 3 caracteres.");
      return;
    }

    const result = await adjustment.saveAdjustment({
      batchId,
      countedQuantity: countedValue,
      reason
    });

    if (result) {
      setCountedQuantity("");
      setReason("");
      setBatchId("");
      await stock.reload();
      await batches.reload();
    }
  }

  return (
    <section className="grid gap-5">
      <div className="space-y-2">
        <Badge className="w-fit" variant="secondary">
          Corrección controlada
        </Badge>
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Ajustes manuales</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Ajusta una capa existente escribiendo el stock final contado. El sistema calcula la diferencia y registra auditoría.
          </p>
        </div>
      </div>

      {!adjustment.canAdjust ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Permiso insuficiente</AlertTitle>
          <AlertDescription>Solo administración y superadministración pueden ajustar inventario.</AlertDescription>
        </Alert>
      ) : null}

      {localError || adjustment.error || stock.error || batches.error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>No se pudo registrar el ajuste</AlertTitle>
          <AlertDescription>{localError ?? adjustment.error ?? batches.error ?? stock.error}</AlertDescription>
        </Alert>
      ) : null}

      {adjustment.adjustment && adjustment.status === "success" ? (
        <Alert>
          <ClipboardList aria-hidden="true" />
          <AlertTitle>Ajuste registrado</AlertTitle>
          <AlertDescription>
            Diferencia aplicada: {quantityFormatter.format(adjustment.adjustment.differenceQuantity)} unidades base.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Registro de conteo</CardTitle>
            <CardDescription>El ajuste no crea stock nuevo; solo corrige lotes existentes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={saveAdjustment}>
              <Field>
                <FieldLabel>Producto</FieldLabel>
                <NativeSelect
                  disabled={!adjustment.canAdjust || stock.status === "loading"}
                  value={selectedProductId}
                  onChange={(event) => {
                    setSelectedProductId(event.target.value);
                    setBatchId("");
                    setCountedQuantity("");
                  }}
                >
                  <NativeSelectOption value="">Seleccionar producto</NativeSelectOption>
                  {products.map((product) => (
                    <NativeSelectOption key={product.id} value={product.id}>
                      {product.commercialName}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>

              <Field>
                <FieldLabel>Capa/lote</FieldLabel>
                <NativeSelect
                  disabled={!adjustment.canAdjust || !selectedProductId || batches.status === "loading"}
                  value={batchId}
                  onChange={(event) => {
                    setBatchId(event.target.value);
                    setCountedQuantity("");
                  }}
                >
                  <NativeSelectOption value="">Seleccionar capa</NativeSelectOption>
                  {batches.items
                    .filter((batch) => batch.status !== "cancelled")
                    .map((batch) => (
                      <NativeSelectOption key={batch.id} value={batch.id}>
                        {batch.batchNumber ?? "Sin lote"} · {formatDate(batch.expirationDate)} · {quantityFormatter.format(batch.availableQuantity)}{" "}
                        {batch.product.baseUnit.abbreviation}
                      </NativeSelectOption>
                    ))}
                </NativeSelect>
                <FieldDescription>La capa mantiene costo, compra y trazabilidad separados.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel>Stock final contado</FieldLabel>
                <Input
                  disabled={!adjustment.canAdjust || !selectedBatch}
                  min="0"
                  step="0.0001"
                  type="number"
                  value={countedQuantity}
                  onChange={(event) => setCountedQuantity(event.target.value)}
                />
                {selectedBatch ? (
                  <FieldDescription>
                    Disponible actual: {quantityFormatter.format(selectedBatch.availableQuantity)} {selectedBatch.product.baseUnit.abbreviation}
                  </FieldDescription>
                ) : null}
              </Field>

              <Field>
                <FieldLabel>Motivo</FieldLabel>
                <Textarea
                  disabled={!adjustment.canAdjust || !selectedBatch}
                  maxLength={240}
                  minLength={3}
                  placeholder="Ej. conteo físico de estantería"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <FieldDescription>Obligatorio, queda registrado en movimiento y auditoría.</FieldDescription>
                <FieldError>{localError}</FieldError>
              </Field>

              <Button disabled={!adjustment.canAdjust || !selectedBatch || isSaving} type="submit">
                {isSaving ? <Spinner /> : <Save aria-hidden="true" />}
                Registrar ajuste
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Vista previa</CardTitle>
            <CardDescription>Diferencia que se convertirá en movimiento de inventario.</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedBatch ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PackageSearch aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>Selecciona una capa</EmptyTitle>
                  <EmptyDescription>El ajuste se calcula contra el saldo disponible actual.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="grid gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Producto</p>
                  <p className="font-medium">{selectedBatch.product.commercialName}</p>
                  <p className="text-xs text-muted-foreground">{selectedBatch.product.internalCode}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Actual</p>
                    <p className="text-lg font-semibold">{quantityFormatter.format(selectedBatch.availableQuantity)}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-muted-foreground">Diferencia</p>
                    <p className={difference < 0 ? "text-lg font-semibold text-destructive" : "text-lg font-semibold text-foreground"}>
                      {Number.isFinite(difference) ? quantityFormatter.format(difference) : "0"}
                    </p>
                  </div>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="font-medium">{selectedBatch.batchNumber ?? "Sin lote"}</p>
                  <p className="text-muted-foreground">Vence: {formatDate(selectedBatch.expirationDate)}</p>
                  <p className="text-muted-foreground">Proveedor: {selectedBatch.supplierName ?? "No registrado"}</p>
                </div>
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
