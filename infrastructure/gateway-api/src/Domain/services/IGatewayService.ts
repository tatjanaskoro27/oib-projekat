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

import { MesecnaProdajaDTO } from "../DTOs/analytics/MesecnaProdajaDTO";
import { GodisnjaProdajaDTO } from "../DTOs/analytics/GodisnjaProdajaDTO";
import { TopKolicinaDTO } from "../DTOs/analytics/TopKolicinaDTO";
import { KolicinaNedeljnaDTO } from "../DTOs/analytics/KolicinaNedeljnoDTO";
import { KolicinaMesecnaDTO } from "../DTOs/analytics/KolicinaMesecnoDTO";
import { KolicinaGodisnjaDTO } from "../DTOs/analytics/KolicinaGodisnjaDTO";

//
import { CreatePlantDTO, HarvestPlantsDTO, UpdateOilStrengthDTO } from "../DTOs/production/PlantDTOs";
import { PlantResponse, HarvestResponse, AvailableCountResponse } from "../DTOs/production/PlantTypes";
import { GetPlantsParams } from "../DTOs/production/GetPlantsParams";

import { StartProcessingDTO, GetPerfumesDTO } from "../DTOs/processing/ProcessingDTOs";
import { PerfumeResponse } from "../DTOs/processing/PerfumeTypes";

//dogadjaji
import { DogadjajDTO } from "../DTOs/dogadjaji/DogadjajDTO";
import { CreateDogadjajDTO } from "../DTOs/dogadjaji/CreateDogadjajDTO";
import { UpdateDogadjajDTO } from "../DTOs/dogadjaji/UpdateDogadjajDTO";
import { TipDogadjaja } from "../DTOs/dogadjaji/TipDogadjaja";



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
  getProdajaMesecna(godina: number): Promise<MesecnaProdajaDTO[]>;
  getProdajaGodisnja(godina: number): Promise<GodisnjaProdajaDTO>;
  getTop10Kolicina(): Promise<TopKolicinaDTO[]>;
  getKolicinaNedeljna(start: string, end: string): Promise<KolicinaNedeljnaDTO>;
  getKolicinaMesecna(godina: number): Promise<KolicinaMesecnaDTO[]>;
  getKolicinaGodisnja(godina: number): Promise<KolicinaGodisnjaDTO>;
  getUkupnoKomada(): Promise<UkupnoKomadaDTO>;

  getTop10Prihod(): Promise<TopPrihodDTO[]>;
  getTop10PrihodUkupno(): Promise<UkupanPrihodTop10DTO>;

  // Production
  plant(dto: CreatePlantDTO): Promise<PlantResponse>;
  updatePlantOilStrength(id: number, dto: UpdateOilStrengthDTO): Promise<PlantResponse>;
  harvestPlants(dto: HarvestPlantsDTO): Promise<HarvestResponse>;
  getAvailablePlantCount(name: string): Promise<AvailableCountResponse>;
  getPlants(params?: GetPlantsParams): Promise<PlantResponse[]>;
  getPlantById(id: number): Promise<PlantResponse>;


  // Processing
  startProcessing(dto: StartProcessingDTO): Promise<PerfumeResponse[]>;
  getPerfumes(dto: GetPerfumesDTO): Promise<PerfumeResponse[]>;

  //Dogadjaji
  getDogadjaji(): Promise<DogadjajDTO[]>;
  getDogadjajiByTip(tip: TipDogadjaja): Promise<DogadjajDTO[]>;
  createDogadjaj(dto: CreateDogadjajDTO): Promise<DogadjajDTO>;
  updateDogadjaj(id: number, dto: UpdateDogadjajDTO): Promise<DogadjajDTO>;
  deleteDogadjaj(id: number): Promise<{ deleted: true }>;

    // Sales
  getSalesPerfumes(): Promise<any>;
  salesPurchase(dto: any): Promise<any>;

}
