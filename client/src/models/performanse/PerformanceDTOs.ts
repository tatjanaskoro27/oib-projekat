export type PerformanceReportDTO = {
  id: number;
  nazivIzvestaja: string;
  algoritam: string;
  rezultatiJson: string;
  zakljucak: string;
  datumKreiranja: string; 
};

export type SimulirajDTO = {
  algoritam: string;
  params?: {
    brojZahteva?: number;
    prosekLatencijeMs?: number;
    throughput?: number;
    stopaGreske?: number;
    seed?: number;
  };
};
