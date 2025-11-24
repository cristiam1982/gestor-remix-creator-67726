import { useLandingState } from "../hooks/useLandingState";
import { PremiumLandingView } from "./PremiumLandingView";

export const LandingPreviewContainer = () => {
  const { ally, property } = useLandingState();

  return (
    <div className="w-full">
      <PremiumLandingView ally={ally} property={property} />
    </div>
  );
};
