import { useEffect, useRef, useState, useMemo } from "react";
import { PropertyData, AliadoConfig, ContentType, LogoSettings, TextCompositionSettings, VisualLayers, FirstPhotoConfig } from "@/types/property";
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
  firstPhotoConfig?: FirstPhotoConfig; // Configuración especial primera foto
  mode?: 'preview' | 'capture'; // Modo de renderizado
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
  firstPhotoConfig, // Configuración especial primera foto
  mode = 'preview' // Modo de renderizado
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

  // Escalas de texto dinámicas con multiplicador para captura
  const textStyle = useMemo(() => {
    const baseScale = 1 + (effectiveTextComposition.typographyScale / 100);
    const baseBadgeScale = 1 + (effectiveTextComposition.badgeScale / 100);
    
    // Multiplicadores para modo captura (1080x1080) vs preview (~540px)
    const captureMultiplier = mode === 'capture' ? 2.0 : 1;
    const captureBadgeMultiplier = mode === 'capture' ? 2.0 : 1;
    
    const scale = baseScale * captureMultiplier;
    const badgeScale = baseBadgeScale * captureBadgeMultiplier;
    
    return { scale, badgeScale };
  }, [effectiveTextComposition, mode]);

  // Map vertical spacing to pixel values con ajuste para captura
  const spacingMap = {
    compact: 4,
    normal: 8,
    spacious: 16
  };
  const gapBase = spacingMap[effectiveTextComposition.verticalSpacing];
  const verticalGap = mode === 'capture' ? gapBase * 2.0 : gapBase;

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

  // Tamaño del logo "El Gestor" proporcional al escalado de texto
  const elGestorLogoSize = useMemo(() => {
    const baseSize = isStory ? 40 : 32; // Base: 40px historia, 32px post
    const multiplier = mode === 'capture' ? 2.0 : 1; // Mismo multiplier que texto
    return baseSize * multiplier; // 80px capture historia, 64px capture post
  }, [isStory, mode]);
  
  // Estilos dinámicos según modo
  const containerStyle = mode === 'capture' 
    ? {
        width: '1080px',
        height: isStory ? '1920px' : '1080px',
        backgroundColor: '#000',
        position: 'relative' as const,
        overflow: 'hidden' as const,
        borderRadius: '0px'
      }
    : {};
  
  const containerClasses = mode === 'capture'
    ? 'relative'
    : `relative ${isStory ? "aspect-story" : "aspect-square"} w-full ${isStory ? "max-w-[360px]" : "max-w-[540px]"} mx-auto overflow-hidden rounded-2xl shadow-2xl`;

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

  // Ocultar navegación en modo captura
  const showNavigation = hasMultiplePhotos && mode === 'preview';

  return (
    <div 
      ref={canvasRef}
      id={mode === 'capture' ? undefined : "canvas-preview"}
      className={containerClasses}
      style={mode === 'capture' ? containerStyle : { backgroundColor: "#000" }}
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
            opacity: logoStyle.opacity,
            transform: mode === 'capture' ? 'scale(2.0)' : 'none',
            transformOrigin: logoSettings.position === 'top-right' ? 'top right' : 'top left'
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
      <div className="absolute bottom-4 left-4 right-4 pr-20 pb-8 z-30">
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
                  <MapPin className={mode === 'capture' ? "w-5 h-5" : "w-4 h-4"} style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
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
                paddingLeft: `${mode === 'capture' ? 22 : 16}px`,
                paddingRight: `${mode === 'capture' ? 22 : 16}px`,
                paddingTop: `${mode === 'capture' ? 11 : 8}px`,
                paddingBottom: `${mode === 'capture' ? 11 : 8}px`
              }}
            >
              <p 
                className="text-white font-semibold uppercase tracking-wide relative z-[70]"
                style={{ 
                  fontSize: `${mode === 'capture' ? 14 : 10}px`,
                  marginBottom: `${mode === 'capture' ? 3 : 2}px`
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
                <Bed className={mode === 'capture' ? "w-6 h-6" : "w-5 h-5"} style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
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
                <Bath className={mode === 'capture' ? "w-6 h-6" : "w-5 h-5"} style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
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
                <Car className={mode === 'capture' ? "w-6 h-6" : "w-5 h-5"} style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
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
                <Square className={mode === 'capture' ? "w-6 h-6" : "w-5 h-5"} style={{ color: 'white', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
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
          bottom: isStory ? '96px' : (mode === 'capture' ? '24px' : '16px'),
          right: mode === 'capture' ? '24px' : '16px'
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