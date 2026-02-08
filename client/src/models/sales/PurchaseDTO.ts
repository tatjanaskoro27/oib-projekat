export type PurchaseItemDTO = {
  name: string;     
  quantity: number;
};

export type PurchaseRequestDTO = {
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
