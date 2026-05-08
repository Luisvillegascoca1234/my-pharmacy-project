import type { BaseRole } from "@pharmacy-pos/shared";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardList,
  FileBarChart,
  FileCog,
  FileText,
  History,
  Home,
  Package,
  PackageSearch,
  ReceiptText,
  RefreshCcw,
  Ruler,
  Settings,
  Shield,
  ShoppingCart,
  Store,
  Truck,
  Users,
  WalletCards,
  type LucideIcon
} from "lucide-react";

export type AppRouteKey =
  | "dashboard"
  | "pos"
  | "cash"
  | "returns"
  | "alerts"
  | "products"
  | "units"
  | "batches"
  | "movements"
  | "adjustments"
  | "suppliers"
  | "purchases"
  | "invoices"
  | "siatSettings"
  | "reports"
  | "exports"
  | "audit"
  | "users"
  | "roles"
  | "settings";

export type AppNavigationItem = {
  key: AppRouteKey;
  label: string;
  path: string;
  icon: LucideIcon;
  description: string;
  roles: BaseRole[];
};

export type AppNavigationGroup = {
  label: string;
  items: AppNavigationItem[];
};

const allRoles: BaseRole[] = ["superadmin", "admin", "seller"];
const adminRoles: BaseRole[] = ["superadmin", "admin"];
const superadminOnly: BaseRole[] = ["superadmin"];

export const navigationGroups: AppNavigationGroup[] = [
  {
    label: "Inicio",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        path: "/dashboard",
        icon: Home,
        description: "Indicadores operativos, alertas y salud del sistema.",
        roles: allRoles
      }
    ]
  },
  {
    label: "Operación",
    items: [
      {
        key: "pos",
        label: "Punto de venta",
        path: "/pos",
        icon: Store,
        description: "Registro de ventas, selección FEFO y cobro al contado.",
        roles: allRoles
      },
      {
        key: "cash",
        label: "Caja",
        path: "/cash",
        icon: WalletCards,
        description: "Apertura, cierre, pagos y diferencias de caja.",
        roles: allRoles
      },
      {
        key: "returns",
        label: "Devoluciones y anulaciones",
        path: "/returns",
        icon: RefreshCcw,
        description: "Flujos controlados para devoluciones, ventas anuladas y documentos fiscales.",
        roles: adminRoles
      },
      {
        key: "alerts",
        label: "Alertas",
        path: "/alerts",
        icon: AlertTriangle,
        description: "Stock bajo, vencimientos, caja abierta y observaciones SIAT.",
        roles: allRoles
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
        description: "Catálogo farmacéutico, precios, categorías y requisitos sanitarios.",
        roles: allRoles
      },
      {
        key: "units",
        label: "Unidades y conversiones",
        path: "/units",
        icon: Ruler,
        description: "Presentaciones comerciales y equivalencias hacia unidad base.",
        roles: allRoles
      },
      {
        key: "batches",
        label: "Lotes y stock",
        path: "/batches",
        icon: Boxes,
        description: "Existencias por lote, vencimiento, costo y estado operativo.",
        roles: allRoles
      },
      {
        key: "movements",
        label: "Movimientos",
        path: "/movements",
        icon: History,
        description: "Trazabilidad de entradas, salidas, ajustes, devoluciones y mermas.",
        roles: adminRoles
      },
      {
        key: "adjustments",
        label: "Ajustes manuales",
        path: "/adjustments",
        icon: ClipboardList,
        description: "Correcciones justificadas con auditoría y motivo obligatorio.",
        roles: adminRoles
      }
    ]
  },
  {
    label: "Compras",
    items: [
      {
        key: "suppliers",
        label: "Proveedores",
        path: "/suppliers",
        icon: Truck,
        description: "Datos comerciales, NIT, contacto y estado de proveedores.",
        roles: adminRoles
      },
      {
        key: "purchases",
        label: "Compras",
        path: "/purchases",
        icon: ShoppingCart,
        description: "Compras en borrador, recepción, lotes generados y anulaciones.",
        roles: adminRoles
      }
    ]
  },
  {
    label: "Facturación",
    items: [
      {
        key: "invoices",
        label: "Facturas SIAT",
        path: "/invoices",
        icon: ReceiptText,
        description: "Estados fiscales, respuestas del SIN, validación y anulaciones permitidas.",
        roles: adminRoles
      },
      {
        key: "siatSettings",
        label: "Configuración SIAT",
        path: "/siat-settings",
        icon: FileCog,
        description: "CUIS, CUFD, punto de venta, actividad económica y contingencia.",
        roles: superadminOnly
      }
    ]
  },
  {
    label: "Análisis",
    items: [
      {
        key: "reports",
        label: "Reportes",
        path: "/reports",
        icon: BarChart3,
        description: "Ventas, margen, rotación, vencimientos, compras y caja.",
        roles: adminRoles
      },
      {
        key: "exports",
        label: "Exportaciones CSV",
        path: "/exports",
        icon: FileText,
        description: "Datos normalizados para análisis externo con fechas ISO e IDs estables.",
        roles: adminRoles
      },
      {
        key: "audit",
        label: "Auditoría",
        path: "/audit",
        icon: FileBarChart,
        description: "Registro de acciones sensibles, cambios de datos y respuestas fiscales.",
        roles: superadminOnly
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
        description: "Cuentas, estado de acceso y asignación inicial de roles.",
        roles: superadminOnly
      },
      {
        key: "roles",
        label: "Roles y permisos",
        path: "/roles",
        icon: Shield,
        description: "Permisos para superadmin, admin y vendedor.",
        roles: superadminOnly
      },
      {
        key: "settings",
        label: "Configuración",
        path: "/settings",
        icon: Settings,
        description: "Parámetros globales de operación de la farmacia.",
        roles: superadminOnly
      }
    ]
  }
];

export const navigationItems = navigationGroups.flatMap((group) => group.items);

export function getVisibleNavigationGroups(roleName: string) {
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

export function isRouteAllowedForRole(item: AppNavigationItem, roleName: string) {
  return item.roles.includes(roleName as BaseRole);
}
