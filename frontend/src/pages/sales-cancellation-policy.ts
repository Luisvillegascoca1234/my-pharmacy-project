import type { CancelableSale, SaleCancellationBlockReason } from "@/modules/sales";

const cancellationBlockMessages: Record<SaleCancellationBlockReason, string> = {
  "already-cancelled": "La venta ya fue anulada y se conserva como historial operativo.",
  "cash-session-closed": "La caja asociada está cerrada; la venta ya no admite anulación operativa.",
  forbidden: "La venta pertenece a otro usuario y no está habilitada para tu alcance propio.",
  "not-current-day": "La venta no corresponde al día operativo actual y ya no admite anulación por el vendedor.",
  unknown: "El estado actual de la venta no admite anulación operativa."
};

export function isSaleCancellationAllowed(sale: CancelableSale | null) {
  return sale?.canCancel === true;
}

export function getSaleCancellationBlockMessage(sale: CancelableSale | null) {
  if (!sale) {
    return "Selecciona una venta para consultar la evaluación de anulación.";
  }

  return cancellationBlockMessages[sale.cancellationBlockedReason ?? "unknown"];
}

export function getSupervisedSellerFilter(canSupervise: boolean, sellerUserId: string) {
  return canSupervise ? sellerUserId : "";
}
