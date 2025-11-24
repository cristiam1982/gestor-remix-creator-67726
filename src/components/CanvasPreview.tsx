import { useEffect, useRef, useState, useMemo } from "react";
import { PropertyData, AliadoConfig, ContentType, LogoSettings, TextCompositionSettings, VisualLayers, FirstPhotoConfig } from "@/types/property";
import { StoryGalleryLayout } from "@/components/StoryGalleryLayout";
import { TemplateTheme, TEMPLATE_THEMES } from "@/types/templates";
import { Bed, Bath, Car, MapPin, Square, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrecioColombia } from "@/utils/formatters";
import { useLogoStyles } from "@/hooks/useLogoStyles";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";

interface CanvasPreviewProps {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  contentType: ContentType;
  template?: TemplateTheme;
  onReady?: () => void;
  currentPhotoIndexOverride?: number;
  logoSettings?: LogoSettings;
  textComposition?: TextCompositionSettings;
  visualLayers?: VisualLayers;
  gradientDirection?: 'none' | 'top' | 'bottom' | 'both';
  gradientIntensity?: number;
  firstPhotoConfig?: FirstPhotoConfig;
}

export const CanvasPreview = ({ 
  propertyData, 
  aliadoConfig, 
  contentType, 
  template = "residencial", 
  onReady, 
  currentPhotoIndexOverride,
  logoSettings = {
    position: 'top-right',
    size: 'medium',
    opacity: 100,
    background: 'elevated',
    shape: 'rounded'
  },
  textComposition = {
    typographyScale: 0,
    badgeScale: 0,
    badgeStyle: 'rounded',
    verticalSpacing: 'normal'
  },
  visualLayers = {
    showPrice: true,
    showBadge: true,
    showIcons: true,
    showAllyLogo: true,
    showCTA: true,
    showPhoto: true
  },
  gradientDirection = 'both',
  gradientIntensity = 60,
  firstPhotoConfig
}: CanvasPreviewProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const templateConfig = TEMPLATE_THEMES[template];
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const activePhotoIndex = currentPhotoIndexOverride !== undefined ? currentPhotoIndexOverride : currentPhotoIndex;
  const hasMultiplePhotos = propertyData.fotos && propertyData.fotos.length > 1;

  // Estilos dinámicos del logo
  const logoStyle = useLogoStyles(logoSettings);
  const logoUrl = aliadoConfig.logo;

  // PRIMERA FOTO: Aplicar configuración especial si activePhotoIndex === 0
  const isFirstPhoto = activePhotoIndex === 0;
  const effectiveVisualLayers = useMemo(() => {
    if (!isFirstPhoto || !firstPhotoConfig) return visualLayers;

    let layers = { ...visualLayers };

    // Aplicar showAllyLogo de primera foto si está definido
    if (firstPhotoConfig.showAllyLogo !== undefined) {
      layers.showAllyLogo = firstPhotoConfig.showAllyLogo;
    }

    // Aplicar configuración individual de elementos visibles en primera foto
    layers.showPrice = firstPhotoConfig.showPrice;
    layers.showIcons = firstPhotoConfig.showIcons;

    return layers;
  }, [isFirstPhoto, firstPhotoConfig, visualLayers]);

  const effectiveTextComposition = useMemo(() => {
    if (!isFirstPhoto || !firstPhotoConfig || firstPhotoConfig.textScaleOverride === undefined) {
      return textComposition;
    }

    // Aplicar textScaleOverride de primera foto
    return {
      ...textComposition,
      typographyScale: firstPhotoConfig.textScaleOverride
    };
  }, [isFirstPhoto, firstPhotoConfig, textComposition]);

  // Escalas de texto unificadas (sin multiplicadores por modo)
  const textStyle = useMemo(() => {
    const scale = 1 + (effectiveTextComposition.typographyScale / 100);
    const badgeScale = 1 + (effectiveTextComposition.badgeScale / 100);
    
    return { scale, badgeScale };
  }, [effectiveTextComposition]);

  // Map vertical spacing to pixel values con ajuste para captura
  const spacingMap = {
    compact: 4,
    normal: 8,
    spacious: 16
  };
  const gapBase = spacingMap[effectiveTextComposition.verticalSpacing];
  const verticalGap = gapBase; // Mismo valor en preview y capture

  // Gradiente dinámico
  const gradientOverlayStyle = useMemo(() => {
    if (gradientDirection === 'none') return {};
    
    // Validar que gradientIntensity sea un número válido
    const safeIntensity = typeof gradientIntensity === 'number' && !isNaN(gradientIntensity) 
      ? gradientIntensity 
      : 60; // valor por defecto
    
    const intensity = Math.max(0, Math.min(100, safeIntensity));
    const alpha = (intensity / 100) * 0.7;
    const rgba = (a: number) => `rgba(0,0,0,${a.toFixed(3)})`;
    
    if (gradientDirection === 'top') {
      return { background: `linear-gradient(to bottom, ${rgba(alpha)} 0%, ${rgba(0)} 60%)` };
    }
    if (gradientDirection === 'bottom') {
      return { background: `linear-gradient(to top, ${rgba(alpha)} 0%, ${rgba(0)} 60%)` };
    }
    // both
    return {
      background: `linear-gradient(to bottom, ${rgba(alpha)} 0%, ${rgba(0)} 60%), linear-gradient(to top, ${rgba(alpha)} 0%, ${rgba(0)} 60%)`
    };
  }, [gradientDirection, gradientIntensity]);

  // Precio robusto para todas las vistas
  const sanitizeNumber = (v?: string | number) => {
    if (v === undefined || v === null) return null;
    const s = typeof v === "number" ? v.toString() : v;
    const digits = s.replace(/\D/g, "");
    if (!digits) return null;
    const n = parseInt(digits, 10);
    return isNaN(n) ? null : n;
  };
  const canonNum = sanitizeNumber(propertyData.canon as any);
  const ventaNum = sanitizeNumber(propertyData.valorVenta as any);
  const hasPrice = canonNum !== null || ventaNum !== null;
  const isVenta = propertyData.modalidad === "venta";
  const chosenPrice = isVenta ? (ventaNum ?? canonNum) : (canonNum ?? ventaNum);
  const priceText = chosenPrice !== null ? formatPrecioColombia(chosenPrice) : "";

  if (import.meta.env.DEV) {
    // Debug solo en desarrollo
    console.debug("[CanvasPreview] price debug", { canonNum, ventaNum, chosenPrice, isVenta, contentType });
  }

  useEffect(() => {
    if (onReady) {
      onReady();
    }
  }, [onReady]);

  const isStory = contentType === "historia";
  
  // Detectar si se debe usar layout Gallery
  const storyLayout = propertyData.storyLayout || "overlay";
  const useGalleryLayout = isStory && storyLayout === "gallery";

  // Tamaño del logo "El Gestor" unificado (reducido 10%)
  const elGestorLogoSize = useMemo(() => {
    return isStory ? 36 : 29;
  }, [isStory]);

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

  const showNavigation = hasMultiplePhotos;

  // Si es historia con layout Gallery, renderizar el componente Gallery
  if (useGalleryLayout && propertyData.fotos && propertyData.fotos.length >= 3) {
    return (
      <StoryGalleryLayout 
        propertyData={propertyData}
        aliadoConfig={aliadoConfig}
        activePhotoIndex={activePhotoIndex}
        logoSettings={logoSettings}
      />
    );
  }

  // Layout overlay original (default)
  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-black"
    >
      {/* Foto principal con navegación */}
      {propertyData.fotos && propertyData.fotos.length > 0 && (
        <div className="absolute inset-0">
          <img 
            src={propertyData.fotos[activePhotoIndex]} 
            alt={`Propiedad ${activePhotoIndex + 1}`}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
          <div className="absolute inset-0" style={gradientOverlayStyle} />
          
          {/* Photo navigation */}
          {showNavigation && (
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
      {effectiveVisualLayers.showAllyLogo && (
        <div 
          className={`absolute ${logoStyle.positionClass} z-20`}
          style={{ 
            width: logoStyle.size,
            height: logoStyle.size,
            opacity: logoStyle.opacity
          }}
        >
        <div 
          className={`${logoStyle.backgroundClass} ${logoStyle.shapeClass} ${logoSettings.shape === 'circle' || logoSettings.background === 'none' ? 'p-0' : 'p-2.5'} w-full h-full flex items-center justify-center overflow-hidden`}
        >
          <img 
            src={logoUrl}
            alt={aliadoConfig.nombre}
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      )}

      {/* Información inferior - diseño reel minimalista */}
      {(
      <div className="absolute bottom-4 left-4 right-4 pr-24 pb-20 z-30">
        <div className="space-y-2">
          {/* Título y ubicación - condicionado a firstPhotoConfig */}
          {(!isFirstPhoto || !firstPhotoConfig || firstPhotoConfig.showTitle) && (
            <div style={{ marginBottom: `${verticalGap * 2}px` }}>
              <h2 
                className="font-bold text-white"
                style={{ 
                  fontSize: `${24 * textStyle.scale}px`,
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  marginBottom: `${verticalGap / 2}px`
                }}
              >
                {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
              </h2>
              {propertyData.ubicacion && (
                <div className="flex items-center" style={{ gap: `${verticalGap / 2}px` }}>
                  <MapPin className="w-4 h-4" style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
                  <span 
                    className="font-semibold text-white"
                    style={{ 
                      fontSize: `${16 * textStyle.scale}px`,
                      textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                    }}
                  >
                    {propertyData.ubicacion}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Precio destacado - fondo opaco sin sombras */}
          {hasPrice && effectiveVisualLayers.showPrice && (
            <div 
              data-canon-value={priceText}
              className="inline-block rounded-xl z-[60] ring-2 ring-white/70"
              style={{ 
                backgroundColor: aliadoConfig.colorPrimario,
                marginBottom: `${verticalGap * 2}px`,
                paddingLeft: '16px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px'
              }}
            >
              <p 
                className="text-white font-semibold uppercase tracking-wide relative z-[70]"
                style={{ 
                  fontSize: '10px',
                  marginBottom: '2px'
                }}
              >
                {isVenta ? "Precio de Venta" : "Canon Mensual"}
              </p>
              <p 
                className="font-extrabold text-white leading-tight relative z-[70]"
                style={{ 
                  fontSize: `${24 * textStyle.scale}px`,
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }}
              >
                {priceText}
              </p>
            </div>
          )}

          {/* Iconos de atributos con fondo más opaco */}
          {effectiveVisualLayers.showIcons && (
          <div className="flex flex-wrap" style={{ gap: `${verticalGap / 2}px` }}>
            {propertyData.habitaciones && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <Bed className="w-5 h-5" style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
                <span 
                  className="font-semibold text-white"
                  style={{ 
                    fontSize: `${14 * textStyle.scale}px`,
                    textShadow: '1px 1px 3px rgba(0,0,0,0.6)' 
                  }}
                >
                  {propertyData.habitaciones}
                </span>
              </div>
            )}
            
            {propertyData.banos && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <Bath className="w-5 h-5" style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
                <span 
                  className="font-semibold text-white"
                  style={{ 
                    fontSize: `${14 * textStyle.scale}px`,
                    textShadow: '1px 1px 3px rgba(0,0,0,0.6)' 
                  }}
                >
                  {propertyData.banos}
                </span>
              </div>
            )}
            
            {propertyData.parqueaderos && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <Car className="w-5 h-5" style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
                <span 
                  className="font-semibold text-white"
                  style={{ 
                    fontSize: `${14 * textStyle.scale}px`,
                    textShadow: '1px 1px 3px rgba(0,0,0,0.6)' 
                  }}
                >
                  {propertyData.parqueaderos}
                </span>
              </div>
            )}
            
            {propertyData.area && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <Square className="w-5 h-5" style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
                <span 
                  className="font-semibold text-white"
                  style={{ 
                    fontSize: `${14 * textStyle.scale}px`,
                    textShadow: '1px 1px 3px rgba(0,0,0,0.6)' 
                  }}
                >
                  {propertyData.area}m²
                </span>
              </div>
            )}
            
            {propertyData.estrato && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <span 
                  className="font-semibold text-white"
                  style={{ 
                    fontSize: `${14 * textStyle.scale}px`,
                    textShadow: '1px 1px 3px rgba(0,0,0,0.6)' 
                  }}
                >
                  🏢 Estrato {propertyData.estrato}
                </span>
              </div>
            )}
            
            {propertyData.piso && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <span 
                  className="font-semibold text-white"
                  style={{ 
                    fontSize: `${14 * textStyle.scale}px`,
                    textShadow: '1px 1px 3px rgba(0,0,0,0.6)' 
                  }}
                >
                  🏢 Piso {propertyData.piso}
                </span>
              </div>
            )}
            
            {propertyData.trafico && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <span 
                  className="font-semibold text-white"
                  style={{ 
                    fontSize: `${14 * textStyle.scale}px`,
                    textShadow: '1px 1px 3px rgba(0,0,0,0.6)' 
                  }}
                >
                  🚦 Tráfico {propertyData.trafico}
                </span>
              </div>
            )}
            
            {propertyData.alturaLibre && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <span 
                  className="font-semibold text-white"
                  style={{ 
                    fontSize: `${14 * textStyle.scale}px`,
                    textShadow: '1px 1px 3px rgba(0,0,0,0.6)' 
                  }}
                >
                  📏 {propertyData.alturaLibre}m altura
                </span>
              </div>
            )}
            
            {propertyData.vitrina && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <span 
                  className="font-semibold text-white"
                  style={{ 
                    fontSize: `${14 * textStyle.scale}px`,
                    textShadow: '1px 1px 3px rgba(0,0,0,0.6)' 
                  }}
                >
                  🪟 Con vitrina
                </span>
              </div>
            )}
            
            {propertyData.uso && (
              <div 
                className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg"
                style={{ 
                  backgroundColor: aliadoConfig.colorSecundario,
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <span 
                  className="font-semibold text-white"
                  style={{ 
                    fontSize: `${14 * textStyle.scale}px`,
                    textShadow: '1px 1px 3px rgba(0,0,0,0.6)' 
                  }}
                >
                  🏗️ Uso {propertyData.uso}
                </span>
              </div>
            )}
          </div>
          )}

        </div>
      </div>
      )}

      {/* Logo El Gestor - inferior derecha (marca secundaria) */}
      {(
      <div 
        className="absolute z-30"
        style={{
          bottom: isStory ? '96px' : '16px',
          right: '16px'
        }}
      >
        <img 
          src={elGestorLogo} 
          alt="El Gestor" 
          data-eg-logo="true"
          className="object-contain drop-shadow-lg opacity-70"
          style={{
            height: `${elGestorLogoSize}px`
          }}
        />
      </div>
      )}
    </div>
  );
};