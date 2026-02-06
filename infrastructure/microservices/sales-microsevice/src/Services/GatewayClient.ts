import axios, { AxiosInstance } from "axios";
import { CreateDogadjajDTO } from "../Domain/DTOs/EventDTO";
import { CreateFiscalReceiptDTO } from "../Domain/DTOs/CreateFiscalReceiptDTO";

type Uloga = "MENADZER_PRODAJE" | "PRODAVAC";

export class GatewayClient {
  private readonly client: AxiosInstance;

  // Putanje preko env-a (da ne hardkodujemo rute – timski projekat)
  private readonly storageSendPath: string;
  private readonly analyticsCreateReceiptPath: string;
  private readonly dogadjajiPath: string;

  constructor() {
    const baseURL = process.env.GATEWAY_INTERNAL_API;
    if (!baseURL) throw new Error("GATEWAY_INTERNAL_API nije podešen u .env");

    const internalKey = process.env.INTERNAL_API_KEY;
    if (!internalKey) throw new Error("INTERNAL_API_KEY nije podešen u .env");

    /**
     * DEFAULT rute (ako env nije setovan).
     * Ove default-ove stavi da budu najbliži onome što gateway tipično ima:
     * - skladiste: /internal/skladiste/... (action)
     * - analytics: /internal/analytics/... (racuni)
     */
    this.storageSendPath =
      process.env.STORAGE_SEND_PATH ?? "/internal/skladiste/slanje";
    this.analyticsCreateReceiptPath =
      process.env.ANALYTICS_CREATE_RECEIPT_PATH ?? "/internal/analytics/racuni";
    this.dogadjajiPath =
      process.env.DOGADJAJI_PATH ?? "/internal/dogadjaji";

    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": internalKey,
      },
      timeout: 15000,
    });
  }

  /**
   * Skladište: zahtev da se obezbedi/umanji ambalaža za prodaju.
   * Napomena: payload je { trazenaKolicina } kao što već koristiš.
   *
   * ULOGA HEADER:
   * - Ako ti gateway/skladiste eksplicitno traži x-uloga, ostavi.
   * - Ako ne traži, ovaj header neće smetati (najčešće se ignoriše).
   */
  async requestPerfumesFromStorage(
    trazenaKolicina: number,
    uloga?: Uloga,
  ): Promise<any> {
    try {
      const res = await this.client.post(
        this.storageSendPath,
        { trazenaKolicina },
        uloga ? { headers: { "x-uloga": uloga } } : undefined,
      );
      return res.data;
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.response?.data ??
        e?.message ??
        "Storage request failed";
      throw new Error(`Skladište greška: ${msg}`);
    }
  }

  /**
   * Analytics: kreiranje fiskalnog računa (NE DIRAMO QR deo, ovo je samo racun).
   */
  async createFiscalReceipt(dto: CreateFiscalReceiptDTO): Promise<any> {
    try {
      const res = await this.client.post(this.analyticsCreateReceiptPath, dto);
      return res.data;
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ??
        e?.response?.data ??
        e?.message ??
        "Create receipt failed";
      throw new Error(`Analytics greška: ${msg}`);
    }
  }

  /**
   * Događaji / audit
   */
  async logEvent(dto: CreateDogadjajDTO): Promise<void> {
    try {
      await this.client.post(this.dogadjajiPath, dto);
    } catch (e: any) {
      // audit ne sme da obori kupovinu
      console.warn("⚠️ logEvent failed (ignored):", e?.message ?? e);
    }
  }
}
