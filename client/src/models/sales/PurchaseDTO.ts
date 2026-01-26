export type PurchaseItemDTO = {
  perfumeId: string;
  quantity: number;
};

export type PurchaseRequestDTO = {
  // backend očekuje "id" (user id) – zato ga šaljemo ovako
  userId: number;
  items: PurchaseItemDTO[];
  saleType: "MALOPRODAJA" | "VELEPRODAJA";
  paymentType: "GOTOVINA" | "UPLATA" | "KARTICA";
};

export type PurchaseResponseDTO = {
  id: string;
  userId: string;
  items: PurchaseItemDTO[];
  totalAmount: number;
  saleDate: string;
  status: string;
};
