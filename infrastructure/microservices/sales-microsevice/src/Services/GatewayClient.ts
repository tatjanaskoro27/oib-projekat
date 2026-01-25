import axios, { AxiosInstance } from "axios";
import { CreateDogadjajDTO } from "../Domain/DTOs/EventDTO";
import { CreateFiscalReceiptDTO } from "../Domain/DTOs/CreateFiscalReceiptDTO";

// Svi pozivi iz MS -> MS idu preko gateway-a na /internal rute.
// Pattern identičan kao u production/processing.
export class GatewayClient {
  private readonly client: AxiosInstance;

  // Putanje se mogu menjati iz env-a da ne hardkodujemo rute,
  // jer se u timu često razlikuju nazivi (sales/analytics/skladiste...).
  private readonly storageSendPath: string;
  private readonly analyticsCreateReceiptPath: string;

  constructor() {
    const baseURL = process.env.GATEWAY_INTERNAL_API;
    if (!baseURL) throw new Error("GATEWAY_INTERNAL_API nije podešen u .env");

    const internalKey = process.env.INTERNAL_API_KEY;
    if (!internalKey) throw new Error("INTERNAL_API_KEY nije podešen u .env");

    this.storageSendPath = process.env.STORAGE_SEND_PATH ?? "/internal/skladiste/poslji-ambalaze";
    this.analyticsCreateReceiptPath = process.env.ANALYTICS_CREATE_RECEIPT_PATH ?? "/internal/analytics/racuni";

    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": internalKey,
      },
      timeout: 10000,
    });
  }

  // ---- storage -> sales
  // očekivani format odgovora zavisi od implementacije skladista.
  // Predlog: skladiste vrati listu parfema koji su raspakovani iz poslatih ambalaza.
  // ---- storage -> sales
async requestPerfumesFromStorage(trazenaKolicina: number, uloga: "MENADZER_PRODAJE" | "PRODAVAC"): Promise<any> {
  const res = await this.client.post(
    this.storageSendPath,
    { trazenaKolicina },
    { headers: { "x-uloga": uloga } }
  );
  return res.data;
}





  // ---- analytics
  async createFiscalReceipt(dto: CreateFiscalReceiptDTO): Promise<any> {
    const res = await this.client.post(this.analyticsCreateReceiptPath, dto);
    return res.data;
  }

  // ---- audit/events
  async logEvent(dto: CreateDogadjajDTO): Promise<void> {
    await this.client.post("/internal/dogadjaji", dto);
  }
}
