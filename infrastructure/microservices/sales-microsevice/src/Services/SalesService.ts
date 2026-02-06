import { In, Repository } from "typeorm";
import { Perfume } from "../Domain/Entities/Perfume";
import { Sale } from "../Domain/Entities/Sale";
import { PurchaseRequestDTO } from "../Domain/DTOs/PurchaseRequestDTO";
import { GatewayClient } from "./GatewayClient";
import { CreateFiscalReceiptDTO } from "../Domain/DTOs/CreateFiscalReceiptDTO";
import { CreateDogadjajDTO } from "../Domain/DTOs/EventDTO";
import * as QRCode from "qrcode";

type Uloga = "MENADZER_PRODAJE" | "PRODAVAC";

// Podržavamo razne oblike item-a koji mogu doći sa fronta
type ParsedItem = {
  perfumeId?: number;
  name?: string;
  quantity: number;
};

export class SalesService {
  constructor(
    private readonly perfumeRepo: Repository<Perfume>,
    private readonly saleRepo: Repository<Sale>,
    private readonly gatewayClient: GatewayClient,
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

      // 1) Parse items (podržava: {perfumeId|id|name} + quantity/kolicina/qty)
      const parsedItems: ParsedItem[] = rawItems.map((i: any) => {
        const qty = Number(i?.quantity ?? i?.kolicina ?? i?.qty);
        if (!Number.isFinite(qty) || qty <= 0) throw new Error("Invalid quantity");

        const perfumeIdRaw = i?.perfumeId ?? i?.id ?? i?.parfemId;
        const perfumeId = perfumeIdRaw !== undefined && perfumeIdRaw !== null ? Number(perfumeIdRaw) : undefined;

        const name = String(i?.name ?? i?.naziv ?? "").trim() || undefined;

        if (!perfumeId && !name) {
          throw new Error("Missing perfume identifier (id or name)");
        }

        return { perfumeId: Number.isFinite(perfumeId as any) ? perfumeId : undefined, name, quantity: qty };
      });

      // 2) Sum quantity (za skladiste)
      const trazenaKolicina = parsedItems.reduce((sum, it) => sum + it.quantity, 0);
      if (!Number.isFinite(trazenaKolicina) || trazenaKolicina <= 0) throw new Error("Invalid quantity");

      // 3) Load perfumes (po id i/ili po nazivu)
      const ids = Array.from(new Set(parsedItems.map(i => i.perfumeId).filter((x): x is number => Number.isFinite(x as any))));
      const names = Array.from(new Set(parsedItems.map(i => i.name).filter((x): x is string => !!x)));

      const perfumesById = ids.length ? await this.perfumeRepo.findBy({ id: In(ids as any) }) : [];
      const perfumesByName = names.length ? await this.perfumeRepo.findBy({ name: In(names) }) : [];

      // merge unique by id
      const perfumeMap = new Map<number, Perfume>();
      for (const p of [...perfumesById, ...perfumesByName]) perfumeMap.set((p as any).id, p);

      // validate existence for each item
      for (const it of parsedItems) {
        let found: Perfume | undefined;

        if (it.perfumeId && perfumeMap.has(it.perfumeId)) {
          found = perfumeMap.get(it.perfumeId);
        } else if (it.name) {
          found = Array.from(perfumeMap.values()).find(p => p.name === it.name);
        }

        if (!found) {
          throw new Error(`Perfume not found: ${it.perfumeId ?? it.name ?? "?"}`);
        }

        // normalize item to id + name (da dalje sve bude stabilno)
        it.perfumeId = (found as any).id;
        it.name = found.name;
      }

      // 4) Validate stock + total
      let total = 0;
      for (const it of parsedItems) {
        const p = perfumeMap.get(it.perfumeId!)!;
        if (p.stock < it.quantity) throw new Error(`Not enough stock for perfume ${p.name}`);
        total += Number(p.price) * it.quantity;
      }
      total = Number(total.toFixed(2));

      // 5) Poziv Skladišta preko GW internal (umanjenje ambalaže)
      // (ako skladiste vrati detalje, mi samo prosledimo)
      const storageResponse = await this.gatewayClient.requestPerfumesFromStorage(trazenaKolicina, uloga);

      // 6) Fiskalni račun preko GW internal (NE DIRATI DTO fajl)
      const receiptDto: CreateFiscalReceiptDTO = {
        tipProdaje: ((dto as any).saleType as any) ?? "MALOPRODAJA",
        nacinPlacanja: ((dto as any).paymentType as any) ?? "GOTOVINA",
        stavke: parsedItems.map((it) => {
          const p = perfumeMap.get(it.perfumeId!)!;
          return {
            parfemNaziv: p.name,
            kolicina: it.quantity,
            cenaPoKomadu: Number(p.price),
          };
        }),
      };

      const racun = await this.gatewayClient.createFiscalReceipt(receiptDto);

      // ---- QR KOD (NADOGRADNJA) ----
      // ⚠️ NE DIRATI OVAJ DEO (tekst + QRCode.toDataURL(text))
      const qrPayload = {
        brojProizvoda: parsedItems.length,
        proizvodi: parsedItems.map((it) => {
          const p = perfumeMap.get(it.perfumeId!)!;
          return {
            sifraProizvoda: p.id,
            nazivProizvoda: p.name,
            jedinicnaCena: Number(p.price),
            kolicina: it.quantity,
            ukupnaCena: Number((p.price * it.quantity).toFixed(2)),
          };
        }),
        ukupno: total,
      };

      const text = `RACUN\nUkupno: ${total}\nStavke: ${parsedItems.map(i => `${i.name} x${i.quantity}`).join(", ")}`;
      const qrCodeDataUrl = await QRCode.toDataURL(text);
      // ---- KRAJ QR ----

      // 7) Transaction: update stock + save sale (atomic)
      const savedSale = await this.saleRepo.manager.transaction(async (trx) => {
        // smanji stock
        for (const it of parsedItems) {
          const p = perfumeMap.get(it.perfumeId!)!;
          p.stock -= it.quantity;
          await trx.getRepository(Perfume).save(p);
        }

        // upiši sale
        const sale = new Sale();
        sale.userId = userId;

        // čuvamo normalizovane stavke (stabilnije nego raw dto.items)
        sale.items = parsedItems.map((it) => ({
          perfumeId: it.perfumeId,
          name: it.name,
          quantity: it.quantity,
        })) as any;

        sale.totalAmount = total;
        sale.status = "completed";

        // ako tvoj Sale entitet ima polje za racunId, mozes ovo otkomentarisati:
        // sale.racunId = racun?.racunId ?? racun?.id ?? null;

        return await trx.getRepository(Sale).save(sale);
      });

      // 8) Audit log success (ne sme da obori response)
      await safeLog({
        tip: "INFO",
        opis: `Uspesna kupovina. SaleId=${savedSale.id}. RacunId=${racun?.racunId ?? racun?.id ?? "?"}`,
      });

      return {
        sale: savedSale,
        racun,
        storageResponse,
        qrCode: qrCodeDataUrl,
      };
    } catch (err: any) {
      await safeLog({
        tip: "ERROR",
        opis: `Neuspesna kupovina: ${err?.message ?? "greska"}`,
      });
      throw err;
    }
  }
}
