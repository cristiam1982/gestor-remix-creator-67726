import { useState } from "react";
import { PropertyData, LogoSettings, TextCompositionSettings, VisualLayers, FirstPhotoConfig } from "@/types/property";

export const usePropertyState = () => {
  const [propertyData, setPropertyData] = useState<Partial<PropertyData>>({
    fotos: [],
    subtitulos: [],
    storyLayout: "overlay"
  });

  const [postLogoSettings, setPostLogoSettings] = useState<LogoSettings>({
    position: "top-right",
    size: "small",
    opacity: 90,
    background: "elevated",
    shape: "rounded"
  });

  const [postTextComposition, setPostTextComposition] = useState<TextCompositionSettings>({
    typographyScale: 1.0,
    badgeScale: 1.0,
    badgeStyle: "rounded",
    verticalSpacing: "normal"
  });

  const [postVisualLayers, setPostVisualLayers] = useState<VisualLayers>({
    showPhoto: true,
    showPrice: true,
    showBadge: true,
    showIcons: true,
    showAllyLogo: true,
    showCTA: true
  });

  const [postGradientDirection, setPostGradientDirection] = useState<"top" | "bottom" | "both" | "none">("both");
  const [postGradientIntensity, setPostGradientIntensity] = useState(60);

  const [postFirstPhotoConfig, setPostFirstPhotoConfig] = useState<FirstPhotoConfig>({
    showPrice: true,
    showTitle: true,
    showIcons: true,
    showCTA: true,
    textScaleOverride: 0,
    showAllyLogo: true
  });

  const resetPropertyState = () => {
    setPropertyData({ fotos: [], subtitulos: [], storyLayout: "overlay" });
  };

  return {
    propertyData,
    setPropertyData,
    postLogoSettings,
    setPostLogoSettings,
    postTextComposition,
    setPostTextComposition,
    postVisualLayers,
    setPostVisualLayers,
    postGradientDirection,
    setPostGradientDirection,
    postGradientIntensity,
    setPostGradientIntensity,
    postFirstPhotoConfig,
    setPostFirstPhotoConfig,
    resetPropertyState
  };
};
