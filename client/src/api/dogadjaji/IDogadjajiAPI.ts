import { DogadjajDTO } from "../../models/dogadjaji/DogadjajDTO";
import { TipDogadjaja } from "../../models/dogadjaji/TipDogadjaja";

export interface IDogadjajiAPI {
  getDogadjaji(token: string): Promise<DogadjajDTO[]>;
  getDogadjajiByTip(token: string, tip: TipDogadjaja): Promise<DogadjajDTO[]>;
}
