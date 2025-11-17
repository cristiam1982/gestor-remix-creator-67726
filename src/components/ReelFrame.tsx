import { PropertyData, AliadoConfig, LogoSettings, TextCompositionSettings, VisualLayers, ReelTemplate, FirstPhotoConfig } from "@/types/property";
import { formatPrecioColombia } from "@/utils/formatters";
import { hexToRgba, isLightColor } from "@/utils/colorUtils";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import { ALIADO_CONFIG } from "@/config/aliadoConfig";
import { useLogoStyles } from "@/hooks/useLogoStyles";
import { useMemo } from "react";
import { ReelSummarySlide } from "./ReelSummarySlide";
import { REEL_TEMPLATES } from "@/utils/reelTemplates";

interface ReelFrameProps {
  mode: 'preview' | 'capture';
  photoSrc: string;
  photoIndex: number;
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  visualLayers: VisualLayers;
  textComposition: TextCompositionSettings;
  logoSettings: LogoSettings;
  gradientDirection: 'top' | 'bottom' | 'both' | 'none';
  gradientIntensity: number;
  currentTemplate: ReelTemplate;
  showSummarySlide?: boolean;
  photos?: string[];
  summaryBackground?: 'solid' | 'blur' | 'mosaic';
  summarySolidColor?: string;
  customHashtag?: string;
  customPhone?: string;
  logoEntranceProgress?: number; // 0..1 para controlar la entrada del logo
  firstPhotoConfig?: FirstPhotoConfig; // Configuración especial primera foto
}

// Función helper para obtener el logo apropiado
const getLogoUrl = (
  backgroundStyle: LogoSettings['background'],
  config: AliadoConfig
): string => {
  // Siempre usar logo regular (con fondo blanco)
  return config.logo;
};

