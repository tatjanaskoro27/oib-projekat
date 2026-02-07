import axios, { AxiosInstance } from "axios";
import { CreateFiscalReceiptDTO } from "../Domain/DTOs/CreateFiscalReceiptDTO";
import { PackAndSendRequestDTO } from "../Domain/DTOs/PackAndSendRequestDTO";

type Uloga = "MENADZER_PRODAJE" | "PRODAVAC";

export class GatewayClient {
  private readonly client: AxiosInstance;

  // putanje preko env-a (da nema hardcode)
  private readonly analyticsCreateReceiptPath: string;
  private readonly dogadjajiPath: string;

  private readonly processingGetPath: string;
  private readonly processingPackSendPath: string;
  private readonly processingStartPath: string;


  constructor() {
    const baseURL = process.env.GATEWAY_INTERNAL_API;
    if (!baseURL) throw new Error("GATEWAY_INTERNAL_API nije podešen u .env");

    const internalKey = process.env.INTERNAL_API_KEY;
    if (!internalKey) throw new Error("INTERNAL_API_KEY nije podešen u .env");

    this.analyticsCreateReceiptPath =
      process.env.ANALYTICS_CREATE_RECEIPT_PATH ?? "/internal/analytics/racuni";

    this.dogadjajiPath = process.env.DOGADJAJI_PATH ?? "/internal/dogadjaji";

    // internal processing
    this.processingGetPath =
      process.env.PROCESSING_AVAILABLE_PATH ?? "/internal/processing/get";

    this.processingStartPath =
    process.env.PROCESSING_START_PATH ?? "/internal/processing/start";

    // ako ga koristiš negde (može ostati)
    this.processingPackSendPath =
      process.env.GATEWAY_PROCESSING_PACK_SEND_PATH ??
      "/internal/processing/packing/send";

    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": internalKey,
      },
      timeout: 15000,
    });
  }

  // --------------------
  // ANALYTICS
  // --------------------
  async createFiscalReceipt(dto: CreateFiscalReceiptDTO): Promise<any> {
    try {
      const res = await this.client.post(this.analyticsCreateReceiptPath, dto);
      return res.data;
    } catch (e: any) {
      const status = e?.response?.status;
      const data = e?.response?.data;

      const msg =
        (data?.message ?? data?.error) ??
        (typeof data === "string"
          ? data
          : data
            ? JSON.stringify(data)
            : null) ??
        e?.message ??
        "Create receipt failed";

      throw new Error(`Analytics greška (${status ?? "?"}): ${msg}`);
    }
  }

  // --------------------
  // DOGADJAJI
  // --------------------
  async logEvent(dto: { tip: "INFO" | "WARNING" | "ERROR"; opis: string }) {
    // audit log ne treba da obori tok, ali ovde je ok da pustiš da baci ako želiš
    const res = await this.client.post(this.dogadjajiPath, dto);
    return res.data;
  }

  // --------------------
  // PROCESSING (preko gateway internal)
  // --------------------
  async getAvailablePerfumesFromProcessing(perfumeType = "parfum", count = 1000): Promise<any[]> {
    const res = await this.client.post(this.processingGetPath, { perfumeType, count });
    return Array.isArray(res.data) ? res.data : [];
  }

 async startProcessing(body: {
  perfumeName: string;
  perfumeType: string;
  bottleVolume: number;
  bottleCount: number;
}): Promise<any> {
  const res = await this.client.post(this.processingStartPath, body);
  return res.data;
}


  async getProcessingCatalog(): Promise<
    Array<{ name: string; description: string; price: number; type: string; netoMl: number }>
  > {
    const res = await this.client.get("/internal/processing/catalog");
    return Array.isArray(res.data) ? res.data : [];
  }

  async packAndSendToProcessing(dto: PackAndSendRequestDTO): Promise<any> {
    const res = await this.client.post(this.processingPackSendPath, dto);
    return res.data;
  }

  // --------------------
  // SKLADISTE (preko gateway internal)
  // --------------------
  async requestPerfumesFromStorage(trazenaKolicina: number, uloga: Uloga) {
    // koristiš već postojeću internal rutu u gateway-u
    const res = await this.client.post(
      "/internal/skladiste/poslji-ambalaze",
      { trazenaKolicina },
      { headers: { "x-uloga": uloga } },
    );
    return res.data;
  }

  async requestPerfumeStateFromStorage(names: string[], uloga: Uloga) {
    const body = { items: names.map((n) => ({ name: n, quantity: 1 })) };
    const res = await this.client.post("/internal/skladiste/slanje", body, {
      headers: { "x-uloga": uloga, "x-mode": "STANJE" },
    });
    return (res.data?.poslato ?? []) as Array<{ name: string; quantity: number }>;
  }

  async requestPerfumesFromStorageByItems(items: Array<{ name: string; quantity: number }>, uloga: Uloga) {
    const body = { items };
    const res = await this.client.post("/internal/skladiste/slanje", body, {
      headers: { "x-uloga": uloga, "x-mode": "ISPORUKA" },
    });
    return res.data;
  }

  // kompatibilno sa starim imenima ako ih negde koristiš
  async skladisteStanje(names: string[], uloga: Uloga) {
    return this.requestPerfumeStateFromStorage(names, uloga);
  }
  async skladisteIsporuka(items: Array<{ name: string; quantity: number }>, uloga: Uloga) {
    const res = await this.client.post("/internal/skladiste/slanje", { items }, {
      headers: { "x-uloga": uloga, "x-mode": "ISPORUKA" },
    });
    return (res.data?.poslato ?? []) as Array<{ name: string; quantity: number }>;
  }
}
