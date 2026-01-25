import { StartProcessingDTO } from "../../models/processing/StartProcessingDTO";
import { PerfumeDTO } from "../../models/processing/PerfumeDTO";
import { ProcessingResultDTO } from "../../models/processing/ProcessingResultDTO";

export interface IProcessingAPI {
  startProcessing(
    token: string,
    data: StartProcessingDTO,
  ): Promise<ProcessingResultDTO>;
  getPerfumes(token: string): Promise<PerfumeDTO[]>;
}
