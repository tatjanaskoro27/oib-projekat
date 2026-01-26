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

  async purchase(dto: PurchaseRequestDTO, uloga: Uloga): Promise<any> {
    try {
      if (!dto.userId) throw new Error("Missing userId");
      if (!Array.isArray(dto.items) || dto.items.length === 0) throw new Error("Missing items");

      // 1) Parse items: očekujemo name + quantity
      const parsedItems: ParsedItem[] = (dto.items as any[]).map((i: any) => {
        const qty = Number(i?.quantity);
        if (!Number.isFinite(qty) || qty <= 0) throw new Error("Invalid quantity");

        const name = String(i?.name ?? "").trim();
        if (!name) throw new Error("Missing perfume name");

        return { name, quantity: qty };
      });

      const trazenaKolicina = parsedItems.reduce((sum, it) => sum + it.quantity, 0);
      if (!Number.isFinite(trazenaKolicina) || trazenaKolicina <= 0) {
        throw new Error("Invalid quantity");
      }

      // 2) Load perfumes by NAME (jer front ima UUID id, a DB ima numeric id)
      const names = parsedItems.map((i) => i.name);
      const perfumes = await this.perfumeRepo.findBy({ name: In(names) });

      if (perfumes.length !== names.length) {
        throw new Error("Some perfumes do not exist");
      }

      const byName = new Map<string, Perfume>(perfumes.map((p) => [p.name, p]));

      // 3) Validate stock + total
      let total = 0;
      for (const it of parsedItems) {
        const p = byName.get(it.name);
        if (!p) throw new Error("Perfume not found");

        if (p.stock < it.quantity) throw new Error(`Not enough stock for perfume ${p.name}`);

        total += Number(p.price) * it.quantity;
      }

      // 4) Skladište preko GW internal
      const storageResponse = await this.gatewayClient.requestPerfumesFromStorage(trazenaKolicina, uloga);

      // 5) Fiskalni račun preko GW internal
      const receiptDto: CreateFiscalReceiptDTO = {
        tipProdaje: (dto.saleType as any) ?? "MALOPRODAJA",
        nacinPlacanja: (dto.paymentType as any) ?? "GOTOVINA",
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

      // 6) Stock update
      for (const it of parsedItems) {
        const p = byName.get(it.name)!;
        p.stock -= it.quantity;
        await this.perfumeRepo.save(p);
      }

      // 7) Save sale
      const sale = new Sale();
      sale.userId = dto.userId;

      // čuvamo originalni request items (sa name/quantity + šta god još dođe)
      sale.items = dto.items as any;

      sale.totalAmount = Number(total.toFixed(2));
      sale.status = "completed";

      const saved = await this.saleRepo.save(sale);

      // 8) Log event (success)
      const okEvent: CreateDogadjajDTO = {
        tip: "INFO",
        opis: `Uspesna kupovina. SaleId=${saved.id}. RacunId=${racun?.id ?? "?"}`,
      };
      await this.gatewayClient.logEvent(okEvent);

      return { sale: saved, racun, storageResponse };
    } catch (err: any) {
      // Log event (fail)
      try {
        const failEvent: CreateDogadjajDTO = {
          tip: "ERROR",
          opis: `Neuspesna kupovina: ${err?.message ?? "greska"}`,
        };
        await this.gatewayClient.logEvent(failEvent);
      } catch {
        // ignore logging failure
      }
      throw err;
    }
  }
}
