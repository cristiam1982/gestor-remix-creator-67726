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
  if (backgroundStyle === 'none') {
    return ALIADO_CONFIG.logoTransparent;
  }
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

  // Text styling
  const textStyle = useMemo(() => {
    const scale = 1 + (textComposition.typographyScale / 100);
    const badgeScale = 1 + (textComposition.badgeScale / 100);
    
    const badgeClasses = {
      circular: 'rounded-full',
      rectangular: 'rounded-none',
      rounded: 'rounded-xl',
      none: 'hidden'
    };

    const spacingValues = {
      compact: 'gap-0.5',
      normal: 'gap-2',
      spacious: 'gap-4'
    };

    return {
      scale,
      badgeScale,
      badgeClass: badgeClasses[textComposition.badgeStyle],
      alignmentClass: 'items-start text-left',
      spacingClass: spacingValues[textComposition.verticalSpacing]
    };
  }, [textComposition]);

  // Renderizar slide de resumen
  if (showSummarySlide) {
    return (
      <ReelSummarySlide 
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
          className={`absolute z-20 ${logoStyle.positionClass}`}
          style={{ opacity: logoStyle.opacity }}
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
      <div className={`absolute bottom-0 left-0 right-0 p-4 pr-20 pb-12 z-10 flex flex-col ${textStyle.alignmentClass} ${textStyle.spacingClass}`}>
        {/* Subtítulo sobre el precio */}
        {visualLayers.showBadge && propertyData.subtitulos?.[photoIndex] && (
          <div className="w-full flex justify-center mb-3">
            <div className={`${template.subtitleStyle.background} px-4 py-1.5 ${textStyle.badgeClass} shadow-lg max-w-[80%]`}>
              <p 
                className={`${template.subtitleStyle.textColor} ${template.subtitleStyle.textSize} font-semibold text-center leading-tight`}
                style={{ 
                  fontSize: `calc(${template.subtitleStyle.textSize.match(/\d+/)?.[0] || 12}px * ${textStyle.badgeScale})`,
                  textShadow: '0 2px 6px rgba(0,0,0,0.8)'
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
            className={`relative z-40 inline-flex flex-col gap-0.5 px-5 py-2.5 shadow-md mb-2 ${template.priceStyle.className}`}
            style={{ 
              backgroundColor: aliadoConfig.colorPrimario,
              opacity: 0.9,
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              transform: `scale(${textStyle.scale})`
            }}
          >
            <span 
              className="text-[10px] font-semibold uppercase tracking-wider leading-none text-white/90"
              style={{ fontWeight: 600 }}
            >
              {esVenta ? "Venta" : "Arriendo"}
            </span>
            <span 
              className="text-2xl font-black leading-none text-white"
              style={{ fontWeight: 900 }}
            >
              {formatPrecioColombia(precio)}
            </span>
          </div>
        )}
        
        {visualLayers.showCTA && (
          <>
            <h3 
              className="text-white text-2xl font-black mb-1.5"
              style={{ 
                textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                fontSize: `calc(2rem * ${textStyle.scale})`,
                fontWeight: 900
              }}
            >
              {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
            </h3>
            {propertyData.ubicacion && (
              <p 
                className="text-white text-lg font-bold mb-4"
                style={{ 
                  textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                  fontSize: `calc(1.125rem * ${textStyle.scale})`,
                  fontWeight: 700
                }}
              >
                📍 {propertyData.ubicacion}
              </p>
            )}
          </>
        )}

        {/* Iconografía de características */}
        {visualLayers.showIcons && (
          <div className="flex flex-wrap gap-2 mt-3">
            {propertyData.habitaciones && (
              <div 
                className="flex items-center gap-1 bg-white/95 px-3 py-1.5 rounded-full shadow-lg"
                style={{ transform: `scale(${textStyle.scale})` }}
              >
                <span className="text-base">🛏️</span>
                <span className="text-sm font-bold text-gray-800" style={{ fontWeight: 700 }}>{propertyData.habitaciones}</span>
              </div>
            )}
            {propertyData.banos && (
              <div 
                className="flex items-center gap-1 bg-white/95 px-3 py-1.5 rounded-full shadow-lg"
                style={{ transform: `scale(${textStyle.scale})` }}
              >
                <span className="text-base">🚿</span>
                <span className="text-sm font-bold text-gray-800" style={{ fontWeight: 700 }}>{propertyData.banos}</span>
              </div>
            )}
            {propertyData.parqueaderos && (
              <div 
                className="flex items-center gap-1 bg-white/95 px-3 py-1.5 rounded-full shadow-lg"
                style={{ transform: `scale(${textStyle.scale})` }}
              >
                <span className="text-base">🚗</span>
                <span className="text-sm font-bold text-gray-800" style={{ fontWeight: 700 }}>{propertyData.parqueaderos}</span>
              </div>
            )}
            {propertyData.area && (
              <div 
                className="flex items-center gap-1 bg-white/95 px-3 py-1.5 rounded-full shadow-lg"
                style={{ transform: `scale(${textStyle.scale})` }}
              >
                <span className="text-base">📐</span>
                <span className="text-sm font-bold text-gray-800" style={{ fontWeight: 700 }}>{propertyData.area}m²</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Logo El Gestor - inferior derecha - SIEMPRE visible */}
      <div className="absolute bottom-12 right-4 z-40">
        <img 
          src={elGestorLogo} 
          alt="El Gestor" 
          data-eg-logo="true"
          className="h-10 object-contain"
          style={{ 
            filter: mode === 'preview' ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' : 'none'
          }}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </div>
    </>
  );
};
