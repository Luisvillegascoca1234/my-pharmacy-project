import { NavLink, useLocation } from "react-router-dom";

export type ContextNavigationItem = {
  label: string;
  path: string;
};

export const pointOfSaleNavigation: ContextNavigationItem[] = [
  { label: "Nueva venta", path: "/pos" },
  { label: "Ventas guardadas", path: "/pending-carts" }
];

export const salesNavigation: ContextNavigationItem[] = [
  { label: "Historial", path: "/sales-cancellations" },
  { label: "Comprobantes", path: "/invoices" },
  { label: "Devoluciones", path: "/returns" }
];

export const productsNavigation: ContextNavigationItem[] = [
  { label: "Productos", path: "/products" },
  { label: "Unidades y categorías", path: "/units" }
];

export const inventoryNavigation: ContextNavigationItem[] = [
  { label: "Existencias", path: "/batches" },
  { label: "Historial", path: "/movements" },
  { label: "Corregir stock", path: "/adjustments" }
];

export const purchasingNavigation: ContextNavigationItem[] = [
  { label: "Qué comprar", path: "/stock-planning" },
  { label: "Compras", path: "/purchases" },
  { label: "Proveedores", path: "/suppliers" }
];

export const reportsNavigation: ContextNavigationItem[] = [
  { label: "Reportes", path: "/reports" },
  { label: "Exportar datos", path: "/exports" }
];

export const administrationNavigation: ContextNavigationItem[] = [
  { label: "Usuarios", path: "/users" },
  { label: "Roles y permisos", path: "/roles" },
  { label: "Auditoría", path: "/audit" }
];

export function ContextNavigation({
  ariaLabel,
  items
}: {
  ariaLabel: string;
  items: ContextNavigationItem[];
}) {
  const location = useLocation();

  return (
    <nav aria-label={ariaLabel} className="overflow-x-auto rounded-xl border bg-muted/25 p-1.5">
      <div className="flex min-w-max items-center gap-1">
        {items.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/pos" && location.pathname.startsWith(`${item.path}/`));

          return (
            <NavLink
              aria-current={isActive ? "page" : undefined}
              className={({ isPending }) =>
                [
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                  isPending ? "opacity-60" : ""
                ].join(" ")
              }
              key={item.path}
              to={item.path}
            >
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
