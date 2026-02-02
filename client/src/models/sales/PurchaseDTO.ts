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
  sale: {
    id: number;
    userId: string;
    items: any[];
    totalAmount: number;
    status: string;
  };
  racun: any;
  storageResponse: any;
  qrCode: string;
};
