import { AllyData, PropertyData } from "../types/landing";
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
};

export const PremiumLandingView = ({ ally, property }: PremiumLandingViewProps) => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection ally={ally} property={property} />
      <GallerySection property={property} />
      <HighlightsSection property={property} />
      <VideoSection property={property} />
      <DescriptionSection property={property} />
      <AmenitiesSection property={property} />
      <LocationSection property={property} />
      <AllyContactSection ally={ally} property={property} />
      <FooterBrandSection ally={ally} />
    </div>
  );
};
