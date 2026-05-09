import { resetHealthStatusStore } from "@/modules/health";
import { resetProductsCatalogStore } from "@/modules/products";
import { resetUnitsCatalogStore } from "@/modules/units";

export function resetSessionScopedState(): void {
  resetProductsCatalogStore();
  resetUnitsCatalogStore();
  resetHealthStatusStore();
}
