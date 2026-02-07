import { In, Repository } from "typeorm";
import { Perfume } from "../Domain/Entities/Perfume";
import { Sale } from "../Domain/Entities/Sale";
import { PurchaseRequestDTO } from "../Domain/DTOs/PurchaseRequestDTO";
import { GatewayClient } from "./GatewayClient";
import { CreateFiscalReceiptDTO } from "../Domain/DTOs/CreateFiscalReceiptDTO";
import { CreateDogadjajDTO } from "../Domain/DTOs/EventDTO";
import * as QRCode from "qrcode";

const mapSaleType = (v: any): "MALOPRODAJA" | "VELEPRODAJA" =>
  v === "VELEPRODAJA" ? "VELEPRODAJA" : "MALOPRODAJA";

const mapPaymentType = (v: any): "GOTOVINA" | "UPLATA_NA_RACUN" | "KARTICA" => {
  if (v === "KARTICA") return "KARTICA";
  if (v === "UPLATA" || v === "UPLATA_NA_RACUN") return "UPLATA_NA_RACUN";
  return "GOTOVINA";
};

type Uloga = "MENADZER_PRODAJE" | "PRODAVAC";

type ParsedItem = {
  name: string;
  quantity: number;
};

type ProcessingCatalogItem = {
  name: string;
  type: string;   // "parfum" | "cologne" (kod tebe string)
  netoMl: number; // 150 | 250
  description: string;
  price: number;
};

export class SalesService {
  constructor(
    private readonly perfumeRepo: Repository<Perfume>, // meta (opis/cena) - može ostati
    private readonly saleRepo: Repository<Sale>,
    private readonly gatewayClient: GatewayClient,
  ) {}

  // ✅ Katalog: meta iz Processing-a, stanje iz Skladišta, cena/opis iz Sales DB (ako postoji)
  async getAllPerfumes(): Promise<any[]> {
    // 1) Processing katalog (name,type,ml,description,price)
    let catalog: ProcessingCatalogItem[] = [];
    try {
      catalog = await this.gatewayClient.getProcessingCatalog();
    } catch (e: any) {
      console.error("❌ Processing catalog failed:", e?.message ?? e);
      return [];
    }

    if (!catalog.length) return [];

    const names = catalog.map((c) => c.name);

    // 2) Stanje iz Skladišta (STANJE mode) – po nazivima
    let stanje: Array<{ name: string; quantity: number }> = [];
    try {
      stanje = await this.gatewayClient.requestPerfumeStateFromStorage(names, "PRODAVAC"); 
      // uloga ovde nije bitna za STANJE, ali skladiste traži header
    } catch (e: any) {
      console.error("❌ Storage stanje failed:", e?.message ?? e);
      stanje = [];
    }

    const stanjeMap = new Map(stanje.map((s) => [String(s.name).trim().toLowerCase(), Number(s.quantity)]));

    // 3) (opciono) meta iz Sales baze (opis/cena) – ako je imaš
    const meta = await this.perfumeRepo.findBy({ name: In(names) });
    const metaMap = new Map(meta.map((m) => [String(m.name).trim().toLowerCase(), m]));

    // 4) Spoj
    return catalog.map((c) => {
      const key = String(c.name).trim().toLowerCase();
      const stock = stanjeMap.get(key) ?? 0;

      // Ako nemaš meta u Sales DB, koristi Processing cenu/opis
      const m = metaMap.get(key);
      const priceNum = Number((m as any)?.price ?? c.price);
      const safePrice = Number.isFinite(priceNum) ? priceNum : Number(c.price) || 0;

      return {
  id: String((m as any)?.id ?? c.name), // ✅ stabilno i unikatan id za UI
  name: c.name,
  description: String((m as any)?.description ?? c.description ?? ""),
  price: safePrice,
  stock,
  available: stock > 0,
  type: c.type,
  netoMl: c.netoMl,
};

    });
  }

