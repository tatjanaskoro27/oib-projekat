import { Perfume } from "../models/Perfume";
import { StartProcessingDTO } from "../DTOs/StartProcessingDTO";
import { GetPerfumesDTO } from "../DTOs/GetPerfumesDTO";

export interface IProcessingService {
  startProcessing(dto: StartProcessingDTO): Promise<Perfume[]>;
  getPerfumes(dto: GetPerfumesDTO): Promise<Perfume[]>;
}
