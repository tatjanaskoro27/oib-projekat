import { IStrategijaSkladista } from "../Domain/services/IStrategijaSkladista";

export class StrategijaMagacinskogCentra implements IStrategijaSkladista {
  naziv(): string {
    return "MAGACINSKI_CENTAR";
  }
  maxAmbalazaPoSlanju(): number {
    return 1;
  }
  kasnjenjeMs(): number {
    return 2500;
  }
}
