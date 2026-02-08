import { Repository } from "typeorm";
import { Perfume } from "../Domain/models/Perfume";
import { IProcessingService } from "../Domain/services/IProcessingService";
import { StartProcessingDTO } from "../Domain/DTOs/StartProcessingDTO";
import { GetPerfumesDTO } from "../Domain/DTOs/GetPerfumesDTO";
import { GatewayClient } from "../Services/GatewayClient";
import { CatalogItemDTO } from "../Domain/DTOs/CatalogItemDTO";

const toNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export class ProcessingService implements IProcessingService {
  private readonly gateway = new GatewayClient();

  constructor(private readonly perfumeRepo: Repository<Perfume>) {}

  async startProcessing(dto: StartProcessingDTO): Promise<Perfume[]> {
    const totalMlNeeded = dto.bottleCount * dto.bottleVolume;
    const plantsNeeded = Math.ceil(totalMlNeeded / 50);

    const plantName = dto.plantName.trim();

    const available = await this.gateway.getAvailableCount(plantName);
    const missing = plantsNeeded - available;

    let plantType = await this.gateway.getPlantTypeByName(plantName);
 
    if (!plantType) {
      throw new Error(
        `Vrsta biljke "${dto.plantName}" ne postoji. ` + `Kreiraj je prvo u Proizvodnji.`);
    }
    
    if (missing > 0) {
      await this.gateway.logEvent({
        tip: "INFO",
        opis: `Nedostaje ${missing} biljaka tipa "${plantName}" za parfem`,
      });

      for (let i = 0; i < missing; i++) {
        await this.gateway.plantOne({
          name: plantType.name,
          latinName: plantType.latinName,
          originCountry: plantType.originCountry,
        });
      }
    }

    // harvest
    const harvestRes = await this.gateway.harvest(plantName, plantsNeeded);
    const harvestedPlants = harvestRes.harvestedPlants;

    // balansiranje - koristi podatke od prve ubrane
    const templatePlant = harvestedPlants[0];

    for (const hp of harvestedPlants) {
      if (hp.oilStrength > 4.0) {
        const percent = Math.round((hp.oilStrength - 4.0) * 100);

        await this.gateway.logEvent({
          tip: "WARNING",
          opis: `Jacina ulja ubrane biljke ${hp.name} iznosi ${hp.oilStrength} (>4.0)`,
        });

        const newPlant = await this.gateway.plantOne({
          name: templatePlant.name,
          latinName: templatePlant.latinName,
          originCountry: templatePlant.originCountry,
        });

        await this.gateway.updateOilStrength(newPlant.id, percent);
      }
    }

    // kreiraj parfeme (u processing DB)
    const perfumesToCreate: Perfume[] = [];
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 2);

    for (let i = 0; i < dto.bottleCount; i++) {
      const p = new Perfume();
      p.name = dto.perfumeName;
      p.type = dto.perfumeType;
      p.netoMl = dto.bottleVolume;

      const plantIndex = i % harvestedPlants.length;
      p.plantId = harvestedPlants[plantIndex].id;

      p.serialNumber = `TMP-${Date.now()}-${i}-${Math.floor(Math.random() * 1e9)}`;
      p.expiryDate = expiry;

      perfumesToCreate.push(p);
    }

    const saved = await this.perfumeRepo.save(perfumesToCreate);

    for (const perfume of saved) {
      perfume.serialNumber = `PP-2025-${perfume.id}`;
    }

    const finalPerfumes = await this.perfumeRepo.save(saved);

    // oznaci biljke kao PROCESSED u productionu
    const harvestedIds = Array.from(new Set(harvestedPlants.map((p) => p.id)));
    await this.gateway.markPlantsProcessed(harvestedIds);

    await this.gateway.logEvent({
      tip: "INFO",
      opis: `Uspjesno preradjeno ${finalPerfumes.length} bocica parfema naziva "${dto.perfumeName}"`,
    });

     //spakuj i pošalji u skladište kao ambalažu
    await this.packAndSendToWarehouse(finalPerfumes);

    return finalPerfumes;
  }

  async getPerfumes(dto: GetPerfumesDTO): Promise<Perfume[]> {
    return await this.perfumeRepo.find({
      where: { type: dto.perfumeType },
      order: { createdAt: "DESC" },
      take: dto.count,
    });
  }

  
  // ✅ NOVO: katalog (meta + price), BEZ fajlova
  async getCatalog(): Promise<CatalogItemDTO[]> {
    // izvučemo sve parfeme i agregiramo po (name,type,netoMl)
    const all = await this.perfumeRepo.find();

    const key = (p: Perfume) =>
      `${String(p.name).trim().toLowerCase()}|${String(p.type).trim().toLowerCase()}|${Number(p.netoMl)}`;

    const map = new Map<string, { name: string; type: string; netoMl: number; count: number }>();

    for (const p of all) {
      const k = key(p);
      const cur = map.get(k);
      if (!cur) {
        map.set(k, { name: p.name, type: p.type, netoMl: p.netoMl, count: 1 });
      } else {
        cur.count += 1;
      }
    }

    // Cena = pravilo iz ENV (bez hardcode kataloga)
    const base = toNum(process.env.PRICE_BASE, 50); // npr 50
    const perMl = toNum(process.env.PRICE_PER_ML, 0.4); // npr 0.4
    const parfumMult = toNum(process.env.PRICE_PARFUM_MULT, 1.3); // npr 1.3
    const cologneMult = toNum(process.env.PRICE_COLOGNE_MULT, 1.0); // npr 1.0
    const descPrefix = process.env.DESCRIPTION_PREFIX ?? "Parfem";

    const out: CatalogItemDTO[] = [];
    for (const v of map.values()) {
      const t = String(v.type).toLowerCase();
      const mult = t === "parfum" ? parfumMult : cologneMult;
      const price = Number((mult * (base + v.netoMl * perMl)).toFixed(2));

      out.push({
        name: v.name,
        type: v.type,
        netoMl: v.netoMl,
        description: `${descPrefix} ${v.name}`,
        price,
      });
    }

    // stabilno sortiranje
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
  }

    private async packAndSendToWarehouse(perfumes: Perfume[]) {
    const warehouses = await this.gateway.getWarehouses();
    if (!Array.isArray(warehouses) || warehouses.length === 0) {
      await this.gateway.logEvent({
        tip: "ERROR",
        opis: `Nema dostupnih skladista za prijem ambalaze.`,
      });
      return;
    }

    // biramo skladište sa najviše slobodnog kapaciteta (po broju ambalaza)
    const best = warehouses
      .map((w) => {
        const used = Array.isArray(w.ambalaze) ? w.ambalaze.length : 0;
        const max = Number(w.maksimalanBrojAmbalaza);
        return { w, free: max - used };
      })
      .sort((a, b) => b.free - a.free)[0];

    if (!best || best.free <= 0) {
      await this.gateway.logEvent({
        tip: "ERROR",
        opis: `Sva skladista su puna. Ne mogu da posaljem ambalazu.`,
      });
      return;
    }

    // ✅ realne stavke: svaki parfem je 1 stavka (perfumeId + naziv)
    const items = perfumes.map((p) => ({
      perfumeId: String(p.id),
      naziv: String(p.name),
    }));

    await this.gateway.receivePackage(best.w.id, items);

    await this.gateway.logEvent({
      tip: "INFO",
      opis: `Processing poslao ${items.length} parfema u skladiste ${best.w.id} (naziv: "${perfumes?.[0]?.name ?? "N/A"}")`,
    });
  }

}
