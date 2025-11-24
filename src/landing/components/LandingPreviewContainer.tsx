import { useLandingState } from "../hooks/useLandingState";
import { PremiumLandingView } from "./PremiumLandingView";
import { LandingTemplateId, getLandingTheme } from "../templates/landingTemplates";

type LandingPreviewContainerProps = {
  selectedTemplate?: LandingTemplateId;
};

export const LandingPreviewContainer = ({ 
  selectedTemplate = "moderna" 
}: LandingPreviewContainerProps) => {
  const { ally, property } = useLandingState();
  
  const theme = getLandingTheme(selectedTemplate, ally.colors);

  return (
    <div className="w-full">
      <PremiumLandingView 
        ally={ally} 
        property={property}
        template={selectedTemplate}
        theme={theme}
      />
    </div>
  );
};
