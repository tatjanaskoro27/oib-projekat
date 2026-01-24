import { In, Repository } from "typeorm";
import { Plant } from "../Domain/models/Plant";
import { PlantStatus } from "../Domain/enums/PlantStatus";
import { CreatePlantDTO } from "../Domain/DTOs/CreatePlantDTO";
import { HarvestPlantsDTO } from "../Domain/DTOs/HarvestPlantsDTO";
import { IProductionService } from "../Domain/services/IProductionService";
import { HarvestPlantsResponseDTO } from "../Domain/DTOs/HarvestPlantsResponseDTO";
import { EventClient } from "../Services/EventClient";
import { GetPlantsQueryDTO } from "../Domain/DTOs/GetPlantsQueryDTO";
import { ProcessPlantsDTO, ProcessPlantsResponseDTO } from "../Domain/DTOs/ProcessPlantsDTO";


export class ProductionService implements IProductionService {
  private readonly events = new EventClient();
  constructor(private readonly plantRepo: Repository<Plant>) { }

  async plant(dto: CreatePlantDTO): Promise<Plant> {
    const plant = new Plant();

    plant.name = dto.name;
    plant.latinName = dto.latinName;
    plant.originCountry = dto.originCountry;

    plant.oilStrength = dto.oilStrength ?? Number((Math.random() * 4 + 1).toFixed(2));

    plant.status = PlantStatus.PLANTED;

    const saved = await this.plantRepo.save(plant);

    await this.events.logEvent({
      tip: "INFO",
      opis: `Zasadjena nova biljka: ${saved.name}`,
    });

    if (Number(saved.oilStrength) > 4.0) {
      await this.events.logEvent({
        tip: "WARNING",
        opis: `Upozorenje: jacina ulja za zasađenu biljku prelazi 4.0 (oilStrength=${saved.oilStrength})`,
      });
    }

    return saved;
  }

  async updateOilStrength(plantId: number, percent: number): Promise<Plant> {
    const plant = await this.plantRepo.findOneBy({ id: plantId });
    if (!plant) {
      await this.events.logEvent({
        tip: "ERROR",
        opis: `Pokusaj promjene jacine ulja za nepostojecu biljku`,
      });
      throw new Error("Plant not found");
    }
    // percent = 65 -> 65% od trenutne vrijednosti
    plant.oilStrength = Number((Number(plant.oilStrength) * (percent / 100)).toFixed(2));

    const saved = await this.plantRepo.save(plant);

    await this.events.logEvent({
      tip: "INFO",
      opis: `Promjenjena jacina ulja za biljku ${plantId} na ${saved.oilStrength} (percent=${percent})`,
    });

    return saved;

  }


  async harvest(dto: HarvestPlantsDTO): Promise<HarvestPlantsResponseDTO> {
    const plants = await this.plantRepo.find({
      where: { name: dto.name, status: PlantStatus.PLANTED },
      order: { createdAt: "ASC" },
      take: dto.count,
    });

    if (plants.length < dto.count) {
      await this.events.logEvent({
        tip: "ERROR",
        opis: `Neuspjesno ubiranje – nema dovoljno biljaka tipa ${dto.name} za ubiranje`,
      });
      throw new Error("Not enough planted plants");
    }

    for (const p of plants) {
      p.status = PlantStatus.HARVESTED;
    }
    await this.plantRepo.save(plants);

    await this.events.logEvent({
      tip: "INFO",
      opis: `Ubrane biljke pod nazivom "${dto.name}" (ukupno ${plants.length})`,
    });

    return {
      harvestedPlants: plants.map(p => ({
        id: p.id,
        oilStrength: Number(p.oilStrength),
      })),
    };
  }

  async getAvailableCount(name: string): Promise<number> {
    return await this.plantRepo.count({
      where: { name, status: PlantStatus.PLANTED },
    });
  }

  async getPlants(query: GetPlantsQueryDTO): Promise<Plant[]> {
    const search = (query.search ?? "").trim();
    const status = query.status;
    const sortBy = query.sortBy ?? "createdAt";
    const sortDir = query.sortDir ?? "DESC";

    const qb = this.plantRepo.createQueryBuilder("p");

    if (status) { qb.andWhere("p.status = :status", { status });}
    if (search) { qb.andWhere("(p.name LIKE :s OR p.latinName LIKE :s OR p.originCountry LIKE :s)",{ s: `%${search}%` });}
    
    const sortColumn =
      sortBy === "oilStrength" ? "p.oilStrength" :
        sortBy === "name" ? "p.name" :
          "p.createdAt";

    qb.orderBy(sortColumn, sortDir);

    const plants = await qb.getMany();
    return plants;
  }

  async getPlantById(id: number): Promise<Plant> {
    const plant = await this.plantRepo.findOneBy({ id });

    if (!plant) {
      await this.events.logEvent({
        tip: "ERROR",
        opis: `Pokusaj pregleda nepostojece biljke`,
      });
      throw new Error("Plant not found");
    }
    return plant;
  }

  async processPlants(dto: ProcessPlantsDTO): Promise<ProcessPlantsResponseDTO> {
    const ids = Array.from(new Set(dto.plantIds)).filter((n) => Number.isInteger(n) && n > 0);

    if (ids.length === 0) {
      throw new Error("plantIds are required");
    }

    const plants = await this.plantRepo.find({ where: { id: In(ids) } });

    if (plants.length !== ids.length) {
      throw new Error("Some plants were not found");
    }

    const invalid = plants.filter((p) => p.status !== PlantStatus.HARVESTED);
    if (invalid.length > 0) {
      throw new Error("All plants must be harvested before processing");
    }

    for (const p of plants) p.status = PlantStatus.PROCESSED;
    await this.plantRepo.save(plants);

    await this.events.logEvent({
      tip: "INFO",
      opis: `Biljke oznacene kao preradjene (PROCESSED). Count=${plants.length}, IDs: ${plants
        .map((p) => p.id)
        .join(", ")}`,
    });

    return { processedIds: plants.map((p) => p.id), processedCount: plants.length };
  }

}
