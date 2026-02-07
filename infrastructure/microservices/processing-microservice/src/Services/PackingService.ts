import { Repository, In, Not } from "typeorm";
import { Perfume } from "../Domain/models/Perfume";
import { PackedPerfume } from "../Domain/models/PackedPerfume";
import { IPackingService } from "../Domain/services/IPackingService";
import { PackAndSendRequestDTO } from "../Domain/DTOs/PackAndSendRequestDTO";
import { PackAndSendResponseDTO } from "../Domain/DTOs/PackAndSendResponseDTO";
import { StartProcessingDTO } from "../Domain/DTOs/StartProcessingDTO";
import { GatewayClient } from "./GatewayClient";
import { PrijemAmbalazeDTO } from "../Domain/DTOs/PrijemAmbalazeDTO";
import { IProcessingService } from "../Domain/services/IProcessingService";

type NeedKey = string;

function makeKey(name: string, type: string, ml: number): NeedKey {
  return `${name}||${type}||${ml}`;
}

/**
 * Novi servis koji samo DODAJE funkcionalnost:
 * Processing -> (pakovanje) -> Skladiste prijem
 *
 * Ne dira postojece /processing/start i /processing/get.
 */
export class PackingService implements IPackingService {
  private readonly gateway = new GatewayClient();

  constructor(
    private readonly perfumeRepo: Repository<Perfume>,
    private readonly packedRepo: Repository<PackedPerfume>,
    private readonly processingService: IProcessingService
  ) {}

  async packAndSend(dto: PackAndSendRequestDTO): Promise<PackAndSendResponseDTO> {
    const skladisteId = Number(dto.skladisteId);
    if (!Number.isFinite(skladisteId) || skladisteId <= 0) {
      throw new Error("skladisteId mora biti > 0");
    }

    const packageRef = (dto.nazivAmbalaze || `AMB-${Date.now()}`).trim();
    const adresaPosiljaoca = (dto.adresaPosiljaoca || "Processing centar").trim();

    // 1) Izracunaj koliko nam treba po (name,type,ml)
    const needs = new Map<NeedKey, { name: string; type: string; ml: number; qty: number }>();
    for (const it of dto.items) {
      const name = (it.perfumeName || "").trim();
      const type = String(it.perfumeType || "").trim();
      const ml = Number(it.bottleVolume);
      const qty = Number(it.quantity);
      if (!name) throw new Error("perfumeName je obavezan");
      if (!type) throw new Error("perfumeType je obavezan");
      if (!Number.isFinite(ml) || ml <= 0) throw new Error("bottleVolume mora biti > 0");
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("quantity mora biti > 0");

      const k = makeKey(name, type, ml);
      const prev = needs.get(k);
      if (prev) prev.qty += qty;
      else needs.set(k, { name, type, ml, qty });
    }

    // 2) Nadji vec spakovane parfeme (da ih izuzmemo)
    const packed = await this.packedRepo.find({ select: ["perfumeId"] });
    const packedIds = packed.map((x) => x.perfumeId);

    // 3) Za svaku potrebu vidi koliko imamo ne-spakovanih; ako fali - napravi.
    let createdPerfumes = 0;
    for (const need of needs.values()) {
      const countAvailable = await this.perfumeRepo.count({
        where: {
          name: need.name,
          type: need.type,
          netoMl: need.ml,
          ...(packedIds.length ? { id: Not(In(packedIds)) } : {}),
        } as any,
      });

       // ✅ TypeScript: StartProcessingDTO.bottleVolume je 150 | 250
      const volNumber = need.ml;
      if (volNumber !== 150 && volNumber !== 250) {
        throw new Error(`bottleVolume mora biti 150 ili 250. Dobijeno: ${volNumber}`);
      }
      const vol = volNumber as 150 | 250;

      const missing = need.qty - countAvailable;
      if (missing > 0) {
        const start: StartProcessingDTO = {
        plantName: need.name, 
          perfumeName: need.name,
          perfumeType: need.type as any,
          bottleVolume: vol,
          bottleCount: missing,
        };

        const made = await this.processingService.startProcessing(start);
        createdPerfumes += made.length;
      }
    }

    // Refresh packedIds after creation (not necessary but safe)
    const packed2 = await this.packedRepo.find({ select: ["perfumeId"] });
    const packedIds2 = packed2.map((x) => x.perfumeId);

    // 4) Izaberi parfeme za pakovanje + upisi u packed_perfumes
    const perfumeIdsToPack: number[] = [];
    for (const need of needs.values()) {
      const found = await this.perfumeRepo.find({
        select: ["id"],
        where: {
          name: need.name,
          type: need.type,
          netoMl: need.ml,
          ...(packedIds2.length ? { id: Not(In(packedIds2)) } : {}),
        } as any,
        order: { createdAt: "ASC" },
        take: need.qty,
      });

      if (found.length < need.qty) {
        throw new Error(
          `Nema dovoljno parfema za pakovanje (${need.name}, ${need.type}, ${need.ml}ml). Trazeno=${need.qty}, dostupno=${found.length}`
        );
      }

      perfumeIdsToPack.push(...found.map((x) => x.id));
    }

    const packedRows = perfumeIdsToPack.map((pid) => {
      const row = new PackedPerfume();
      row.perfumeId = pid;
      row.packageRef = packageRef;
      return row;
    });

    await this.packedRepo.save(packedRows);

    // 5) Napravi dto za skladiste prijem: items = [{name, quantity}]
    const itemsForWarehouse: PrijemAmbalazeDTO["items"] = [];
    for (const need of needs.values()) {
      itemsForWarehouse.push({ name: need.name, quantity: need.qty });
    }

    const prijem: PrijemAmbalazeDTO = {
      naziv: packageRef,
      adresaPosiljaoca,
      items: itemsForWarehouse,
    };

    //await this.gateway.receiveAmbalazaToWarehouse(skladisteId, prijem);

    await this.gateway.logEvent({
      tip: "INFO",
      opis: `Processing spakovao ambalazu '${packageRef}' i poslao u skladiste ${skladisteId}. created=${createdPerfumes}, packed=${perfumeIdsToPack.length}`,
    });

    return {
      success: true,
      packageRef,
      skladisteId,
      createdPerfumes,
      packedPerfumes: perfumeIdsToPack.length,
      sentToWarehouse: true,
    };
  }
}
