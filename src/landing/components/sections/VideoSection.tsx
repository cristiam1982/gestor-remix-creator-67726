import { PropertyData } from "../../types/landing";
import { LandingTheme } from "../../templates/landingTemplates";

type VideoSectionProps = {
  property: PropertyData;
  theme: LandingTheme;
};

export const VideoSection = ({ property, theme }: VideoSectionProps) => {
  const videoUrl = property.shortVideoUrl || property.longVideoUrl;

  if (!videoUrl) {
    return null;
  }

  return (
    <section className={`${theme.sectionSpacing} ${theme.background}`}>
      <div className="container mx-auto px-4">
        <h2 className={`text-3xl lg:text-4xl ${theme.headingFontClass} mb-8 text-foreground`}>
          Video del Inmueble
        </h2>

        <div className="max-w-4xl mx-auto">
          <div className={`relative aspect-video ${theme.borderRadius} overflow-hidden ${theme.shadow} bg-black`}>
            <video
              src={videoUrl}
              controls
              className="w-full h-full"
              playsInline
            >
              Tu navegador no soporta la reproducción de videos.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
};
