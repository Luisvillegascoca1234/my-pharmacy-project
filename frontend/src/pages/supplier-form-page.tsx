import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, Building2, CheckCircle2, Loader2, RotateCcw, Save, ShieldAlert } from "lucide-react";
import { z } from "zod";
import { CreateSupplierSchema, resetSuppliersStore, useSuppliers, type SupplierDraftForm, type SupplierStatus } from "@/modules/suppliers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type SupplierFormMode = "create" | "detail";

type SupplierFormPageProps = {
  mode: SupplierFormMode;
};

type FieldErrors = Partial<Record<keyof SupplierDraftForm, string>>;

const supplierStatusLabels: Record<SupplierStatus, string> = {
  active: "Activo",
  inactive: "Inactivo"
};

const supplierStatusDescriptions: Record<SupplierStatus, string> = {
  active: "Disponible para nuevas compras y recepciones.",
  inactive: "Conserva el historial, pero no queda disponible para nuevas operaciones."
};

export function SupplierFormPage({ mode }: SupplierFormPageProps) {
  const navigate = useNavigate();
  const params = useParams();
  const supplierId = params.id;
  const suppliers = useSuppliers({ autoLoadList: false });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<SupplierStatus | null>(null);

  const isCreateMode = mode === "create";
  const isSaving = suppliers.saveStatus === "loading";
  const isLoadingDetail = !isCreateMode && suppliers.detailStatus === "loading";
  const isNotFound = !isCreateMode && suppliers.detailStatus === "error" && suppliers.errorStatusCode === 404;
  const canSubmit = suppliers.canManage && !isSaving && !isLoadingDetail;
  const nextStatus: SupplierStatus = suppliers.draftForm.status === "active" ? "inactive" : "active";

  const title = isCreateMode ? "Nuevo proveedor" : "Detalle de proveedor";
  const description = isCreateMode
    ? "Registra los datos comerciales mínimos del proveedor. El NIT puede quedar vacío."
    : "Edita la ficha comercial y controla el estado operativo sin borrar historial.";

  const statusActionCopy = useMemo(() => {
    if (isCreateMode) {
      return suppliers.draftForm.status === "active" ? "Crear como inactivo" : "Crear como activo";
    }

    return suppliers.draftForm.status === "active" ? "Desactivar proveedor" : "Activar proveedor";
  }, [isCreateMode, suppliers.draftForm.status]);

  useEffect(() => {
    if (isCreateMode) {
      suppliers.resetDraftForm();
      return () => resetSuppliersStore();
    }

    if (!supplierId) {
      return () => resetSuppliersStore();
    }

    const controller = new AbortController();

    void suppliers.loadSupplier(supplierId, controller.signal);

    return () => {
      controller.abort();
      resetSuppliersStore();
    };
  }, [isCreateMode, supplierId]);

  function setField<Field extends keyof SupplierDraftForm>(field: Field, value: SupplierDraftForm[Field]) {
    setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    setFormNotice(null);
    suppliers.setDraftField(field, value);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveForm();
  }

  async function saveForm(nextDraftForm = suppliers.draftForm) {
    setFormNotice(null);

    const validation = CreateSupplierSchema.safeParse(nextDraftForm);

    if (!validation.success) {
      setFieldErrors(getFieldErrors(validation.error));
      return null;
    }

    setFieldErrors({});

    const supplier = await suppliers.saveDraftForm(isCreateMode ? undefined : supplierId);

    if (!supplier) {
      return null;
    }

    if (isCreateMode) {
      navigate(`/suppliers/${supplier.id}`, { replace: true });
      return supplier;
    }

    setFormNotice("Cambios guardados.");
    return supplier;
  }

  async function handleStatusChange() {
    if (!pendingStatus) {
      return;
    }

    const nextDraftForm = {
      ...suppliers.draftForm,
      status: pendingStatus
    };

    suppliers.setDraftForm(nextDraftForm);
    setStatusDialogOpen(false);

    if (!isCreateMode) {
      await saveForm(nextDraftForm);
    }
  }

  function openStatusDialog() {
    setPendingStatus(nextStatus);
    setStatusDialogOpen(true);
  }

  function resetForm() {
    if (suppliers.selectedSupplier) {
      suppliers.setSelectedSupplier(suppliers.selectedSupplier);
    } else {
      suppliers.resetDraftForm();
    }

    setFieldErrors({});
    setFormNotice(null);
    setResetDialogOpen(false);
  }

  if (!isCreateMode && !supplierId) {
    return <Navigate replace to="/suppliers" />;
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Proveedores
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">{title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/suppliers">
            <ArrowLeft aria-hidden="true" />
            Volver
          </Link>
        </Button>
      </div>

      {!suppliers.canManage ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <ShieldAlert aria-hidden="true" className="size-4" />
          Tu rol permite solo consulta de proveedores.
        </div>
      ) : null}

      {suppliers.error && !isNotFound ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle aria-hidden="true" className="size-4" />
          {suppliers.error}
        </div>
      ) : null}

      {isLoadingDetail ? (
        <Card>
          <CardContent className="flex min-h-72 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            Cargando proveedor...
          </CardContent>
        </Card>
      ) : isNotFound ? (
        <Card>
          <CardContent className="min-h-72">
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Building2 aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>Proveedor no encontrado</EmptyTitle>
                <EmptyDescription>El proveedor solicitado no existe o ya no está disponible para tu sesión.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card>
            <CardHeader>
              <CardTitle>Datos comerciales</CardTitle>
              <CardDescription>
                {suppliers.isDirty ? "Hay cambios pendientes por guardar." : "La ficha está sincronizada con el servidor."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={handleSubmit}>
                <Field>
                  <FieldLabel>Razón social</FieldLabel>
                  <Input
                    required
                    aria-invalid={Boolean(fieldErrors.businessName)}
                    disabled={!suppliers.canManage || isSaving}
                    maxLength={160}
                    value={suppliers.draftForm.businessName}
                    onChange={(event) => setField("businessName", event.target.value)}
                  />
                  <FieldDescription>Entre 2 y 160 caracteres.</FieldDescription>
                  <FieldError>{fieldErrors.businessName}</FieldError>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>NIT</FieldLabel>
                    <Input
                      aria-invalid={Boolean(fieldErrors.nit)}
                      disabled={!suppliers.canManage || isSaving}
                      maxLength={40}
                      placeholder="Opcional"
                      value={suppliers.draftForm.nit}
                      onChange={(event) => setField("nit", event.target.value)}
                    />
                    <FieldError>{fieldErrors.nit}</FieldError>
                  </Field>
                  <Field>
                    <FieldLabel>Teléfono</FieldLabel>
                    <Input
                      aria-invalid={Boolean(fieldErrors.phone)}
                      disabled={!suppliers.canManage || isSaving}
                      maxLength={40}
                      value={suppliers.draftForm.phone}
                      onChange={(event) => setField("phone", event.target.value)}
                    />
                    <FieldError>{fieldErrors.phone}</FieldError>
                  </Field>
                </div>

                <Field>
                  <FieldLabel>Contacto</FieldLabel>
                  <Input
                    aria-invalid={Boolean(fieldErrors.contactName)}
                    disabled={!suppliers.canManage || isSaving}
                    maxLength={120}
                    value={suppliers.draftForm.contactName}
                    onChange={(event) => setField("contactName", event.target.value)}
                  />
                  <FieldError>{fieldErrors.contactName}</FieldError>
                </Field>

                <Field>
                  <FieldLabel>Dirección</FieldLabel>
                  <Textarea
                    aria-invalid={Boolean(fieldErrors.address)}
                    disabled={!suppliers.canManage || isSaving}
                    maxLength={240}
                    value={suppliers.draftForm.address}
                    onChange={(event) => setField("address", event.target.value)}
                  />
                  <FieldDescription>Máximo 240 caracteres.</FieldDescription>
                  <FieldError>{fieldErrors.address}</FieldError>
                </Field>

                {formNotice ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 aria-hidden="true" className="size-4 text-primary" />
                    {formNotice}
                  </p>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button disabled={!canSubmit} type="submit">
                    {isSaving ? <Loader2 aria-hidden="true" className="animate-spin" /> : <Save aria-hidden="true" />}
                    Guardar
                  </Button>
                  <Button
                    disabled={!suppliers.isDirty || isSaving}
                    type="button"
                    variant="outline"
                    onClick={() => (suppliers.isDirty ? setResetDialogOpen(true) : resetForm())}
                  >
                    <RotateCcw aria-hidden="true" />
                    Descartar cambios
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Estado operativo</CardTitle>
              <CardDescription>{supplierStatusDescriptions[suppliers.draftForm.status]}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Estado actual</p>
                  <p className="text-xs text-muted-foreground">No elimina compras ni historial asociado.</p>
                </div>
                <Badge variant={suppliers.draftForm.status === "active" ? "default" : "secondary"}>
                  {supplierStatusLabels[suppliers.draftForm.status]}
                </Badge>
              </div>
              <Separator />
              <Button disabled={!suppliers.canManage || isSaving} type="button" variant="outline" onClick={openStatusDialog}>
                {statusActionCopy}
              </Button>
              {suppliers.isDirty ? <p className="text-sm text-muted-foreground">Cambios pendientes.</p> : null}
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <RotateCcw aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Descartar cambios</AlertDialogTitle>
            <AlertDialogDescription>Los datos modificados en el formulario volverán al último estado guardado.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={resetForm}>
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <ShieldAlert aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>{pendingStatus === "inactive" ? "Desactivar proveedor" : "Activar proveedor"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isCreateMode
                ? "El proveedor se guardará con este estado cuando confirmes el formulario."
                : suppliers.isDirty
                  ? "Se guardarán los cambios pendientes junto con el nuevo estado. El historial se conservará."
                  : "Solo se actualizará el estado operativo. El historial se conservará."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant={pendingStatus === "inactive" ? "destructive" : "default"} onClick={() => void handleStatusChange()}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function getFieldErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === "string" && field in fieldLabels) {
      errors[field as keyof SupplierDraftForm] = getFieldErrorMessage(field as keyof SupplierDraftForm, issue);
    }
  }

  return errors;
}

const fieldLabels: Record<keyof SupplierDraftForm, string> = {
  address: "La dirección",
  businessName: "La razón social",
  contactName: "El contacto",
  nit: "El NIT",
  phone: "El teléfono",
  status: "El estado"
};

function getFieldErrorMessage(field: keyof SupplierDraftForm, issue: z.ZodIssue) {
  if (issue.code === z.ZodIssueCode.too_small) {
    return `${fieldLabels[field]} debe tener al menos ${issue.minimum} caracteres.`;
  }

  if (issue.code === z.ZodIssueCode.too_big) {
    return `${fieldLabels[field]} debe tener como máximo ${issue.maximum} caracteres.`;
  }

  return `${fieldLabels[field]} no tiene un formato válido.`;
}
