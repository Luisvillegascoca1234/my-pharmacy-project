import type { ReactNode } from "react";
import type { AuthenticatedUser } from "@pharmacy-pos/shared";
import { Bell, PillBottle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserMenu } from "@/modules/auth";

type AppShellProps = {
  children: ReactNode;
  user: AuthenticatedUser;
  onLogout: () => void;
};

export function AppShell({ children, user, onLogout }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Button aria-label="Inicio del punto de venta" size="icon-lg">
            <PillBottle aria-hidden="true" size={22} />
          </Button>
          <div>
            <p className="text-sm font-medium text-muted">Punto de venta</p>
            <h1 className="text-lg font-semibold text-foreground">Consola de desarrollo</h1>
          </div>
          <Badge className="ml-2 hidden sm:inline-flex" variant="outline">
            shadcn/ui
          </Badge>
          <Separator className="ml-auto hidden h-6 sm:block" orientation="vertical" />
          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label="Buscar en el espacio de trabajo" size="icon" variant="outline">
                  <Search aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Buscar en el espacio de trabajo</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label="Notificaciones" size="icon" variant="outline">
                  <Bell aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notificaciones</TooltipContent>
            </Tooltip>
            <UserMenu user={user} onLogout={onLogout} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