// Función de easing suave para la entrada del logo
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const ReelFrame = ({
  mode,
  photoSrc,
  photoIndex,
  propertyData,
  aliadoConfig,
  visualLayers,
  textComposition,
  logoSettings,
  gradientDirection,
  gradientIntensity,
  currentTemplate,
  showSummarySlide = false,
  photos = [],
  summaryBackground = 'solid',
  summarySolidColor,
  customHashtag,
  customPhone,
  logoEntranceProgress = 1, // Default: logo completamente visible
  firstPhotoConfig // Configuración especial primera foto
}: ReelFrameProps) => {
  const brand = aliadoConfig.colorPrimario || '#00A5BD';
  const template = REEL_TEMPLATES[currentTemplate];

  // PRIMERA FOTO: Aplicar configuración especial si photoIndex === 0
  const isFirstPhoto = photoIndex === 0;
  const effectiveVisualLayers = useMemo(() => {
    if (!isFirstPhoto || !firstPhotoConfig) return visualLayers;

    let layers = { ...visualLayers };

    // Aplicar showAllyLogo de primera foto si está definido
    if (firstPhotoConfig.showAllyLogo !== undefined) {
      layers.showAllyLogo = firstPhotoConfig.showAllyLogo;
    }

    // Aplicar overlayStyle de primera foto
    switch (firstPhotoConfig.overlayStyle) {
      case 'clean':
        // Sin overlays, solo foto y logo
        layers = {
          ...layers,
          showPrice: false,
          showBadge: false,
          showIcons: false,
          showCTA: false
        };
        break;
      case 'simple':
        // Solo precio + título, sin iconos
        layers = {
          ...layers,
          showIcons: false,
          showCTA: false
        };
        break;
      case 'full':
      default:
        // Completo: FORZAR todos los overlays visibles
        layers = {
          ...layers,
          showPrice: true,
          showBadge: true,
          showIcons: true,
          showCTA: true
        };
        break;
    }

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

  // Escala base para modo captura (1080x1920) vs preview (~350-420px)
  const captureScale = mode === 'capture' ? 2.0 : 1;

  // Estilos dinámicos del logo
  const logoStyle = useLogoStyles(logoSettings);
  const logoUrl = getLogoUrl(logoSettings.background, aliadoConfig);
  
  // Tamaño dinámico del logo basado en la selección del usuario
  const logoBaseSize = parseInt(logoStyle.size); // 70, 80 o 90
  const logoCaptureScale = 1.8; // Escala específica para el logo
  const logoFinalSize = mode === 'capture' 
    ? logoBaseSize * logoCaptureScale  // ej: 80 * 1.8 = 144px
    : logoBaseSize;                     // ej: 80px

  // Calcular opacidad con entrada
  const finalOpacity = logoStyle.opacity * easeOutCubic(logoEntranceProgress);

  // Gradient overlay style
  const gradientOverlayStyle = useMemo(() => {
    if (gradientDirection === 'none') return {};
    
    const intensity = Math.max(0, Math.min(100, gradientIntensity));
    const alpha = (intensity / 100) * 0.7;
    const rgba = (a: number) => `rgba(0,0,0,${a.toFixed(3)})`;
    
    if (gradientDirection === 'top') {
      return { background: `linear-gradient(to bottom, ${rgba(alpha)} 0%, ${rgba(0)} 60%)` };
    }
    if (gradientDirection === 'bottom') {
      return { background: `linear-gradient(to top, ${rgba(alpha)} 0%, ${rgba(0)} 60%)` };
    }
    return {
      background: `linear-gradient(to bottom, ${rgba(alpha)} 0%, ${rgba(0)} 60%), linear-gradient(to top, ${rgba(alpha)} 0%, ${rgba(0)} 60%)`
    };
  }, [gradientDirection, gradientIntensity]);

  // Text styling con escalado para captura
  const textStyle = useMemo(() => {
    const baseScale = 1 + (textComposition.typographyScale / 100);
    const baseBadgeScale = 1 + (textComposition.badgeScale / 100);
    
    // Aplicar multiplicadores para modo capture
    const scale = mode === 'capture' ? baseScale * 1.5 : baseScale;
    const badgeScale = mode === 'capture' ? baseBadgeScale * 1.8 : baseBadgeScale;
    
    const badgeClasses = {
      circular: 'rounded-full',
      rectangular: 'rounded-none',
      rounded: 'rounded-xl',
      none: 'hidden'
    };

    const spacingValues = {
      compact: mode === 'capture' ? 'gap-1' : 'gap-0.5',
      normal: mode === 'capture' ? 'gap-6' : 'gap-2',
      spacious: mode === 'capture' ? 'gap-11' : 'gap-4'
    };

    return {
      scale,
      badgeScale,
      badgeClass: badgeClasses[textComposition.badgeStyle],
      alignmentClass: 'items-start text-left',
      spacingClass: spacingValues[textComposition.verticalSpacing]
    };
  }, [textComposition, mode, captureScale]);

  // Renderizar slide de resumen
  if (showSummarySlide) {
    return (
      <ReelSummarySlide 
        mode={mode}
        propertyData={propertyData}
        aliadoConfig={aliadoConfig}
        isVisible={true}
        photos={photos}
        backgroundStyle={summaryBackground}
        solidColor={summarySolidColor}
        customHashtag={customHashtag}
        customPhone={customPhone}
      />
    );
  }

  // Renderizar frame normal con foto
  const esVenta = propertyData.modalidad === "venta" || (!!propertyData.valorVenta && !propertyData.canon);
  const precio = esVenta ? propertyData.valorVenta : propertyData.canon;

  return (
    <>
      {/* Foto con gradiente */}
      <div className="absolute inset-0">
        <img
          src={photoSrc}
          alt={`Foto ${photoIndex + 1}`}
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        {/* Gradient overlay */}
        {gradientDirection !== 'none' && (
          <div className="absolute inset-0 pointer-events-none" style={{ ...gradientOverlayStyle, zIndex: 5 }} />
        )}
      </div>

      {/* Logo del aliado */}
      {effectiveVisualLayers.showAllyLogo && (
        <div
          className="absolute z-20"
          style={{ 
            opacity: finalOpacity,
            top: mode === 'capture' ? '48px' : '24px',
            ...(logoSettings.position === 'top-left' 
              ? { left: mode === 'capture' ? '48px' : '24px' }
              : { right: mode === 'capture' ? '48px' : '24px' }
            ),
            transformOrigin: logoSettings.position === 'top-left' ? 'top left' : 'top right',
            ...(mode === 'preview' && {
              transition: 'opacity 480ms cubic-bezier(0.22, 1, 0.36, 1), transform 480ms cubic-bezier(0.22, 1, 0.36, 1)',
              transform: `scale(1) translateY(${(1 - easeOutCubic(logoEntranceProgress)) * 6}px)`,
            }),
          }}
        >
          <div
            className={`${logoStyle.shapeClass} ${logoStyle.backgroundClass} p-2.5 flex items-center justify-center`}
            style={{
              ...(mode === 'capture' && logoSettings.background === 'frosted' && {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.8)',
              }),
            }}
          >
            <img
              src={logoUrl}
              alt={aliadoConfig.nombre}
              className="w-full h-full object-contain"
              style={{ 
                width: `${logoFinalSize}px`,
                height: `${logoFinalSize}px`,
                maxWidth: `${logoFinalSize}px`,
                maxHeight: `${logoFinalSize}px`,
              }}
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              data-ally-logo="true"
            />
          </div>
        </div>
      )}

      {/* Información del inmueble */}
      <div 
        className={`absolute bottom-0 left-0 right-0 z-10 flex flex-col ${textStyle.alignmentClass} ${textStyle.spacingClass}`}
        style={{
          padding: mode === 'capture' ? '44px 120px 132px 44px' : '16px 44px 48px 16px'
        }}
      >
        {/* Subtítulo sobre el precio */}
        {effectiveVisualLayers.showBadge && propertyData.subtitulos?.[photoIndex] && (
          <div 
            style={{ 
              width: '100%',
              display: 'flex', 
              justifyContent: 'center',
              marginBottom: mode === 'capture' ? '33px' : '12px'
            }}
          >
            <div 
              style={{
                maxWidth: '80%',
                backgroundColor: '#FFFFFF',
                padding: mode === 'capture' ? '16px 44px' : '6px 16px',
                borderRadius: textStyle.badgeClass.includes('rounded-full') ? '9999px' : 
                             textStyle.badgeClass.includes('rounded-xl') 
                               ? (mode === 'capture' ? '33px' : '12px')
                               : '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundClip: 'padding-box',
                isolation: 'isolate',
                position: 'relative'
              }}
            >
              <p 
                style={{ 
                  color: '#1F2937',
                  fontSize: mode === 'capture' 
                    ? `${(parseFloat(template.subtitleStyle.textSize.match(/\d+/)?.[0] || '12') * textStyle.badgeScale * 1.3)}px`
                    : `calc(${template.subtitleStyle.textSize.match(/\d+/)?.[0] || 12}px * ${textStyle.badgeScale})`,
                  fontWeight: 700,
                  textShadow: 'none',
                  textAlign: 'center',
                  lineHeight: 1.25
                }}
              >
                {propertyData.subtitulos[photoIndex]}
              </p>
            </div>
          </div>
        )}

        {/* Precio */}
        {effectiveVisualLayers.showPrice && precio && (
          <div 
            className={`relative z-40 inline-flex flex-col ${template.priceStyle.className}`}
            style={{ 
              backgroundColor: aliadoConfig.colorPrimario,
              opacity: 1,
              border: '2px solid rgba(255,255,255,0.5)',
              color: '#ffffff',
              transform: `scale(${textStyle.scale})`,
              transformOrigin: 'left center',
              padding: mode === 'capture' ? '12px 40px' : '6px 20px',
              gap: mode === 'capture' ? '4px' : '2px',
              marginBottom: mode === 'capture' ? '16px' : '8px'
            }}
          >
            <span 
              style={{ 
                fontSize: mode === 'capture' ? '20px' : '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                lineHeight: 1,
                color: 'rgba(255,255,255,0.9)'
              }}
            >
              {esVenta ? "Venta" : "Arriendo"}
            </span>
            <span 
              style={{ 
                fontSize: mode === 'capture' ? '48px' : '24px',
                fontWeight: 900,
                lineHeight: 1,
                color: '#ffffff'
              }}
            >
              {formatPrecioColombia(precio)}
            </span>
          </div>
        )}
        
        {effectiveVisualLayers.showCTA && (
          <>
            <h3
              style={{ 
                textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                fontSize: mode === 'capture' ? `${42 * textStyle.scale}px` : `calc(2rem * ${textStyle.scale})`,
                fontWeight: 900,
                color: '#ffffff',
                marginBottom: mode === 'capture' ? '16.5px' : '6px',
                lineHeight: 1.2
              }}
            >
              {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
            </h3>
            {propertyData.ubicacion && (
              <p 
                style={{ 
                  textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                  fontSize: mode === 'capture' ? `${24 * textStyle.scale}px` : `calc(1.125rem * ${textStyle.scale})`,
                  fontWeight: 700,
                  color: '#ffffff',
                  marginBottom: mode === 'capture' ? '44px' : '16px',
                  lineHeight: 1.3
                }}
              >
                📍 {propertyData.ubicacion}
              </p>
            )}
          </>
        )}

        {/* Iconografía de características */}
        {effectiveVisualLayers.showIcons && (
          <div 
            className="flex flex-wrap"
            style={{
              gap: mode === 'capture' ? '22px' : '8px',
              marginTop: mode === 'capture' ? '33px' : '12px'
            }}
          >
            {propertyData.habitaciones && (
              <div 
                className="flex items-center bg-white/95 shadow-lg"
                style={{ 
                  transform: `scale(${textStyle.scale})`,
                  transformOrigin: 'left center',
                  gap: mode === 'capture' ? '8px' : '3px',
                  padding: mode === 'capture' ? '16.5px 22px' : '6px 8px',
                  borderRadius: '9999px'
                }}
              >
                <span style={{ fontSize: mode === 'capture' ? '32px' : '16px' }}>🛏️</span>
                <span style={{ fontSize: mode === 'capture' ? '36px' : '18px', fontWeight: 700, color: '#1f2937' }}>
                  {propertyData.habitaciones}
                </span>
              </div>
            )}
            {propertyData.banos && (
              <div 
                className="flex items-center bg-white/95 shadow-lg"
                style={{ 
                  transform: `scale(${textStyle.scale})`,
                  transformOrigin: 'left center',
                  gap: mode === 'capture' ? '8px' : '3px',
                  padding: mode === 'capture' ? '16.5px 22px' : '6px 8px',
                  borderRadius: '9999px'
                }}
              >
                <span style={{ fontSize: mode === 'capture' ? '32px' : '16px' }}>🚿</span>
                <span style={{ fontSize: mode === 'capture' ? '36px' : '18px', fontWeight: 700, color: '#1f2937' }}>
                  {propertyData.banos}
                </span>
              </div>
            )}
            {propertyData.parqueaderos && (
              <div 
                className="flex items-center bg-white/95 shadow-lg"
                style={{ 
                  transform: `scale(${textStyle.scale})`,
                  transformOrigin: 'left center',
                  gap: mode === 'capture' ? '8px' : '3px',
                  padding: mode === 'capture' ? '16.5px 22px' : '6px 8px',
                  borderRadius: '9999px'
                }}
              >
                <span style={{ fontSize: mode === 'capture' ? '32px' : '16px' }}>🚗</span>
                <span style={{ fontSize: mode === 'capture' ? '36px' : '18px', fontWeight: 700, color: '#1f2937' }}>
                  {propertyData.parqueaderos}
                </span>
              </div>
            )}
            {propertyData.area && (
              <div 
                className="flex items-center bg-white/95 shadow-lg"
                style={{ 
                  transform: `scale(${textStyle.scale})`,
                  transformOrigin: 'left center',
                  gap: mode === 'capture' ? '8px' : '3px',
                  padding: mode === 'capture' ? '16.5px 22px' : '6px 8px',
                  borderRadius: '9999px'
                }}
              >
                <span style={{ fontSize: mode === 'capture' ? '32px' : '16px' }}>📐</span>
                <span style={{ fontSize: mode === 'capture' ? '36px' : '18px', fontWeight: 700, color: '#1f2937' }}>
                  {propertyData.area}m²
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logo El Gestor - inferior derecha - SIEMPRE visible */}
      <div 
        className="absolute z-40"
        style={{
          bottom: mode === 'capture' ? '132px' : '48px',
          right: mode === 'capture' ? '44px' : '16px'
        }}
      >
        <img 
          src={elGestorLogo} 
          alt="El Gestor" 
          data-eg-logo="true"
          className="object-contain"
          style={{ 
            height: mode === 'capture' ? '80px' : '40px',
            filter: mode === 'preview' ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' : 'none',
            imageRendering: 'crisp-edges'
          }}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </div>
    </>
  );
};
