import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthenticatedUser } from "@pharmacy-pos/shared";
import { Bell, LogOut, Search, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { getVisibleNavigationSearchGroups } from "@/routes/navigation";
import { AppSidebar } from "./app-sidebar";

type AppShellProps = {
  children: ReactNode;
  user: AuthenticatedUser;
};

export function AppShell({ children, user }: AppShellProps) {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const visibleGroups = useMemo(() => getVisibleNavigationSearchGroups(user.role.name), [user.role.name]);

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-[4.5rem] shrink-0 items-center gap-3 border-b bg-background/88 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <SidebarTrigger aria-label="Alternar navegación" className="rounded-lg border bg-card shadow-xs" />
          <Separator className="mx-1 h-7" orientation="vertical" />
          <div className="ml-auto flex items-center gap-2">
            <Button
              className="hidden h-9 min-w-56 justify-start gap-2 border bg-card px-3 font-normal text-muted-foreground shadow-xs lg:inline-flex"
              type="button"
              variant="outline"
              onClick={() => setSearchOpen(true)}
            >
              <Search aria-hidden="true" className="size-4" />
              <span>Buscar pantalla o tarea</span>
              <kbd className="ml-auto rounded border bg-muted px-1.5 py-0.5 text-[0.625rem] font-semibold">Ctrl K</kbd>
            </Button>
            <ThemeSelector />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label="Buscar en el sistema" className="bg-card shadow-xs lg:hidden" size="icon" variant="outline" onClick={() => setSearchOpen(true)}>
                  <Search aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Buscar en el sistema</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button aria-label="Alertas" className="relative bg-card shadow-xs" size="icon" variant="outline" onClick={() => navigate("/alerts")}>
                  <Bell aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Alertas</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-label="Menú de usuario" className="hidden max-w-56 gap-2 bg-card shadow-xs sm:inline-flex" variant="outline">
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
        <main className="w-full px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</main>
        <CommandDialog open={searchOpen} title="Buscar en el sistema" description="Busca una pantalla o tarea." onOpenChange={setSearchOpen}>
          <Command>
            <CommandInput placeholder="Buscar pantalla o tarea..." />
            <CommandList>
              <CommandEmpty>No se encontraron resultados.</CommandEmpty>
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
