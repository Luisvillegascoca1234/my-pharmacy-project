import type { ProductStatus, ProductType } from "@pharmacy-pos/shared";

export const productTypeLabels: Record<ProductType, string> = {
  medicine: "Medicamento",
  otc: "Venta libre",
  medical_supply: "Insumo médico",
  hygiene_disinfection: "Higiene y desinfección",
  related_misc: "Relacionado"
};

export const productStatusLabels: Record<ProductStatus, string> = {
  active: "Activo",
  inactive: "Inactivo"
};
