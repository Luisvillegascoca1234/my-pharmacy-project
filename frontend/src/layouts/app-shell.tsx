import { useMemo, useState, type ReactNode } from "react";
import type { AuthenticatedUser } from "@pharmacy-pos/shared";
import { Bell, LogOut, Search, UserCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeSelector } from "@/components/theme-selector";
import { getVisibleNavigationGroups } from "@/routes/navigation";
import { getRouteTitle } from "@/routes/app-routes";
import { AppSidebar } from "./app-sidebar";

type AppShellProps = {
  children: ReactNode;
  user: AuthenticatedUser;
};

export function AppShell({ children, user }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const title = getRouteTitle(location.pathname);
  const visibleGroups = useMemo(() => getVisibleNavigationGroups(user.role.name), [user.role.name]);

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
                <Button aria-label="Buscar en el sistema" size="icon" variant="outline" onClick={() => setSearchOpen(true)}>
                  <Search aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Buscar en el sistema</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label="Alertas operativas" size="icon" variant="outline" onClick={() => navigate("/alerts")}>
                  <Bell aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Alertas operativas</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="Menú de usuario" className="hidden max-w-56 gap-2 sm:inline-flex" variant="outline">
                  <UserCircle aria-hidden="true" />
                  <span className="truncate">{user.fullName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <span className="block truncate text-foreground">{user.fullName}</span>
                  <span className="block truncate font-normal">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>{user.role.displayName}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate("/logout")}>
                  <LogOut aria-hidden="true" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="w-full px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        <CommandDialog open={searchOpen} title="Buscar en el sistema" description="Busca un módulo operativo." onOpenChange={setSearchOpen}>
          <Command>
            <CommandInput placeholder="Buscar módulo..." />
            <CommandList>
              <CommandEmpty>No hay módulos disponibles.</CommandEmpty>
              {visibleGroups.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                  {group.items.map((item) => (
                    <CommandItem
                      key={item.key}
                      value={`${item.label} ${group.label}`}
                      onSelect={() => {
                        setSearchOpen(false);
                        navigate(item.path);
                      }}
                    >
                      <item.icon aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="truncate">{item.label}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </CommandDialog>
      </SidebarInset>
    </SidebarProvider>
  );
}
