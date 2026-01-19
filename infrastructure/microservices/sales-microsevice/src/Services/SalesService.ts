import { Db } from "../Database/DbConnectionPool";
import { Perfume } from "../Domain/Entities/Perfume";
import { Sale } from "../Domain/Entities/Sale";
import { PurchaseRequestDTO } from "../Domain/DTOs/PurchaseRequestDTO";

export class SalesService {
  async getAllPerfumes(): Promise<Perfume[]> {
    const perfumeRepo = Db.getRepository(Perfume);
    return perfumeRepo.find();
  }

  async seedPerfumes(): Promise<{ message: string }> {
    const perfumeRepo = Db.getRepository(Perfume);

    const existing = await perfumeRepo.count();
    if (existing > 0) return { message: "Data already exists" };

    const perfumes = [
      { name: "Chanel No 5", description: "Classic floral perfume", price: 120.0, stock: 10 },
      { name: "Dior Sauvage", description: "Fresh woody scent", price: 95.5, stock: 15 },
      { name: "Gucci Bloom", description: "Floral bouquet", price: 105.0, stock: 8 },
    ];

    for (const p of perfumes) {
      const perfume = new Perfume();
      Object.assign(perfume, p);
      await perfumeRepo.save(perfume);
    }

    return { message: "Test data seeded successfully" };
  }

  async purchase(dto: PurchaseRequestDTO): Promise<Sale> {
    if (!dto.userId) throw new Error("Missing userId");
    if (!Array.isArray(dto.items) || dto.items.length === 0) throw new Error("Missing items");

    const perfumeRepo = Db.getRepository(Perfume);
    const saleRepo = Db.getRepository(Sale);

    // 1) Učitaj sve parfeme iz baze
    const ids = dto.items.map(i => i.perfumeId);
    const perfumes = await perfumeRepo.findByIds(ids as any); // TypeORM verzije se razlikuju

    if (perfumes.length !== ids.length) {
      throw new Error("Some perfumes do not exist");
    }

    // 2) Validacija + total iz baze + stock check
    let total = 0;

    for (const item of dto.items) {
      if (item.quantity <= 0) throw new Error("Invalid quantity");

      const p = perfumes.find(x => String(x.id) === String(item.perfumeId));
      if (!p) throw new Error("Perfume not found");

      if (p.stock < item.quantity) {
        throw new Error(`Not enough stock for perfume ${p.name}`);
      }

      total += Number(p.price) * item.quantity;
    }

    // 3) Smanji stock
    for (const item of dto.items) {
      const p = perfumes.find(x => String(x.id) === String(item.perfumeId))!;
      p.stock -= item.quantity;
      await perfumeRepo.save(p);
    }

    // 4) Upisi prodaju
    const sale = new Sale();
    sale.userId = dto.userId;
    sale.items = dto.items.map(i => ({ perfumeId: i.perfumeId, quantity: i.quantity }));
    sale.totalAmount = Number(total.toFixed(2));
    sale.status = "completed";

    return await saleRepo.save(sale);
  }
}
