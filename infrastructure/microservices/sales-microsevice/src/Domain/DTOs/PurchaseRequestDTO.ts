export type PurchaseItemDTO = {
  perfumeId: string;
  quantity: number;
};

export type PurchaseRequestDTO = {
  userId: string;
  items: PurchaseItemDTO[];
  saleType?: string;     // kasnije: MALOPRODAJA / VELEPRODAJA
  paymentType?: string;  // kasnije: GOTOVINA / KARTICA / ...
};
