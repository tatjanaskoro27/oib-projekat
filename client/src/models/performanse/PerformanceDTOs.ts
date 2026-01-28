export type PerformanceReportDTO = {
  id: number;
  nazivIzvestaja: string;
  algoritam: string;
  rezultatiJson: string; // backend čuva string
  zakljucak: string;
  datumKreiranja: string; // dolazi kao string u JSON-u
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
