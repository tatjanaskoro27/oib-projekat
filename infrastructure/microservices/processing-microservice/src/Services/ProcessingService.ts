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
    // 1 biljka = 50ml (iz specifikacije/vašeg dogovora)
    const totalMlNeeded = dto.bottleCount * dto.bottleVolume;
    const plantsNeeded = Math.ceil(totalMlNeeded / 50);

    const plantName = dto.perfumeName.trim(); // biljka = isto ime kao parfem (Lavanda -> Lavanda)

    // 1) provjeri koliko ima u production (preko gateway internal)
    const available = await this.gateway.getAvailableCount(plantName);

    // 2) ako fali -> zatraži sadnju (preko gateway internal)
    const missing = plantsNeeded - available;
    if (missing > 0) {
      for (let i = 0; i < missing; i++) {
        await this.gateway.plantOne({
          name: plantName,
          latinName: plantName,
          originCountry: "BiH",
        });
      }
    }

    // 3) uzmi konkretne biljke (harvest/allocate) i dobiješ ID-jeve
    const harvestedIds = await this.gateway.harvest(plantName, plantsNeeded);

    // 4) napravi parfeme (kao u tvom kodu)
    const perfumesToCreate: Perfume[] = [];

    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 2);

    for (let i = 0; i < dto.bottleCount; i++) {
      const p = new Perfume();
      p.name = dto.perfumeName;
      p.type = dto.perfumeType;
      p.netoMl = dto.bottleVolume;

      const plantIndex = i % plantsNeeded;
      p.plantId = harvestedIds[plantIndex];

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
