import { PropertyData, AliadoConfig } from "./property";

export interface MultiVideoConfig {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  videoUrls: string[];
  totalDuration: number;
}

export interface VideoInfo {
  url: string;
  duration: number;
  file?: File;
}

export interface FFmpegProgress {
  ratio: number;
  currentFrame: number;
  fps: number;
  stage: "loading" | "processing" | "finalizing" | "complete";
  message: string;
}
