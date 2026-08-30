import { isFeatureAllowed, type FeatureKey } from "@pharmacy-pos/shared";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardList,
  FileBarChart,
  FileText,
  History,
  Home,
  Package,
  PackageCheck,
  PackageSearch,
  ReceiptText,
  RefreshCcw,
  RotateCcw,
  Ruler,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  Users,
  WalletCards,
  type LucideIcon
} from "lucide-react";

export type AppRouteKey = FeatureKey;

export type AppNavigationItem = {
  key: AppRouteKey;
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
  placement?: "contextual" | "primary";
};

export type AppNavigationGroup = {
  label: string;
  items: AppNavigationItem[];
};

export const SALES_CANCELLATIONS_PATH = "/sales-cancellations";
export const PREPARED_INTERNAL_DOCUMENTS_PATH = "/invoices";
export const ADMINISTRATIVE_RETURNS_PATH = "/returns";
export const REPORTS_PATH = "/reports";
export const STOCK_PLANNING_PATH = "/stock-planning";
export const EXPORTS_PATH = "/exports";
export const AUDIT_PATH = "/audit";

export const navigationGroups: AppNavigationGroup[] = [
  {
    label: "Inicio",
    items: [
      {
        key: "dashboard",
        label: "Inicio",
        path: "/dashboard",
        icon: Home,
        description: "Resumen del día y tareas que requieren atención."
      }
    ]
  },
  {
    label: "Venta diaria",
    items: [
      {
        key: "cash",
        label: "Caja",
        path: "/cash",
        icon: WalletCards,
        description: "Abre, controla y cierra tu caja."
      },
      {
        key: "pos",
        label: "Nueva venta",
        path: "/pos",
        icon: Store,
        description: "Busca productos, prepara la venta y cobra en efectivo."
      },
      {
        key: "pendingCarts",
        label: "Ventas guardadas",
        path: "/pending-carts",
        icon: ClipboardList,
        description: "Retoma, modifica o descarta ventas guardadas.",
        placement: "contextual"
      },
      {
        key: "supervision",
        label: "Supervisar ventas",
        path: "/supervision",
        icon: ShieldCheck,
        description: "Revisa cajas, ventas y ventas guardadas del equipo."
      },
      {
        key: "sales",
        label: "Historial de ventas",
        path: SALES_CANCELLATIONS_PATH,
        icon: RefreshCcw,
        description: "Consulta ventas y anúlalas cuando corresponda."
      },
      {
        key: "invoices",
        label: "Comprobantes",
        path: PREPARED_INTERNAL_DOCUMENTS_PATH,
        icon: ReceiptText,
        description: "Prepara y consulta comprobantes internos no tributarios.",
        placement: "contextual"
      },
      {
        key: "returns",
        label: "Devoluciones",
        path: ADMINISTRATIVE_RETURNS_PATH,
        icon: RotateCcw,
        description: "Registra devoluciones después del cierre de caja.",
        placement: "contextual"
      },
      {
        key: "alerts",
        label: "Alertas",
        path: "/alerts",
        icon: AlertTriangle,
        description: "Revisa faltantes, vencimientos y cajas abiertas."
      }
    ]
  },
  {
    label: "Inventario",
    items: [
      {
        key: "products",
        label: "Productos",
        path: "/products",
        icon: Package,
        description: "Consulta y registra productos, precios y requisitos de venta."
      },
      {
        key: "units",
        label: "Unidades y categorías",
        path: "/units",
        icon: Ruler,
        description: "Configura unidades de venta y categorías de productos.",
        placement: "contextual"
      },
      {
        key: "batches",
        label: "Existencias",
        path: "/batches",
        icon: Boxes,
        description: "Consulta cantidades disponibles por lote y vencimiento."
      },
      {
        key: "movements",
        label: "Movimientos",
        path: "/movements",
        icon: History,
        description: "Consulta el historial de entradas y salidas de stock.",
        placement: "contextual"
      },
      {
        key: "adjustments",
        label: "Corregir stock",
        path: "/adjustments",
        icon: ClipboardList,
        description: "Corrige el stock contado de un lote.",
        placement: "contextual"
      }
    ]
  },
  {
    label: "Abastecimiento",
    items: [
      {
        key: "stockPlanning",
        label: "Qué comprar",
        path: STOCK_PLANNING_PATH,
        icon: PackageCheck,
        description: "Consulta qué medicamentos conviene comprar y en qué cantidad."
      },
      {
        key: "purchases",
        label: "Compras",
        path: "/purchases",
        icon: ShoppingCart,
        description: "Prepara compras y registra la mercadería recibida."
      },
      {
        key: "suppliers",
        label: "Proveedores",
        path: "/suppliers",
        icon: Truck,
        description: "Consulta y registra proveedores.",
        placement: "contextual"
      }
    ]
  },
  {
    label: "Análisis",
    items: [
      {
        key: "reports",
        label: "Reportes",
        path: REPORTS_PATH,
        icon: BarChart3,
        description: "Consulta ventas, valor del inventario y próximos vencimientos."
      },
      {
        key: "exports",
        label: "Exportar datos",
        path: EXPORTS_PATH,
        icon: FileText,
        description: "Descarga ventas y movimientos de inventario.",
        placement: "contextual"
      }
    ]
  },
  {
    label: "Administración",
    items: [
      {
        key: "users",
        label: "Usuarios",
        path: "/users",
        icon: Users,
        description: "Administra cuentas y permisos de acceso."
      },
      {
        key: "roles",
        label: "Roles y permisos",
        path: "/roles",
        icon: Shield,
        description: "Consulta qué puede hacer cada tipo de usuario.",
        placement: "contextual"
      },
      {
        key: "audit",
        label: "Auditoría",
        path: AUDIT_PATH,
        icon: FileBarChart,
        description: "Consulta quién realizó cada acción importante.",
        placement: "contextual"
      }
    ]
  }
];

export const navigationItems = navigationGroups.flatMap((group) => group.items);

export function getVisibleNavigationGroups(roleName: string) {
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => item.placement !== "contextual" && isRouteAllowedForRole(item, roleName)
      )
    }))
    .filter((group) => group.items.length > 0);
}

export function getVisibleNavigationSearchGroups(roleName: string) {
  return navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => isRouteAllowedForRole(item, roleName))
    }))
    .filter((group) => group.items.length > 0);
}

export function getVisibleNavigationItems(roleName: string) {
  return navigationItems.filter((item) => isRouteAllowedForRole(item, roleName));
}

export function isRouteAllowedForRole(item: Pick<AppNavigationItem, "key"> | { key: string }, roleName: string) {
  return isFeatureAllowed(roleName, item.key);
}
