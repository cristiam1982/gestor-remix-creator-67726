import { PropertyData } from "../../types/landing";

type VideoSectionProps = {
  property: PropertyData;
};

export const VideoSection = ({ property }: VideoSectionProps) => {
  const videoUrl = property.shortVideoUrl || property.longVideoUrl;

  if (!videoUrl) {
    return null;
  }

  return (
    <section className="py-12 lg:py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-foreground">
          Video del Inmueble
        </h2>

        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black">
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
