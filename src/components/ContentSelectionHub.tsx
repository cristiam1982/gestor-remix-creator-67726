import { Square, Smartphone, Image as ImageIcon, Video, Film, CheckCircle, DollarSign } from "lucide-react";
import { ContentTypeCard } from "@/components/ContentTypeCard";
import { BrandedHeroSection } from "@/components/BrandedHeroSection";
import { MetricsPanel } from "@/components/MetricsPanel";
import { AliadoConfig, ContentType } from "@/types/property";

interface ContentSelectionHubProps {
  aliadoConfig: AliadoConfig;
  onContentTypeSelect: (type: ContentType) => void;
  onClearMetrics: () => void;
}

export const ContentSelectionHub = ({ 
  aliadoConfig, 
  onContentTypeSelect, 
  onClearMetrics 
}: ContentSelectionHubProps) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-6xl w-full animate-fade-in">
        <BrandedHeroSection aliadoConfig={aliadoConfig} />

        {/* Métricas */}
        <MetricsPanel onClearMetrics={onClearMetrics} />

        {/* Sección 1: Promoción de Inmuebles */}
        <section className="mt-10">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">🎨 Promoción de Inmuebles</h2>
            <p className="text-muted-foreground text-lg">
              Crea contenido profesional para arriendo o venta de propiedades
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ContentTypeCard
              icon={Square}
              title="Post"
              description="1:1 para feed de Instagram y Facebook"
              primaryColor={aliadoConfig.colorPrimario}
              secondaryColor={aliadoConfig.colorSecundario}
              onClick={() => onContentTypeSelect("post")}
            />
            <ContentTypeCard
              icon={Smartphone}
              title="Historia"
              description="9:16 para Stories de Instagram"
              primaryColor={aliadoConfig.colorPrimario}
              secondaryColor={aliadoConfig.colorSecundario}
              onClick={() => onContentTypeSelect("historia")}
            />
            <ContentTypeCard
              icon={ImageIcon}
              title="Reel con Fotos"
              description="Slideshow automático con música"
              primaryColor={aliadoConfig.colorPrimario}
              secondaryColor={aliadoConfig.colorSecundario}
              onClick={() => onContentTypeSelect("reel-fotos")}
            />
            <ContentTypeCard
              icon={Video}
              title="Reel con Video"
              description="Hasta 100 segundos de video"
              primaryColor={aliadoConfig.colorPrimario}
              secondaryColor={aliadoConfig.colorSecundario}
              onClick={() => onContentTypeSelect("reel-video")}
            />
            <ContentTypeCard
              icon={Film}
              title="Reel Multi-Video"
              description="Concatena 2-10 videos en un solo reel profesional"
              primaryColor={aliadoConfig.colorPrimario}
              secondaryColor={aliadoConfig.colorSecundario}
              onClick={() => onContentTypeSelect("reel-multi-video")}
            />
          </div>
        </section>

        {/* Sección 2: Generación de Confianza */}
        <section className="mt-12">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">💼 Generación de Confianza</h2>
            <p className="text-muted-foreground text-lg">
              Comparte tus éxitos para atraer nuevos propietarios y generar confianza
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ContentTypeCard
              icon={CheckCircle}
              title="Inmueble Arrendado"
              description="Celebra arriendos exitosos"
              primaryColor={aliadoConfig.colorPrimario}
              secondaryColor={aliadoConfig.colorSecundario}
              onClick={() => onContentTypeSelect("arrendado")}
            />
            <ContentTypeCard
              icon={DollarSign}
              title="Inmueble Vendido"
              description="Celebra ventas exitosas"
              primaryColor={aliadoConfig.colorPrimario}
              secondaryColor={aliadoConfig.colorSecundario}
              onClick={() => onContentTypeSelect("vendido")}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
