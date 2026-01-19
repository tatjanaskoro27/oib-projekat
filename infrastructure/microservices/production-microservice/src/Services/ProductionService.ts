import { Repository } from "typeorm";
import { Plant } from "../Domain/models/Plant";
import { PlantStatus } from "../Domain/enums/PlantStatus";
import { CreatePlantDTO } from "../Domain/DTOs/CreatePlantDTO";
import { HarvestPlantsDTO } from "../Domain/DTOs/HarvestPlantsDTO";
import { IProductionService } from "../Domain/services/IProductionService";

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

    plant.oilStrength = Number(
      (Number(plant.oilStrength) * (1 + percent / 100)).toFixed(2)
    );

    return await this.plantRepo.save(plant);
  }

  async harvest(dto: HarvestPlantsDTO): Promise<{ harvestedIds: number[] }> {
    const plants = await this.plantRepo.find({
      where: { name: dto.name, status: PlantStatus.PLANTED },
      order: { createdAt: "ASC" },
      take: dto.count,
    });

    if (plants.length < dto.count) {
      throw new Error("Not enough planted plants");
    }

    const harvestedIds = plants.map((p) => p.id);

    for (const p of plants) p.status = PlantStatus.HARVESTED;
    await this.plantRepo.save(plants);

    return { harvestedIds };
  }

  async getAvailableCount(name: string): Promise<number> {
    return await this.plantRepo.count({
      where: { name, status: PlantStatus.PLANTED },
    });
  }

}
