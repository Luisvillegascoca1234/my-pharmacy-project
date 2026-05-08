import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ModulePageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const nextSteps = ["Conectar datos del módulo", "Definir filtros principales", "Agregar acciones permitidas por rol"];

export function ModulePage({ title, description, icon: Icon }: ModulePageProps) {
  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl space-y-3">
          <Badge variant="secondary">Módulo inicial</Badge>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">{title}</h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
          </div>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-md border bg-card text-muted-foreground">
          <Icon aria-hidden="true" className="size-5" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Área de trabajo</CardTitle>
            <CardDescription>Esta pantalla queda lista para recibir tablas, formularios y acciones del módulo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid min-h-72 place-items-center rounded-md border border-dashed bg-muted/30 px-6 text-center">
              <div className="max-w-md space-y-2">
                <p className="text-sm font-medium text-foreground">Contenido operativo pendiente</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  La navegación ya está separada por módulos para implementar este flujo sin mezclar responsabilidades en
                  el layout.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos pasos</CardTitle>
            <CardDescription>Guía breve para completar el módulo.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {nextSteps.map((step) => (
                <li key={step} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
