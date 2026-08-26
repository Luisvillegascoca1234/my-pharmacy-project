import type { RoleFacultyArea, RoleName, RoleScopeLevel } from "../schemas/role-catalog.schema.js";

type FixedFaculty = {
  area: RoleFacultyArea;
  areaLabel: string;
  level: RoleScopeLevel;
  description: string;
};

type FixedRole = {
  name: RoleName;
  displayName: string;
  responsibility: string;
  faculties: readonly FixedFaculty[];
};

export const FIXED_ROLE_CATALOG = [
  {
    name: "superadmin",
    displayName: "Superadministrador",
    responsibility: "Gobierna el sistema, administra identidades y supervisa integralmente la operación farmacéutica.",
    faculties: [
      faculty("counter_operations", "Operación de mostrador", "full_access", "Opera y supervisa ventas, cajas y registros de todo el personal."),
      faculty("pharmaceutical_catalog", "Catálogo farmacéutico", "full_access", "Administra productos, unidades y catálogos de dispensación."),
      faculty("inventory_traceability", "Inventario y trazabilidad", "full_access", "Consulta y gestiona lotes, movimientos, costos, ajustes y alertas."),
      faculty("supply", "Abastecimiento", "full_access", "Administra proveedores, compras y recepción de mercadería."),
      faculty("administrative_closure_analysis", "Cierre administrativo y análisis", "full_access", "Supervisa cierres, comprobantes internos, devoluciones, reportes y exportaciones."),
      faculty("system_governance", "Gobierno del sistema", "full_access", "Administra usuarios, roles asignados y la auditoría completa de operaciones sensibles.")
    ]
  },
  {
    name: "admin",
    displayName: "Administrador",
    responsibility: "Dirige la operación cotidiana, el abastecimiento y la supervisión administrativa de la farmacia.",
    faculties: [
      faculty("counter_operations", "Operación de mostrador", "operational_access", "Opera el mostrador y supervisa ventas, cajas y pendientes de otros usuarios."),
      faculty("pharmaceutical_catalog", "Catálogo farmacéutico", "full_access", "Administra productos, unidades y catálogos requeridos para la dispensación."),
      faculty("inventory_traceability", "Inventario y trazabilidad", "full_access", "Gestiona lotes, movimientos, costos, ajustes y alertas operativas."),
      faculty("supply", "Abastecimiento", "full_access", "Gestiona proveedores, compras y recepción de mercadería."),
      faculty("administrative_closure_analysis", "Cierre administrativo y análisis", "full_access", "Ejecuta cierres, comprobantes internos, devoluciones, reportes y exportaciones."),
      faculty("system_governance", "Gobierno del sistema", "no_access", "No administra usuarios, roles asignados ni la auditoría completa.")
    ]
  },
  {
    name: "seller",
    displayName: "Vendedor",
    responsibility: "Atiende la dispensación en mostrador y opera exclusivamente sus registros comerciales y de caja.",
    faculties: [
      faculty("counter_operations", "Operación de mostrador", "own_records_only", "Opera el POS, sus pendientes, su caja y sus ventas bajo las reglas vigentes."),
      faculty("pharmaceutical_catalog", "Catálogo farmacéutico", "operational_access", "Consulta productos y unidades necesarios para la dispensación."),
      faculty("inventory_traceability", "Inventario y trazabilidad", "operational_access", "Consulta stock, lotes y alertas básicas sin gestionar movimientos ni costos."),
      faculty("supply", "Abastecimiento", "no_access", "No gestiona proveedores, compras ni recepciones."),
      faculty("administrative_closure_analysis", "Cierre administrativo y análisis", "no_access", "No accede a comprobantes internos administrativos, devoluciones, reportes ni exportaciones."),
      faculty("system_governance", "Gobierno del sistema", "no_access", "No administra usuarios, roles asignados ni la auditoría completa.")
    ]
  }
] as const satisfies readonly FixedRole[];

function faculty(area: RoleFacultyArea, areaLabel: string, level: RoleScopeLevel, description: string): FixedFaculty {
  return { area, areaLabel, level, description };
}
