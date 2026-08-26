import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Clock3, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ModulePageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function ModulePage({ title, description, icon: Icon }: ModulePageProps) {
  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl space-y-3">
          <Badge variant="secondary">Próxima capacidad</Badge>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">{title}</h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
          </div>
        </div>
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Capacidad en preparación</CardTitle>
            <CardDescription>Esta pantalla todavía no está disponible.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid min-h-72 place-items-center rounded-xl border border-dashed bg-muted/25 px-6 text-center">
              <div className="max-w-md space-y-2">
                <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Clock3 aria-hidden="true" className="size-5" /></span>
                <p className="pt-2 text-sm font-semibold text-foreground">Disponible próximamente</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Mientras se habilita esta capacidad, utiliza los módulos operativos disponibles en la navegación principal.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acceso controlado</CardTitle>
            <CardDescription>La pantalla se mostrará únicamente a quienes tengan permiso.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 rounded-lg border border-info/20 bg-info/6 p-3 text-sm text-muted-foreground"><ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-info" /><p>Cuando esté disponible, solo podrán entrar las personas autorizadas.</p></div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
