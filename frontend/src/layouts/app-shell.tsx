import type { ReactNode } from "react";
import type { AuthenticatedUser } from "@pharmacy-pos/shared";
import { Bell, Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeSelector } from "@/components/theme-selector";
import { getRouteTitle } from "@/routes/app-routes";
import { AppSidebar } from "./app-sidebar";

type AppShellProps = {
  children: ReactNode;
  user: AuthenticatedUser;
};

export function AppShell({ children, user }: AppShellProps) {
  const location = useLocation();
  const title = getRouteTitle(location.pathname);

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <SidebarTrigger aria-label="Alternar navegación" />
          <Separator className="h-6" orientation="vertical" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">Consola operativa</p>
            <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{title}</h1>
          </div>
          <Badge className="ml-1 hidden lg:inline-flex" variant="outline">
            {user.role.displayName}
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <ThemeSelector />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label="Buscar en el sistema" size="icon" variant="outline">
                  <Search aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Buscar en el sistema</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label="Alertas operativas" size="icon" variant="outline">
                  <Bell aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Alertas operativas</TooltipContent>
            </Tooltip>
          </div>
        </header>
        <main className="w-full px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
