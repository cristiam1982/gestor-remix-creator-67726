import { useEffect, useRef, useState } from "react";
import { PropertyData, AliadoConfig, ContentType } from "@/types/property";
import { TemplateTheme, TEMPLATE_THEMES } from "@/types/templates";
import { Home, Bed, Bath, Car, MapPin, Square, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CanvasPreviewProps {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  contentType: ContentType;
  template?: TemplateTheme;
  onReady?: () => void;
}

export const CanvasPreview = ({ propertyData, aliadoConfig, contentType, template = "residencial", onReady }: CanvasPreviewProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const templateConfig = TEMPLATE_THEMES[template];
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const hasMultiplePhotos = propertyData.fotos && propertyData.fotos.length > 1;

  useEffect(() => {
    if (onReady) {
      onReady();
    }
  }, [onReady]);

  const isStory = contentType === "historia";
  const dimensions = isStory ? "aspect-[9/16]" : "aspect-square";
  const primaryColor = templateConfig.colors.primary;

  const handlePrevPhoto = () => {
    if (propertyData.fotos && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const handleNextPhoto = () => {
    if (propertyData.fotos && currentPhotoIndex < propertyData.fotos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const renderPropertyIcons = () => {
    const icons = [];
    
    if (propertyData.habitaciones) {
      icons.push(
        <div key="hab" className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-lg">
          <Bed className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">{propertyData.habitaciones}</span>
        </div>
      );
    }
    
    if (propertyData.banos) {
      icons.push(
        <div key="ban" className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-lg">
          <Bath className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">{propertyData.banos}</span>
        </div>
      );
    }
    
    if (propertyData.parqueaderos) {
      icons.push(
        <div key="par" className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-lg">
          <Car className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">{propertyData.parqueaderos}</span>
        </div>
      );
    }
    
    if (propertyData.area) {
      icons.push(
        <div key="area" className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-lg">
          <Square className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">{propertyData.area}m²</span>
        </div>
      );
    }

    return icons;
  };

  return (
    <div 
      ref={canvasRef}
      id="canvas-preview"
      className={`relative ${dimensions} w-full max-w-[540px] mx-auto overflow-hidden ${templateConfig.style.borderRadius} ${templateConfig.style.shadow}`}
      style={{ backgroundColor: primaryColor }}
    >
      {/* Foto principal con navegación */}
      {propertyData.fotos && propertyData.fotos.length > 0 && (
        <div className="absolute inset-0">
          <img 
            src={propertyData.fotos[currentPhotoIndex]} 
            alt={`Propiedad ${currentPhotoIndex + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
          
          {/* Photo navigation */}
          {hasMultiplePhotos && (
            <>
              {/* Arrows */}
              {currentPhotoIndex > 0 && (
                <Button
                  onClick={handlePrevPhoto}
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              )}
              {currentPhotoIndex < propertyData.fotos.length - 1 && (
                <Button
                  onClick={handleNextPhoto}
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              )}
              
              {/* Dots indicator */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {propertyData.fotos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPhotoIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentPhotoIndex 
                        ? "bg-white w-6" 
                        : "bg-white/50"
                    }`}
                    aria-label={`Ver foto ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Header con logo del aliado */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 bg-white/95 px-4 py-3 rounded-xl shadow-lg">
          {aliadoConfig.logo && (
            <img 
              src={aliadoConfig.logo} 
              alt={aliadoConfig.nombre}
              className="w-10 h-10 object-contain"
            />
          )}
          <div>
            <p className={`font-bold text-sm ${templateConfig.fonts.heading}`} style={{ color: primaryColor }}>
              {aliadoConfig.nombre}
            </p>
            <p className="text-xs text-muted-foreground">{aliadoConfig.ciudad}</p>
          </div>
        </div>
      </div>

      {/* Información principal */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className={`text-2xl mb-1 ${templateConfig.fonts.heading}`} style={{ color: primaryColor }}>
                {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
              </h2>
              {propertyData.ubicacion && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{propertyData.ubicacion}</span>
                </div>
              )}
            </div>
            {propertyData.canon && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Canon mensual</p>
                <p className={`text-2xl ${templateConfig.fonts.heading}`} style={{ color: primaryColor }}>
                  {propertyData.canon}
                </p>
              </div>
            )}
            {propertyData.valorVenta && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Valor venta</p>
                <p className={`text-2xl ${templateConfig.fonts.heading}`} style={{ color: primaryColor }}>
                  {propertyData.valorVenta}
                </p>
              </div>
            )}
          </div>

          {/* Iconos de atributos */}
          <div className="flex flex-wrap gap-2">
            {renderPropertyIcons()}
          </div>

          {/* WhatsApp */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className={`text-sm ${templateConfig.fonts.body}`} style={{ color: primaryColor }}>
              📱 WhatsApp: {aliadoConfig.whatsapp}
            </p>
          </div>
        </div>
      </div>

      {/* Logo El Gestor (marca de agua) */}
      <div className="absolute bottom-4 right-4 z-20 opacity-70">
        <div className="bg-white/90 px-3 py-2 rounded-lg">
          <p className="text-xs font-bold text-primary">El Gestor</p>
        </div>
      </div>
    </div>
  );
};
