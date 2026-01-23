export type SaleType = "MALOPRODAJA" | "VELEPRODAJA";
export type PaymentType = "GOTOVINA" | "UPLATA_NA_RACUN" | "KARTICA";

export type FiscalReceiptItemDTO = {
  perfumeId: string;
  quantity: number;
  unitPrice: number;
};

// DTO koji šaljemo ka analytics MS da on kreira fiskalni račun.
export type CreateFiscalReceiptDTO = {
  userId: string;
  saleType: SaleType;
  paymentType: PaymentType;
  items: FiscalReceiptItemDTO[];
  totalAmount: number;
};
