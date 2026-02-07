// src/Domain/DTOs/PurchaseRequestDTO.ts
export interface PurchaseRequestDTO {
  userId: string;
  saleType: "MALOPRODAJA" | "VELEPRODAJA";
  paymentType: "GOTOVINA" | "UPLATA_NA_RACUN" | "KARTICNO_PLACANJE";
  items: Array<{
    name: string;
    quantity: number;
  }>;
}