  async purchase(
    dto: PurchaseRequestDTO,
    uloga: Uloga,
  ): Promise<{
    sale: Sale;
    racun: any;
    storageResponse: any;
    qrCode: string;
  }> {
    const safeLog = async (event: CreateDogadjajDTO) => {
      try {
        await this.gatewayClient.logEvent(event);
      } catch (e: any) {
        console.warn("⚠️ Audit log failed (ignored):", e?.message ?? e);
      }
    };

    try {
      // 0) Basic validation
      const userId = String((dto as any)?.userId ?? "").trim();
      if (!userId) throw new Error("Missing userId");

      const rawItems = (dto as any)?.items;
      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        throw new Error("Missing items");
      }

      // 1) Parse items
      const parsedItems: ParsedItem[] = rawItems.map((i: any) => {
        const qty = Number(i?.quantity ?? i?.kolicina ?? i?.qty);
        if (!Number.isFinite(qty) || qty <= 0) throw new Error("Invalid quantity");

        const name = String(i?.name ?? i?.naziv ?? "").trim();
        if (!name) throw new Error("Missing perfume name");

        return { name, quantity: qty };
      });

      // 2) Učitaj Processing katalog da znaš type/ml za svaki parfem (bez hardcode)
      const catalog = await this.gatewayClient.getProcessingCatalog();
      const catMap = new Map(
        catalog.map((c) => [String(c.name).trim().toLowerCase(), c]),
      );

      for (const it of parsedItems) {
        if (!catMap.has(it.name.trim().toLowerCase())) {
          throw new Error(`Parfem ne postoji u Processing katalogu: ${it.name}`);
        }
      }

      // 3) Učitaj cenovnik iz Sales baze (po nazivu) – ako ti treba za račun
      const names = Array.from(new Set(parsedItems.map((i) => i.name)));
      const meta = names.length ? await this.perfumeRepo.findBy({ name: In(names) }) : [];
      const metaMap = new Map(meta.map((m) => [String(m.name).trim().toLowerCase(), m]));

      // Ako nemaš meta u Sales bazi, možeš koristiti price iz Processing kataloga
      // (specifikacija ne kaže da Sales mora imati posebnu bazu cenovnika)
      // Znači: ne bacaj grešku ako meta ne postoji, nego fallback na Processing cenu.

      // 4) Pokušaj ISPORUKA iz Skladišta po stavkama (ovo skida realno stanje)
      let storageResponse: any;
      try {
        storageResponse = await this.gatewayClient.requestPerfumesFromStorageByItems(parsedItems, uloga);
      } catch (e: any) {
        // ✅ Nema hardcode: pokreni Processing za tačno te parfeme (type+ml iz kataloga)
        await safeLog({
          tip: "WARNING",
          opis: `Skladiste nema dovoljno robe. Pokrecem preradu u Processing-u, pa ponavljam isporuku...`,
        } as any);

        // Pokreni preradu za svaku stavku
        for (const it of parsedItems) {
          const c = catMap.get(it.name.trim().toLowerCase())!;
          const plantName = process.env.DEFAULT_PLANT_NAME ?? "";
if (!plantName) throw new Error("DEFAULT_PLANT_NAME nije podešen u Sales .env");

await this.gatewayClient.startProcessing({
  plantName, // ✅ mora da postoji u Production
  perfumeName: it.name,
  perfumeType: c.type,
  bottleVolume: Number(c.netoMl),
  bottleCount: Number(it.quantity),
} as any);

        }

        // ponovi isporuku
        storageResponse = await this.gatewayClient.requestPerfumesFromStorageByItems(parsedItems, uloga);
      }

      // 5) Total
      let total = 0;
      for (const it of parsedItems) {
        const key = it.name.trim().toLowerCase();
        const p = metaMap.get(key);
        const c = catMap.get(key)!;

        const unitPrice = Number(p?.price ?? c.price);
        if (!Number.isFinite(unitPrice)) throw new Error(`Nevalidna cena za: ${it.name}`);
        total += unitPrice * it.quantity;
      }
      total = Number(total.toFixed(2));

      // 6) Fiskalni račun preko GW internal (NE DIRATI DTO format)
      const receiptDto: CreateFiscalReceiptDTO = {
        datum: new Date().toISOString(),
        tipProdaje: mapSaleType((dto as any).saleType),
        nacinPlacanja: mapPaymentType((dto as any).paymentType),
        stavke: parsedItems.map((it) => {
          const key = it.name.trim().toLowerCase();
          const p = metaMap.get(key);
          const c = catMap.get(key)!;

          const unitPrice = Number(p?.price ?? c.price);
          return {
            parfemNaziv: it.name,
            kolicina: it.quantity,
            cenaPoKomadu: Number(unitPrice),
          };
        }),
      };

      const racun = await this.gatewayClient.createFiscalReceipt(receiptDto);

      // ---- QR KOD (NADOGRADNJA) ----
      // ⚠️ NE DIRATI OVAJ DEO (tekst + QRCode.toDataURL(text))
      // Napomena: ovde koristimo metaMap umesto perfumeMap, ali format QR teksta ostaje isti.
      const qrPayload = {
        brojProizvoda: parsedItems.length,
        proizvodi: parsedItems.map((it) => {
          const key = it.name.trim().toLowerCase();
          const p = metaMap.get(key);
          const c = catMap.get(key)!;

          const unitPrice = Number(p?.price ?? c.price);
          return {
            sifraProizvoda: (p as any)?.id ?? 0,
            nazivProizvoda: it.name,
            jedinicnaCena: Number(unitPrice),
            kolicina: it.quantity,
            ukupnaCena: Number((Number(unitPrice) * it.quantity).toFixed(2)),
          };
        }),
        ukupno: total,
      };

      const text = `RACUN\nUkupno: ${total}\nStavke: ${parsedItems.map((i) => `${i.name} x${i.quantity}`).join(", ")}`;
      const qrCodeDataUrl = await QRCode.toDataURL(text);
      // ---- KRAJ QR ----

      // 7) Sačuvaj sale (NE skidaj stock u Sales DB)
      const savedSale = await this.saleRepo.manager.transaction(async (trx) => {
        const sale = new Sale();
        sale.userId = userId;

        sale.items = parsedItems.map((it) => ({
          name: it.name,
          quantity: it.quantity,
        })) as any;

        sale.totalAmount = total;
        sale.status = "completed";

        return await trx.getRepository(Sale).save(sale);
      });

      await safeLog({
        tip: "INFO",
        opis: `Uspesna kupovina. SaleId=${savedSale.id}. RacunId=${racun?.racunId ?? racun?.id ?? "?"}`,
      } as any);

      return {
        sale: savedSale,
        racun,
        storageResponse,
        qrCode: qrCodeDataUrl,
      };
    } catch (err: any) {
      console.error("PURCHASE ERROR:", err?.response?.data || err?.message || err);

      await safeLog({
        tip: "ERROR",
        opis: `Purchase failed: ${err?.response?.data?.message ?? err?.message ?? "Unknown error"}`,
      } as any);

      throw err;
    }
  }
}
