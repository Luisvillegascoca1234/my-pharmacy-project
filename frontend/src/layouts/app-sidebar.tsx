import type { AuthenticatedUser } from "@pharmacy-pos/shared";
import { ChevronDown, Cross, LogOut, PillBottle } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar
} from "@/components/ui/sidebar";
import { getVisibleNavigationGroups } from "@/routes/navigation";

type AppSidebarProps = {
  user: AuthenticatedUser;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, setOpenMobile } = useSidebar();
  const groups = getVisibleNavigationGroups(user.role.name);

  const closeMobileNavigation = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border px-3 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-12 hover:bg-transparent active:bg-transparent" size="lg" tooltip="Farmacia POS">
              <span className="relative flex size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <PillBottle aria-hidden="true" className="size-[1.125rem]" />
                <Cross aria-hidden="true" className="absolute -right-1 -top-1 size-3 rounded-sm bg-card p-0.5 text-primary shadow-xs" />
              </span>
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate text-[0.9375rem] font-semibold tracking-[-0.015em]">Farmacia POS</span>
                <span className="truncate text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-sidebar-foreground/55">Ventas e inventario</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {groups.map((group) => {
          const isGroupActive = group.items.some(
            (item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
          );

          return (
          <Collapsible
            key={`${group.label}-${isGroupActive}`}
            defaultOpen={group.label === "Inicio" || isGroupActive}
            className="group/collapsible"
          >
            <SidebarGroup className="py-1">
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="mb-1 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/50 hover:text-sidebar-foreground">
                  {group.label}
                  <ChevronDown
                    aria-hidden="true"
                    className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                  />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        location.pathname === item.path ||
                        (item.path !== "/dashboard" && location.pathname.startsWith(`${item.path}/`));

                      return (
                        <SidebarMenuItem key={item.key}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.label}
                            className="relative h-9 rounded-lg text-[0.8125rem] font-medium data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-xs"
                          >
                            <NavLink to={item.path} onClick={closeMobileNavigation}>
                              {isActive ? <span aria-hidden="true" className="absolute -left-2 h-5 w-0.5 rounded-full bg-sidebar-primary" /> : null}
                              <Icon aria-hidden="true" className="size-[1.0625rem]" />
                              <span>{item.label}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-12 rounded-xl border border-sidebar-border bg-sidebar-accent/35" size="lg" tooltip={user.fullName}>
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">{getInitials(user.fullName)}</AvatarFallback>
                  </Avatar>
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium">{user.fullName}</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">{user.role.displayName}</span>
                  </span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" side="right">
                <DropdownMenuLabel>
                  <span className="block truncate text-foreground">{user.email}</span>
                  <span className="block truncate">{user.role.displayName}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate("/logout", { replace: true })} variant="destructive">
                  <LogOut aria-hidden="true" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
