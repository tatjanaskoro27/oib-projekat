export interface PrijemAmbalazeDTO {
  naziv: string;
  adresaPosiljaoca: string;
  items: { name: string; quantity: number }[];
}
