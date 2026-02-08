import { PurchaseRequestDTO } from "../../Domain/DTOs/PurchaseRequestDTO";

type ValidationResult = { success: true } | { success: false; message: string };

export function validatePurchase(body: any): ValidationResult {
  const dto = body as PurchaseRequestDTO;

  if (!dto || typeof dto !== "object") return { success: false, message: "Body is required" };

  if (!dto.userId || typeof dto.userId !== "string")
    return { success: false, message: "userId is required" };

  if (!dto.saleType || (dto.saleType !== "MALOPRODAJA" && dto.saleType !== "VELEPRODAJA"))
    return { success: false, message: "saleType is required" };

  if (
    !dto.paymentType ||
    !["GOTOVINA", "UPLATA_NA_RACUN", "KARTICNO_PLACANJE"].includes(dto.paymentType)
  )
    return { success: false, message: "paymentType is required" };

  if (!Array.isArray(dto.items) || dto.items.length === 0)
    return { success: false, message: "items is required" };

  for (const it of dto.items) {
    if (!it || typeof it !== "object") return { success: false, message: "Invalid item" };

    if (!it.name || typeof it.name !== "string")
      return { success: false, message: "name is required" };

    const q = Number(it.quantity);
    if (!Number.isFinite(q) || q <= 0)
      return { success: false, message: "quantity must be > 0" };
  }

  return { success: true };
}
