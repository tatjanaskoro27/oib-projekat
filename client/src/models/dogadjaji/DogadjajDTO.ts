import { TipDogadjaja } from "./TipDogadjaja";

export interface DogadjajDTO {
  id: number;
  tip: TipDogadjaja;
  opis: string;
  datumVreme: string; // ISO string
}
