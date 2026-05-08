import { FormEvent, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Boxes, FolderPlus, Ruler, Save, ShieldAlert } from "lucide-react";
import type { CreateProductCategory, CreateUnit } from "@pharmacy-pos/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUnitsCatalog } from "../hooks/use-units-catalog";

const emptyUnitForm: CreateUnit = {
  name: "",
  abbreviation: "",
  description: undefined
};

const emptyCategoryForm: CreateProductCategory = {
  name: "",
  description: undefined
};

export function UnitsCatalogPage() {
  const catalog = useUnitsCatalog();
  const [unitForm, setUnitForm] = useState<CreateUnit>(emptyUnitForm);
  const [categoryForm, setCategoryForm] = useState<CreateProductCategory>(emptyCategoryForm);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleUnitSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    try {
      await catalog.saveUnit(unitForm);
      setUnitForm(emptyUnitForm);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo guardar la unidad.");
    }
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    try {
      await catalog.saveCategory(categoryForm);
      setCategoryForm(emptyCategoryForm);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo guardar la categoría.");
    }
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <Badge className="w-fit" variant="secondary">
            Catálogos base
          </Badge>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Unidades y categorías</h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Define las presentaciones mínimas que sostienen productos, compras y conversiones de inventario.
            </p>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:w-80">
          <Metric icon={Ruler} label="Unidades" value={catalog.units.length} />
          <Metric icon={Boxes} label="Categorías" value={catalog.categories.length} />
        </div>
      </div>

      {catalog.error || submitError ? (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <ShieldAlert aria-hidden="true" className="size-4" />
          {submitError ?? catalog.error}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Unidades de medida</CardTitle>
            <CardDescription>Unidad, blister, caja, frasco u otra presentación controlada.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Abreviatura</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalog.units.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.name}</TableCell>
                    <TableCell className="font-mono text-xs">{unit.abbreviation}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{unit.status === "active" ? "Activo" : "Inactivo"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {catalog.units.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-24 text-center text-muted-foreground" colSpan={3}>
                      {catalog.status === "loading" ? "Cargando unidades..." : "Todavía no hay unidades."}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>

            <form className="grid gap-3 rounded-md border bg-muted/20 p-3" onSubmit={handleUnitSubmit}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Ruler aria-hidden="true" className="size-4 text-muted-foreground" />
                Nueva unidad
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                <Field>
                  <FieldLabel>Nombre</FieldLabel>
                  <Input
                    required
                    disabled={!catalog.canManage}
                    value={unitForm.name}
                    onChange={(event) => setUnitForm({ ...unitForm, name: event.target.value })}
                  />
                </Field>
                <Field>
                  <FieldLabel>Abreviatura</FieldLabel>
                  <Input
                    required
                    disabled={!catalog.canManage}
                    value={unitForm.abbreviation}
                    onChange={(event) => setUnitForm({ ...unitForm, abbreviation: event.target.value })}
                  />
                </Field>
              </div>
              <Button className="w-fit" disabled={!catalog.canManage} type="submit">
                <Save aria-hidden="true" />
                Guardar unidad
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorías de producto</CardTitle>
            <CardDescription>Agrupa medicamentos, insumos y productos relacionados con farmacia.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catalog.categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">{category.description ?? "Sin descripción"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{category.status === "active" ? "Activo" : "Inactivo"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {catalog.categories.length === 0 ? (
                  <TableRow>
                    <TableCell className="h-24 text-center text-muted-foreground" colSpan={3}>
                      {catalog.status === "loading" ? "Cargando categorías..." : "Todavía no hay categorías."}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>

            <form className="grid gap-3 rounded-md border bg-muted/20 p-3" onSubmit={handleCategorySubmit}>
              <div className="flex items-center gap-2 text-sm font-medium">
                <FolderPlus aria-hidden="true" className="size-4 text-muted-foreground" />
                Nueva categoría
              </div>
              <Field>
                <FieldLabel>Nombre</FieldLabel>
                <Input
                  required
                  disabled={!catalog.canManage}
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel>Descripción</FieldLabel>
                <Input
                  disabled={!catalog.canManage}
                  value={categoryForm.description ?? ""}
                  onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value || undefined })}
                />
              </Field>
              <Button className="w-fit" disabled={!catalog.canManage} type="submit">
                <Save aria-hidden="true" />
                Guardar categoría
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon aria-hidden="true" className="size-3.5" />
        {label}
      </div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
