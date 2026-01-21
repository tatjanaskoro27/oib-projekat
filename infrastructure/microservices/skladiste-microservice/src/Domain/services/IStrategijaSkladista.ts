export interface IStrategijaSkladista {
  naziv(): string;
  maxAmbalazaPoSlanju(): number; // 3 ili 1
  kasnjenjeMs(): number;         // 500 ili 2500
}
