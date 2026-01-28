import type {
  PerformanceReportDTO,
  SimulirajDTO,
} from "../../models/performanse/PerformanceDTOs";

export interface IPerformanceAPI {
  startSimulation(token: string, dto: SimulirajDTO): Promise<PerformanceReportDTO>;

  getReports(
    token: string,
    filter?: { algoritam?: string; od?: string; do?: string },
  ): Promise<PerformanceReportDTO[]>;

  getReportById(token: string, id: number): Promise<PerformanceReportDTO>;

  downloadPdf(token: string, id: number): Promise<{
    data: ArrayBuffer;
    filename: string;
  }>;
}
