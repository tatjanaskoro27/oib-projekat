import { Repository } from "typeorm";
import { Plant } from "../Domain/models/Plant";
import { IPlantsService } from "../Domain/services/IPlantsService";
import { CreatePlantDTO } from "../Domain/DTOs/CreatePlantDTO";
import { UpdatePlantDTO } from "../Domain/DTOs/UpdatePlantDTO";
import { PlantDTO } from "../Domain/DTOs/PlantDTO";

export class PlantsService implements IPlantsService {
  constructor(private repo: Repository<Plant>) {}

  async getAll(): Promise<PlantDTO[]> {
    const plants = await this.repo.find({ order: { createdAt: "DESC" } });
    return plants.map((p: Plant) => this.toDTO(p));
  }

  async getById(id: number): Promise<PlantDTO> {
    const plant = await this.repo.findOne({ where: { id } });
    if (!plant) throw new Error(`Plant with ID ${id} not found`);
    return this.toDTO(plant);
  }

  async create(data: CreatePlantDTO): Promise<PlantDTO> {
    if (!data.name || data.name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters long");
    }
    const existing = await this.repo.findOne({ where: { name: data.name } });
    if (existing) throw new Error("Plant with this name already exists");

    const entity = this.repo.create({
      name: data.name.trim(),
      species: data.species ?? null,
      price: Number(data.price ?? 0),
      stock: Number(data.stock ?? 0),
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
    });

    const saved = await this.repo.save(entity);
    return this.toDTO(saved);
  }

  async update(id: number, data: UpdatePlantDTO): Promise<PlantDTO> {
    const plant = await this.repo.findOne({ where: { id } });
    if (!plant) throw new Error(`Plant with ID ${id} not found`);

    if (data.name && data.name !== plant.name) {
      if (data.name.trim().length < 2)
        throw new Error("Name must be at least 2 characters long");
      const exists = await this.repo.findOne({ where: { name: data.name } });
      if (exists) throw new Error("Plant with this name already exists");
      plant.name = data.name.trim();
    }

    if (data.species !== undefined) plant.species = data.species;
    if (data.price !== undefined) plant.price = Number(data.price);
    if (data.stock !== undefined) plant.stock = Number(data.stock);
    if (data.description !== undefined) plant.description = data.description;
    if (data.imageUrl !== undefined) plant.imageUrl = data.imageUrl;

    const saved = await this.repo.save(plant);
    return this.toDTO(saved);
  }

  async delete(id: number): Promise<{ deleted: true }> {
    const plant = await this.repo.findOne({ where: { id } });
    if (!plant) throw new Error(`Plant with ID ${id} not found`);
    await this.repo.remove(plant);
    return { deleted: true };
  }

  private toDTO(p: Plant): PlantDTO {
    return {
      id: p.id,
      name: p.name,
      species: p.species,
      price: Number(p.price),
      stock: p.stock,
      description: p.description,
      imageUrl: p.imageUrl,
    };
  }
}
