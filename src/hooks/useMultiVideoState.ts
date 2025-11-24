import { useState } from "react";
import { LogoSettings, TextCompositionSettings, VisualLayers } from "@/types/property";

interface VideoInfo {
  id: string;
  url: string;
  file: File;
  duration: number;
  subtitle?: string;
}

interface FooterCustomization {
  showElGestorLogo: boolean;
  customPhone?: string;
  customHashtag?: string;
  customTypeText?: string;
  customLocationText?: string;
}

export const useMultiVideoState = () => {
  const [multiVideos, setMultiVideos] = useState<VideoInfo[]>([]);
  const [isProcessingMultiVideo, setIsProcessingMultiVideo] = useState(false);
  const [multiVideoProgress, setMultiVideoProgress] = useState(0);
  const [multiVideoStage, setMultiVideoStage] = useState("");
  const [generatedMultiVideoBlob, setGeneratedMultiVideoBlob] = useState<Blob | null>(null);

  const [multiVideoLogoSettings, setMultiVideoLogoSettings] = useState<LogoSettings>({
    position: 'top-right',
    opacity: 100,
    background: 'elevated',
    size: 'medium',
    shape: 'rounded'
  });

  const [multiVideoTextComposition, setMultiVideoTextComposition] = useState<TextCompositionSettings>({
    typographyScale: 0,
    badgeScale: 0,
    badgeStyle: 'rounded',
    verticalSpacing: 'normal'
  });

  const [multiVideoVisualLayers, setMultiVideoVisualLayers] = useState<VisualLayers>({
    showPhoto: true,
    showPrice: true,
    showBadge: true,
    showIcons: true,
    showAllyLogo: true,
    showCTA: true
  });

  const [multiVideoGradientDirection, setMultiVideoGradientDirection] = useState<'none' | 'top' | 'bottom' | 'both'>('bottom');
  const [multiVideoGradientIntensity, setMultiVideoGradientIntensity] = useState(60);

  const [multiVideoFooterCustomization, setMultiVideoFooterCustomization] = useState<FooterCustomization>({
    showElGestorLogo: true,
    customPhone: '',
    customHashtag: '',
    customTypeText: '',
    customLocationText: ''
  });

  const resetMultiVideoState = () => {
    setMultiVideos([]);
    setGeneratedMultiVideoBlob(null);
    setIsProcessingMultiVideo(false);
    setMultiVideoProgress(0);
    setMultiVideoStage("");
  };

  return {
    multiVideos,
    setMultiVideos,
    isProcessingMultiVideo,
    setIsProcessingMultiVideo,
    multiVideoProgress,
    setMultiVideoProgress,
    multiVideoStage,
    setMultiVideoStage,
    generatedMultiVideoBlob,
    setGeneratedMultiVideoBlob,
    multiVideoLogoSettings,
    setMultiVideoLogoSettings,
    multiVideoTextComposition,
    setMultiVideoTextComposition,
    multiVideoVisualLayers,
    setMultiVideoVisualLayers,
    multiVideoGradientDirection,
    setMultiVideoGradientDirection,
    multiVideoGradientIntensity,
    setMultiVideoGradientIntensity,
    multiVideoFooterCustomization,
    setMultiVideoFooterCustomization,
    resetMultiVideoState
  };
};

export type { VideoInfo, FooterCustomization };
