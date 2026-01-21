export type TipDogadjaja = "INFO" | "WARNING" | "ERROR";

export interface CreateDogadjajDTO {
  tip: TipDogadjaja;
  opis: string;
}
