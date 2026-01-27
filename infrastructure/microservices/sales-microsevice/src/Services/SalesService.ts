import { In, Repository } from "typeorm";
import { Perfume } from "../Domain/Entities/Perfume";
import { Sale } from "../Domain/Entities/Sale";
import { PurchaseRequestDTO } from "../Domain/DTOs/PurchaseRequestDTO";
import { GatewayClient } from "./GatewayClient";
import { CreateFiscalReceiptDTO } from "../Domain/DTOs/CreateFiscalReceiptDTO";
import { CreateDogadjajDTO } from "../Domain/DTOs/EventDTO";

type Uloga = "MENADZER_PRODAJE" | "PRODAVAC";

// lokalni tip (ne diraš DTO fajlove)
type ParsedItem = {
  name: string;
  quantity: number;
};

export class SalesService {
  constructor(
    private readonly perfumeRepo: Repository<Perfume>,
    private readonly saleRepo: Repository<Sale>,
    private readonly gatewayClient: GatewayClient
  ) {}

  async getAllPerfumes(): Promise<Perfume[]> {
    return this.perfumeRepo.find();
  }

  async seedPerfumes(): Promise<{ message: string }> {
    const existing = await this.perfumeRepo.count();
    if (existing > 0) return { message: "Data already exists" };

    const perfumes = [
      { name: "Chanel No 5", description: "Classic floral perfume", price: 120.0, stock: 10 },
      { name: "Dior Sauvage", description: "Fresh woody scent", price: 95.5, stock: 15 },
      { name: "Gucci Bloom", description: "Floral bouquet", price: 105.0, stock: 8 },
    ];

    for (const p of perfumes) {
      const perfume = new Perfume();
      Object.assign(perfume, p);
      await this.perfumeRepo.save(perfume);
    }

    return { message: "Test data seeded successfully" };
  }

  async purchase(dto: PurchaseRequestDTO, uloga: Uloga): Promise<{
    sale: Sale;
    racun: any;
    storageResponse: any;
  }> {
    // helper: audit log ne sme da obori kupovinu
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

      if (!Array.isArray((dto as any)?.items) || (dto as any).items.length === 0) {
        throw new Error("Missing items");
      }

      // 1) Parse items: očekujemo name + quantity
      const parsedItems: ParsedItem[] = ((dto as any).items as any[]).map((i: any) => {
        const name = String(i?.name ?? "").trim();
        if (!name) throw new Error("Missing perfume name");

        const qty = Number(i?.quantity ?? i?.kolicina ?? i?.qty);
        if (!Number.isFinite(qty) || qty <= 0) throw new Error("Invalid quantity");

        return { name, quantity: qty };
      });

      // 2) Sum quantity
      const trazenaKolicina = parsedItems.reduce((sum, it) => sum + it.quantity, 0);
      if (!Number.isFinite(trazenaKolicina) || trazenaKolicina <= 0) {
        throw new Error("Invalid quantity");
      }

      // 3) Load perfumes by UNIQUE names (da duplikati ne ubiju check)
      const uniqueNames = Array.from(new Set(parsedItems.map((i) => i.name)));
      const perfumes = await this.perfumeRepo.findBy({ name: In(uniqueNames) });

      if (perfumes.length !== uniqueNames.length) {
        const found = new Set(perfumes.map((p) => p.name));
        const missing = uniqueNames.filter((n) => !found.has(n));
        throw new Error(`Some perfumes do not exist: ${missing.join(", ")}`);
      }

      const byName = new Map<string, Perfume>(perfumes.map((p) => [p.name, p]));

      // 4) Validate stock + total
      let total = 0;
      for (const it of parsedItems) {
        const p = byName.get(it.name)!;

        if (p.stock < it.quantity) {
          throw new Error(`Not enough stock for perfume ${p.name}`);
        }
        total += Number(p.price) * it.quantity;
      }
      total = Number(total.toFixed(2));

      // 5) Storage preko GW internal (ambalaže -> raspakivanje)
      // Napomena: ako skladiste vraća detalje, mi ih samo prosledimo nazad.
      const storageResponse = await this.gatewayClient.requestPerfumesFromStorage(trazenaKolicina, uloga);

      // 6) Fiskalni račun preko GW internal (analytics)
      const receiptDto: CreateFiscalReceiptDTO = {
        tipProdaje: ((dto as any).saleType as any) ?? "MALOPRODAJA",
        nacinPlacanja: ((dto as any).paymentType as any) ?? "GOTOVINA",
        stavke: parsedItems.map((it) => {
          const p = byName.get(it.name)!;
          return {
            parfemNaziv: p.name,
            kolicina: it.quantity,
            cenaPoKomadu: Number(p.price),
          };
        }),
      };

      const racun = await this.gatewayClient.createFiscalReceipt(receiptDto);

      // 7) Transaction: update stock + save sale (da bude atomic)
      const savedSale = await this.saleRepo.manager.transaction(async (trx) => {
        // smanji stock
        for (const it of parsedItems) {
          const p = byName.get(it.name)!;
          p.stock -= it.quantity;
          await trx.getRepository(Perfume).save(p);
        }

        // upiši sale
        const sale = new Sale();
        sale.userId = userId;
        sale.items = (dto as any).items as any; // čuvamo original što je došlo
        sale.totalAmount = total;
        sale.status = "completed";

        return await trx.getRepository(Sale).save(sale);
      });

      // 8) Log success event (NE SME da obori response)
      await safeLog({
        tip: "INFO",
        opis: `Uspesna kupovina. SaleId=${savedSale.id}. RacunId=${racun?.id ?? "?"}`,
      });

      return { sale: savedSale, racun, storageResponse };
    } catch (err: any) {
      // Log fail event (ignore errors)
      await safeLog({
        tip: "ERROR",
        opis: `Neuspesna kupovina: ${err?.message ?? "greska"}`,
      });

      throw err;
    }
  }
}

