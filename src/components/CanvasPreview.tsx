import { useEffect, useRef, useState } from "react";
import { PropertyData, AliadoConfig, ContentType } from "@/types/property";
import { TemplateTheme, TEMPLATE_THEMES } from "@/types/templates";
import { Bed, Bath, Car, MapPin, Square, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";

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

  return (
    <div 
      ref={canvasRef}
      id="canvas-preview"
      className={`relative ${dimensions} w-full max-w-[540px] mx-auto overflow-hidden rounded-2xl shadow-2xl`}
      style={{ backgroundColor: "#000" }}
    >
      {/* Foto principal con navegación */}
      {propertyData.fotos && propertyData.fotos.length > 0 && (
        <div className="absolute inset-0">
          <img 
            src={propertyData.fotos[currentPhotoIndex]} 
            alt={`Propiedad ${currentPhotoIndex + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
          
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

      {/* Header con logo del aliado - diseño reel */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
        <img 
          src={logoRubyMorales} 
          alt={aliadoConfig.nombre}
          className={`${isStory ? "w-24 h-24" : "w-20 h-20"} rounded-xl border-2 border-white/80 object-contain bg-white/90 p-1`}
        />
        <div>
          <p className="text-sm font-semibold text-white drop-shadow-lg">
            {aliadoConfig.ciudad}
          </p>
        </div>
      </div>

      {/* Información inferior - diseño reel minimalista */}
      <div className="absolute bottom-6 left-6 right-6 pr-24 pb-12 z-20">
        <div className="space-y-3">
          {/* Título y ubicación */}
          <div>
            <h2 
              className="text-3xl font-bold mb-2 drop-shadow-lg text-white"
            >
              {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
            </h2>
            {propertyData.ubicacion && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-white drop-shadow-lg" />
                <span className="text-sm text-white drop-shadow-lg">{propertyData.ubicacion}</span>
              </div>
            )}
          </div>

          {/* Precio destacado - fondo opaco sin sombras */}
          {(propertyData.canon || propertyData.valorVenta) && (
            <div 
              data-canon-value={propertyData.canon || propertyData.valorVenta}
              className="inline-block px-5 py-3 rounded-xl z-[60] ring-2 ring-white/70"
              style={{ 
                backgroundColor: aliadoConfig.colorPrimario
              }}
            >
              <p className="text-xs text-white font-semibold mb-1 uppercase tracking-wide">
                {propertyData.canon ? "Canon mensual" : "Valor venta"}
              </p>
              <p className="text-3xl font-extrabold text-white leading-tight">
                {propertyData.canon || propertyData.valorVenta}
              </p>
            </div>
          )}

          {/* Iconos de atributos con fondo más opaco */}
          <div className="flex flex-wrap gap-2">
            {propertyData.habitaciones && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <Bed className="w-4 h-4 text-white drop-shadow-lg" />
                <span 
                  className="text-sm font-semibold text-white"
                  style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}
                >
                  {propertyData.habitaciones}
                </span>
              </div>
            )}
            
            {propertyData.banos && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <Bath className="w-4 h-4 text-white drop-shadow-lg" />
                <span 
                  className="text-sm font-semibold text-white"
                  style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}
                >
                  {propertyData.banos}
                </span>
              </div>
            )}
            
            {propertyData.parqueaderos && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <Car className="w-4 h-4 text-white drop-shadow-lg" />
                <span 
                  className="text-sm font-semibold text-white"
                  style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}
                >
                  {propertyData.parqueaderos}
                </span>
              </div>
            )}
            
            {propertyData.area && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <Square className="w-4 h-4 text-white drop-shadow-lg" />
                <span 
                  className="text-sm font-semibold text-white"
                  style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}
                >
                  {propertyData.area}m²
                </span>
              </div>
            )}
            
            {propertyData.estrato && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <span className="text-sm font-semibold text-white" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}>
                  🏢 Estrato {propertyData.estrato}
                </span>
              </div>
            )}
            
            {propertyData.piso && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <span className="text-sm font-semibold text-white" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}>
                  🏢 Piso {propertyData.piso}
                </span>
              </div>
            )}
            
            {propertyData.trafico && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <span className="text-sm font-semibold text-white" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}>
                  🚦 Tráfico {propertyData.trafico}
                </span>
              </div>
            )}
            
            {propertyData.alturaLibre && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <span className="text-sm font-semibold text-white" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}>
                  📏 {propertyData.alturaLibre}m altura
                </span>
              </div>
            )}
            
            {propertyData.vitrina && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <span className="text-sm font-semibold text-white" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}>
                  🪟 Con vitrina
                </span>
              </div>
            )}
            
            {propertyData.uso && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <span className="text-sm font-semibold text-white" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.6)' }}>
                  🏗️ Uso {propertyData.uso}
                </span>
              </div>
            )}
          </div>

          {/* WhatsApp */}
          <div className="flex items-center gap-2 text-white drop-shadow-lg">
            <span className="text-sm">📱 {aliadoConfig.whatsapp}</span>
          </div>
        </div>
      </div>

      {/* Logo El Gestor - inferior derecha (marca secundaria) */}
      <div className="absolute bottom-4 right-4 z-30">
        <img 
          src={elGestorLogo} 
          alt="El Gestor" 
          data-eg-logo="true"
          className={`${isStory ? "h-10" : "h-8"} object-contain drop-shadow-lg opacity-70`}
        />
      </div>
    </div>
  );
};