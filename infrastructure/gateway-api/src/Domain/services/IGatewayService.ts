import { CreateUserDTO } from "../DTOs/user/CreateUserDTO";
import { LoginUserDTO } from "../DTOs/user/LoginUserDTO";
import { RegistrationUserDTO } from "../DTOs/user/RegistrationUserDTO";
import { UpdateUserDTO } from "../DTOs/user/UpdateUserDTO";
import { UserDTO } from "../DTOs/user/UserDTO";
import { AuthResponseType } from "../types/AuthResponse";

//analitiks
import { UkupnaProdajaDTO } from "../DTOs/analytics/UkupnaProdajaDTO";
import { UkupnoKomadaDTO } from "../DTOs/analytics/UkupnoKomadaDTO";
import { NedeljnaProdajaDTO } from "../DTOs/analytics/NedeljnaProdajaDTO";
import { TrendProdajeDTO } from "../DTOs/analytics/TrendProdajeDTO";
import { TopPrihodDTO } from "../DTOs/analytics/TopPrihodDTO";
import { UkupanPrihodTop10DTO } from "../DTOs/analytics/UkupanPrihodTop10DTO";
import { RacunDTO } from "../DTOs/analytics/RacunDTO";
import { KreirajRacunDTO } from "../DTOs/analytics/KreirajRacunDTO";

//
import { CreatePlantDTO, HarvestPlantsDTO, UpdateOilStrengthDTO } from "../DTOs/production/PlantDTOs";
import { PlantResponse, HarvestResponse } from "../DTOs/production/PlantTypes";

import { StartProcessingDTO, GetPerfumesDTO } from "../DTOs/processing/ProcessingDTOs";
import { PerfumeResponse } from "../DTOs/processing/PerfumeTypes";



export interface IGatewayService {
  // Auth
  login(data: LoginUserDTO): Promise<AuthResponseType>;
  register(data: RegistrationUserDTO): Promise<AuthResponseType>;

  // Users
  getAllUsers(): Promise<UserDTO[]>;
  getUserById(id: number): Promise<UserDTO>;
  deleteUser(id: number): Promise<{ deleted: true }>;
  createUser(data: CreateUserDTO): Promise<UserDTO>;
  updateUser(id: number, data: UpdateUserDTO): Promise<UserDTO>;

  // Analytics
  getRacuni(): Promise<RacunDTO[]>;
  createRacun(data: KreirajRacunDTO): Promise<{ racunId: number; ukupanIznos: number }>;

  getUkupnaProdaja(): Promise<UkupnaProdajaDTO>;
  getProdajaNedeljna(start: string, end: string): Promise<NedeljnaProdajaDTO>;
  getTrendProdaje(start: string, end: string): Promise<TrendProdajeDTO[]>;

  getUkupnoKomada(): Promise<UkupnoKomadaDTO>;

  getTop10Prihod(): Promise<TopPrihodDTO[]>;
  getTop10PrihodUkupno(): Promise<UkupanPrihodTop10DTO>;

  // Production
  plant(dto: CreatePlantDTO): Promise<PlantResponse>;
  updatePlantOilStrength(id: number, dto: UpdateOilStrengthDTO): Promise<PlantResponse>;
  harvestPlants(dto: HarvestPlantsDTO): Promise<HarvestResponse>;

  // Processing
  startProcessing(dto: StartProcessingDTO): Promise<PerfumeResponse[]>;
  getPerfumes(dto: GetPerfumesDTO): Promise<PerfumeResponse[]>;


}
