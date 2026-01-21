import { IStrategijaSkladista } from "../Domain/services/IStrategijaSkladista";

export class StrategijaDistributivnogCentra implements IStrategijaSkladista {
  naziv(): string {
    return "DISTRIBUTIVNI_CENTAR";
  }
  maxAmbalazaPoSlanju(): number {
    return 3;
  }
  kasnjenjeMs(): number {
    return 500;
  }
}
