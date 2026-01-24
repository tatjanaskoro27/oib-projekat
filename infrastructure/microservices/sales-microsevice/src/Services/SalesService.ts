import { Repository } from "typeorm";
import { Perfume } from "../Domain/Entities/Perfume";
import { Sale } from "../Domain/Entities/Sale";
import { PurchaseRequestDTO } from "../Domain/DTOs/PurchaseRequestDTO";
import { GatewayClient } from "./GatewayClient"; // proveri putanju (isti folder Services)

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

    async purchase(dto: PurchaseRequestDTO, uloga: "MENADZER_PRODAJE" | "PRODAVAC"): Promise<any>  {
    if (!dto.userId) throw new Error("Missing userId");
    if (!Array.isArray(dto.items) || dto.items.length === 0) throw new Error("Missing items");


    const totalBottles = dto.items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    const capacity = Number(process.env.PACKAGE_CAPACITY ?? 3);
    const packagesCount = Math.ceil(totalBottles / capacity);

    const ids = dto.items.map((i) => i.perfumeId);

    // TypeORM 0.3+ nema findByIds, pa koristimo ovaj "siguran" način:
    const perfumes = await this.perfumeRepo.find();
    const filtered = perfumes.filter(p => ids.includes(String(p.id)));
    const storageResponse = await this.gatewayClient.requestPerfumesFromStorage(packagesCount, uloga);
    void storageResponse;


    if (filtered.length !== ids.length) throw new Error("Some perfumes do not exist");

    let total = 0;

    for (const item of dto.items) {
      if (item.quantity <= 0) throw new Error("Invalid quantity");

      const p = filtered.find((x) => String(x.id) === String(item.perfumeId));
      if (!p) throw new Error("Perfume not found");

      if (p.stock < item.quantity) throw new Error(`Not enough stock for perfume ${p.name}`);

      total += Number(p.price) * item.quantity;
    }

    // stock update
    for (const item of dto.items) {
      const p = filtered.find((x) => String(x.id) === String(item.perfumeId))!;
      p.stock -= item.quantity;
      await this.perfumeRepo.save(p);
    }

    const sale = new Sale();
    sale.userId = dto.userId;
    sale.items = dto.items.map((i) => ({ perfumeId: i.perfumeId, quantity: i.quantity }));
    sale.totalAmount = Number(total.toFixed(2));
    sale.status = "completed";

    return await this.saleRepo.save(sale);
  }
}
