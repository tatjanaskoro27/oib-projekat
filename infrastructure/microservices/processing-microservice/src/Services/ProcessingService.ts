import { Repository } from "typeorm";
import { Perfume } from "../Domain/models/Perfume";
import { IProcessingService } from "../Domain/services/IProcessingService";
import { StartProcessingDTO } from "../Domain/DTOs/StartProcessingDTO";
import { GetPerfumesDTO } from "../Domain/DTOs/GetPerfumesDTO";
import { GatewayClient } from "../Services/GatewayClient";

export class ProcessingService implements IProcessingService {
  private readonly gateway = new GatewayClient();

  constructor(private readonly perfumeRepo: Repository<Perfume>) { }

  async startProcessing(dto: StartProcessingDTO): Promise<Perfume[]> {
    const totalMlNeeded = dto.bottleCount * dto.bottleVolume;
    const plantsNeeded = Math.ceil(totalMlNeeded / 50);
    const plantName = dto.perfumeName.trim();

    const available = await this.gateway.getAvailableCount(plantName);
    const missing = plantsNeeded - available;

    if (missing > 0) {
      await this.gateway.logEvent({
        tip: "INFO",
        opis: `Nedostaje biljaka tipa "${plantName}" za parfem, dostupno: ${available}, potrebno: ${plantsNeeded}}`,
      });
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
        const percent = Math.round((hp.oilStrength - 4.0) * 100); // 4.65 -> 65

        await this.gateway.logEvent({
          tip: "WARNING",
          opis: `Jacina ulja ubrane biljke ciji je id ${hp.id} iznosi ${hp.oilStrength} (>4.0)`,
        });

        // 1) zasadi DODATNU biljku za balans
        const newPlant = await this.gateway.plantOne({
          name: plantName,
          latinName: plantName,
          originCountry: "BiH",
        });

        // 2) smanji joj oilStrength na % trenutne vrijednosti
        await this.gateway.updateOilStrength(newPlant.id, percent);

        await this.gateway.logEvent({
          tip: "INFO",
          opis: `Prilagodjena jacina ulja za biljku: ${newPlant.id}, procenat: ${percent}`,
        });
      }
    }

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


    await this.gateway.logEvent({
      tip: "INFO",
      opis: `Uspjesno preradjeno ${finalPerfumes.length} bocica parfema naziva"${dto.perfumeName}"`,
    });

    return finalPerfumes;
  }

  async getPerfumes(dto: GetPerfumesDTO): Promise<Perfume[]> {
    return await this.perfumeRepo.find({
      where: { type: dto.perfumeType },
      order: { createdAt: "DESC" },
      take: dto.count,
    });
  }
}
