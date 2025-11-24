import { AllyData, PropertyData } from "../types/landing";
import { LandingTemplateId, LandingTheme } from "../templates/landingTemplates";
import { HeroSection } from "./sections/HeroSection";
import { GallerySection } from "./sections/GallerySection";
import { HighlightsSection } from "./sections/HighlightsSection";
import { VideoSection } from "./sections/VideoSection";
import { DescriptionSection } from "./sections/DescriptionSection";
import { AmenitiesSection } from "./sections/AmenitiesSection";
import { LocationSection } from "./sections/LocationSection";
import { AllyContactSection } from "./sections/AllyContactSection";
import { FooterBrandSection } from "./sections/FooterBrandSection";

type PremiumLandingViewProps = {
  ally: AllyData;
  property: PropertyData;
  template: LandingTemplateId;
  theme: LandingTheme;
};

export const PremiumLandingView = ({ 
  ally, 
  property,
  template,
  theme 
}: PremiumLandingViewProps) => {
  return (
    <div className={`min-h-screen ${theme.background}`}>
      <HeroSection ally={ally} property={property} theme={theme} />
      <GallerySection property={property} theme={theme} />
      <HighlightsSection property={property} theme={theme} />
      <VideoSection property={property} theme={theme} />
      <DescriptionSection property={property} theme={theme} />
      <AmenitiesSection property={property} theme={theme} />
      <LocationSection property={property} theme={theme} />
      <AllyContactSection ally={ally} property={property} theme={theme} />
      <FooterBrandSection ally={ally} theme={theme} />
    </div>
  );
};
