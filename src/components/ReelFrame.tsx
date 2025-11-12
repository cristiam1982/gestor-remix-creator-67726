import { PropertyData, AliadoConfig, LogoSettings, TextCompositionSettings, VisualLayers, ReelTemplate } from "@/types/property";
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
}

// Función helper para obtener el logo apropiado según el fondo
const getLogoUrl = (backgroundStyle: LogoSettings['background']): string => {
  // Siempre usar logo con fondo blanco
  return ALIADO_CONFIG.logo;
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
  customPhone
}: ReelFrameProps) => {
  const brand = aliadoConfig.colorPrimario || '#00A5BD';
  const template = REEL_TEMPLATES[currentTemplate];

  // Escala base para modo captura (1080x1920) vs preview (~350-420px)
  const captureScale = mode === 'capture' ? 2.0 : 1;

  // Estilos dinámicos del logo
  const logoStyle = useLogoStyles(logoSettings);

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
    
    // Aplicar escala de captura de forma moderada (no multiplicar directamente)
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
      {visualLayers.showAllyLogo && (
        <div 
          className={`absolute z-20 ${logoStyle.positionClass.replace('top-6', '').replace('right-6', '')} ${mode === 'preview' ? `${logoStyle.animationClass} ${logoStyle.entranceAnimationClass}` : ''}`}
          style={{ 
            opacity: logoStyle.opacity,
            top: mode === 'capture' ? '48px' : '24px',
            right: mode === 'capture' ? '48px' : '24px',
            transform: mode === 'capture' ? `scale(${captureScale})` : 'none',
            transformOrigin: 'top right',
            ...(mode === 'preview' ? logoStyle.animationStyle : {})
          }}
        >
          <img
            src={getLogoUrl(logoSettings.background)}
            alt={aliadoConfig.nombre}
            className={`${logoStyle.shapeClass} object-contain p-2.5 ${logoStyle.backgroundClass}`}
            style={{ width: logoStyle.size, height: logoStyle.size }}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            data-ally-logo="true"
          />
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
        {visualLayers.showBadge && propertyData.subtitulos?.[photoIndex] && (
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
                padding: mode === 'capture' ? '16.5px 44px' : '6px 16px',
                borderRadius: textStyle.badgeClass.includes('rounded-full') ? '9999px' : 
                             textStyle.badgeClass.includes('rounded-xl') ? (mode === 'capture' ? '33px' : '12px') : '0',
                boxShadow: mode === 'capture' 
                  ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
                  : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: mode === 'capture' 
                  ? '3px solid rgba(156, 163, 175, 0.8)'
                  : '2px solid rgba(156, 163, 175, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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
        {visualLayers.showPrice && precio && (
          <div 
            className={`relative z-40 inline-flex flex-col shadow-md`}
            style={{ 
              backgroundColor: aliadoConfig.colorPrimario,
              opacity: 0.9,
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              transform: `scale(${textStyle.scale})`,
              transformOrigin: 'left center',
              padding: mode === 'capture' ? '11px 44px' : '5px 16px',
              gap: mode === 'capture' ? '5.5px' : '2px',
              marginBottom: mode === 'capture' ? '22px' : '8px',
              borderRadius: template.priceStyle.className.includes('rounded-full') ? '9999px' :
                           template.priceStyle.className.includes('rounded-2xl') ? (mode === 'capture' ? '44px' : '16px') :
                           template.priceStyle.className.includes('rounded-xl') ? (mode === 'capture' ? '33px' : '12px') : '0'
            }}
          >
            <span 
              style={{ 
                fontSize: mode === 'capture' ? '28px' : '10px',
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
        
        {visualLayers.showCTA && (
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
        {visualLayers.showIcons && (
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
                  gap: mode === 'capture' ? '11px' : '4px',
                  padding: mode === 'capture' ? '16.5px 33px' : '6px 12px',
                  borderRadius: '9999px'
                }}
              >
                <span style={{ fontSize: mode === 'capture' ? '32px' : '16px' }}>🛏️</span>
                <span style={{ fontSize: mode === 'capture' ? '28px' : '14px', fontWeight: 700, color: '#1f2937' }}>
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
                  gap: mode === 'capture' ? '11px' : '4px',
                  padding: mode === 'capture' ? '16.5px 33px' : '6px 12px',
                  borderRadius: '9999px'
                }}
              >
                <span style={{ fontSize: mode === 'capture' ? '32px' : '16px' }}>🚿</span>
                <span style={{ fontSize: mode === 'capture' ? '28px' : '14px', fontWeight: 700, color: '#1f2937' }}>
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
                  gap: mode === 'capture' ? '11px' : '4px',
                  padding: mode === 'capture' ? '16.5px 33px' : '6px 12px',
                  borderRadius: '9999px'
                }}
              >
                <span style={{ fontSize: mode === 'capture' ? '32px' : '16px' }}>🚗</span>
                <span style={{ fontSize: mode === 'capture' ? '28px' : '14px', fontWeight: 700, color: '#1f2937' }}>
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
                  gap: mode === 'capture' ? '11px' : '4px',
                  padding: mode === 'capture' ? '16.5px 33px' : '6px 12px',
                  borderRadius: '9999px'
                }}
              >
                <span style={{ fontSize: mode === 'capture' ? '32px' : '16px' }}>📐</span>
                <span style={{ fontSize: mode === 'capture' ? '28px' : '14px', fontWeight: 700, color: '#1f2937' }}>
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
