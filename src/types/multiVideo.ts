import { PropertyData, AliadoConfig, LogoSettings, TextCompositionSettings, VisualLayers } from "./property";

// Configuración visual del Multi-Video Reel
export interface MultiVideoVisualSettings {
  logoSettings: LogoSettings;
  textComposition: TextCompositionSettings;
  visualLayers: VisualLayers;
  gradientDirection: 'none' | 'top' | 'bottom' | 'both';
  gradientIntensity: number;
  footerCustomization?: {
    customPhone?: string;
    customHashtag?: string;
    showElGestorLogo: boolean;
    customTypeText?: string;
    customLocationText?: string;
  };
}

export interface MultiVideoConfig {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  videoUrls: string[];
  totalDuration: number;
  visualSettings?: MultiVideoVisualSettings;
}

export interface VideoInfo {
  url: string;
  duration: number;
  file?: File;
  subtitle?: string;
}

export interface FFmpegProgress {
  ratio: number;
  currentFrame: number;
  fps: number;
  stage: "loading" | "processing" | "finalizing" | "complete";
  message: string;
}
