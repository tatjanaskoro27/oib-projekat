import { Repository } from "typeorm";
import { Perfume } from "../Domain/models/Perfume";
import { IProcessingService } from "../Domain/services/IProcessingService";
import { StartProcessingDTO } from "../Domain/DTOs/StartProcessingDTO";
import { GetPerfumesDTO } from "../Domain/DTOs/GetPerfumesDTO";
import { GatewayClient } from "../Services/GatewayClient";

export class ProcessingService implements IProcessingService {
  private readonly gateway = new GatewayClient();

  constructor(private readonly perfumeRepo: Repository<Perfume>) {}

  async startProcessing(dto: StartProcessingDTO): Promise<Perfume[]> {
    const totalMlNeeded = dto.bottleCount * dto.bottleVolume;
    const plantsNeeded = Math.ceil(totalMlNeeded / 50);
    const plantName = dto.perfumeName.trim();

    const available = await this.gateway.getAvailableCount(plantName);
    const missing = plantsNeeded - available;

    //provjeriti
    if (missing > 0) {
      for (let i = 0; i < missing; i++) {
        await this.gateway.plantOne({
          name: plantName,
          latinName: plantName,
          originCountry: "BiH",
        });
      }
    }

    const harvestRes = await this.gateway.harvest(plantName, plantsNeeded);
    const harvestedPlants = harvestRes.harvestedPlants;

    for (const hp of harvestedPlants) {
      if (hp.oilStrength > 4.0) {
        const percent = Number(((hp.oilStrength - 4.0) * 100).toFixed(0)); // 4.65 -> 65

        //provjeriti
        // smanji joj oilStrength 
        await this.gateway.updateOilStrength(hp.id, percent);
      }
    }

    const perfumesToCreate: Perfume[] = [];
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 2);

    //pravi parfeme
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

    return await this.perfumeRepo.save(saved);
  }

  async getPerfumes(dto: GetPerfumesDTO): Promise<Perfume[]> {
    return await this.perfumeRepo.find({
      where: { type: dto.perfumeType },
      order: { createdAt: "DESC" },
      take: dto.count,
    });
  }
}
