export interface PrijemAmbalazeDTO {
  naziv: string;
  adresaPosiljaoca: string;
  perfumeIds: number[]; // mi ćemo u bazi čuvati kao JSON string
}
