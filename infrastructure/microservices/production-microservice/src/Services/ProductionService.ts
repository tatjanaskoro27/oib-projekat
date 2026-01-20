import { Repository } from "typeorm";
import { Plant } from "../Domain/models/Plant";
import { PlantStatus } from "../Domain/enums/PlantStatus";
import { CreatePlantDTO } from "../Domain/DTOs/CreatePlantDTO";
import { HarvestPlantsDTO } from "../Domain/DTOs/HarvestPlantsDTO";
import { IProductionService } from "../Domain/services/IProductionService";
import { HarvestPlantsResponseDTO } from "../Domain/DTOs/HarvestPlantsResponseDTO";

export class ProductionService implements IProductionService {
  constructor(private readonly plantRepo: Repository<Plant>) { }

  async plant(dto: CreatePlantDTO): Promise<Plant> {
    const plant = new Plant();

    plant.name = dto.name;
    plant.latinName = dto.latinName;
    plant.originCountry = dto.originCountry;

    plant.oilStrength = dto.oilStrength ?? Number((Math.random() * 4 + 1).toFixed(2));

    plant.status = PlantStatus.PLANTED;

    return await this.plantRepo.save(plant);
  }

  async updateOilStrength(plantId: number, percent: number): Promise<Plant> {
    const plant = await this.plantRepo.findOneBy({ id: plantId });
    if (!plant) throw new Error("Plant not found");

    // percent = 65 -> 65% od trenutne vrijednosti
    plant.oilStrength = Number((Number(plant.oilStrength) * (percent / 100)).toFixed(2));

    return await this.plantRepo.save(plant);
  }


  async harvest(dto: HarvestPlantsDTO): Promise<HarvestPlantsResponseDTO> {
    const plants = await this.plantRepo.find({
      where: { name: dto.name, status: PlantStatus.PLANTED },
      order: { createdAt: "ASC" },
      take: dto.count,
    });

    if (plants.length < dto.count) {
      throw new Error("Not enough planted plants");
    }

    for (const p of plants) {
      p.status = PlantStatus.HARVESTED;
    }
    await this.plantRepo.save(plants);

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

}
