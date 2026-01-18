import { Repository } from "typeorm";
import { Perfume } from "../Domain/models/Perfume";
import { IProcessingService } from "../Domain/services/IProcessingService";
import { StartProcessingDTO } from "../Domain/DTOs/StartProcessingDTO";
import { GetPerfumesDTO } from "../Domain/DTOs/GetPerfumesDTO";

export class ProcessingService implements IProcessingService {
  constructor(private readonly perfumeRepo: Repository<Perfume>) {}

  async startProcessing(dto: StartProcessingDTO): Promise<Perfume[]> {
    // 1 biljka = 50ml
    const totalMlNeeded = dto.bottleCount * dto.bottleVolume;
    const plantsNeeded = Math.ceil(totalMlNeeded / 50);

    if (!dto.plantIds || dto.plantIds.length < plantsNeeded) {
      throw new Error(
        `Not enough plants for processing. Needed ${plantsNeeded}, got ${dto.plantIds?.length ?? 0}`
      );
    }

    // pravimo onoliko parfema koliko ima bocica
    // i mapiramo plantId ciklično kroz prvih plantsNeeded biljaka
    const perfumesToCreate: Perfume[] = [];

    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 2); // npr. +2 godine (možemo podesiti)

    for (let i = 0; i < dto.bottleCount; i++) {
      const p = new Perfume();
      p.name = dto.perfumeName;
      p.type = dto.perfumeType;
      p.netoMl = dto.bottleVolume;

      const plantIndex = i % plantsNeeded;
      p.plantId = dto.plantIds[plantIndex];

      // serijski broj se formira tek kad dobijemo ID,
      // pa prvo snimimo bez serialNumber, pa update
      p.serialNumber = `TMP-${Date.now()}-${i}-${Math.floor(Math.random() * 1e9)}`;

      p.expiryDate = expiry;

      perfumesToCreate.push(p);
    }

    const saved = await this.perfumeRepo.save(perfumesToCreate);

    // sada popuni serialNumber: PP-2025-ID_PARFEMA
    // (ako želiš da godina bude dinamična, reci)
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
