import { PropertyData, AliadoConfig } from "@/types/property";
import { formatPrecioColombia } from "@/utils/formatters";
import { hexToRgba, isLightColor } from "@/utils/colorUtils";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";

interface ReelSummarySlideProps {
  mode?: 'preview' | 'capture';
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  isVisible: boolean;
  photos?: string[];
  backgroundStyle?: 'solid' | 'blur' | 'mosaic';
  solidColor?: string;
  customHashtag?: string;
  customPhone?: string;
}

export const ReelSummarySlide = ({ 
  mode = 'preview',
  propertyData, 
  aliadoConfig,
  isVisible,
  photos = [],
  backgroundStyle = 'solid',
  solidColor,
  customHashtag,
  customPhone
}: ReelSummarySlideProps) => {
  if (!isVisible) return null;

  const esVenta = propertyData.modalidad === "venta" || (!!propertyData.valorVenta && !propertyData.canon);
  const precio = esVenta ? propertyData.valorVenta : propertyData.canon;
  
  // Color de marca del aliado
  const brand = aliadoConfig.colorPrimario || '#00A5BD';
  
  // Validación de contraste para fondo sólido
  const textColor = solidColor && isLightColor(solidColor) ? '#000000' : '#FFFFFF';

  // Escala para modo captura
  const captureScale = mode === 'capture' ? 2.5 : 1;

  // Obtener características según tipo de inmueble
  const caracteristicas = [];

  switch (propertyData.tipo) {
    case "apartamento":
    case "casa":
      // Características residenciales
      if (propertyData.habitaciones) caracteristicas.push({ icon: "🛏️", text: `${propertyData.habitaciones} hab` });
      if (propertyData.banos) caracteristicas.push({ icon: "🚿", text: `${propertyData.banos} baños` });
      if (propertyData.parqueaderos) caracteristicas.push({ icon: "🚗", text: `${propertyData.parqueaderos} parq` });
      if (propertyData.area) caracteristicas.push({ icon: "📐", text: `${propertyData.area}m²` });
      if (propertyData.estrato) caracteristicas.push({ icon: "🏘️", text: `Est. ${propertyData.estrato}` });
      if (propertyData.piso) caracteristicas.push({ icon: "🔢", text: `Piso ${propertyData.piso}` });
      break;

    case "bodega":
      // Características de bodega
      if (propertyData.area) caracteristicas.push({ icon: "📐", text: `${propertyData.area}m²` });
      if (propertyData.alturaLibre) caracteristicas.push({ icon: "📏", text: `Altura ${propertyData.alturaLibre}` });
      if (propertyData.trafico) {
        const traficoEmoji = propertyData.trafico === "alto" ? "🚛🚛🚛" : propertyData.trafico === "medio" ? "🚛🚛" : "🚛";
        caracteristicas.push({ icon: traficoEmoji, text: `Tráfico ${propertyData.trafico}` });
      }
      if (propertyData.parqueaderos) caracteristicas.push({ icon: "🚗", text: `${propertyData.parqueaderos} parq` });
      if (propertyData.servicios) caracteristicas.push({ icon: "⚡", text: "Servicios incluidos" });
      break;

    case "local":
    case "oficina":
      // Características comerciales
      if (propertyData.area) caracteristicas.push({ icon: "📐", text: `${propertyData.area}m²` });
      if (propertyData.piso) caracteristicas.push({ icon: "🔢", text: `Piso ${propertyData.piso}` });
      if (propertyData.trafico) {
        const traficoIcon = propertyData.trafico === "alto" ? "🚶‍♂️🚶‍♀️🚶" : propertyData.trafico === "medio" ? "🚶‍♂️🚶‍♀️" : "🚶";
        caracteristicas.push({ icon: traficoIcon, text: `Tráfico ${propertyData.trafico}` });
      }
      if (propertyData.parqueaderos) caracteristicas.push({ icon: "🚗", text: `${propertyData.parqueaderos} parq` });
      if (propertyData.servicios) caracteristicas.push({ icon: "⚡", text: "Servicios incluidos" });
      if (propertyData.vitrina) caracteristicas.push({ icon: "🪟", text: "Con vitrina" });
      break;

    case "lote":
      // Características de lote
      if (propertyData.area) caracteristicas.push({ icon: "📐", text: `${propertyData.area}m²` });
      if (propertyData.uso) {
        const usoText = propertyData.uso === "residencial" ? "Uso residencial" : "Uso comercial";
        const usoIcon = propertyData.uso === "residencial" ? "🏡" : "🏢";
        caracteristicas.push({ icon: usoIcon, text: usoText });
      }
      break;
  }

  const renderBackground = () => {
    switch (backgroundStyle) {
      case 'blur':
        return photos.length > 0 ? (
          <>
            <img 
              src={photos[photos.length - 1]} 
              className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20" />
          </>
        ) : null;
        
      case 'mosaic':
        return photos.length > 0 ? (
          <>
            <div className="absolute inset-0 grid grid-cols-2 gap-1 p-2">
              {photos.slice(0, 4).map((photo, idx) => (
                <img 
                  key={idx}
                  src={photo} 
                  className="w-full h-full object-cover opacity-20 blur-sm"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/20" />
          </>
        ) : null;
        
      case 'solid':
      default:
        return null;
    }
  };

  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center text-center"
      style={{
        padding: `${32 * captureScale}px`,
        ...(backgroundStyle === 'solid' ? {
          backgroundColor: solidColor || hexToRgba(brand, 0.12),
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)'
        } : {})
      }}
    >
      {renderBackground()}
      
      <div 
        className="relative z-10"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: `${16 * captureScale}px`,
          paddingTop: `${48 * captureScale}px`
        }}
      >
        {/* Logo del aliado - más grande y protagonista */}
        <img
          src={logoRubyMorales}
          alt={aliadoConfig.nombre}
          className="mx-auto rounded-xl object-contain bg-white"
          style={{
            width: `${140 * captureScale}px`,
            height: `${140 * captureScale}px`,
            padding: `${10 * captureScale}px`
          }}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />

        {/* Información del inmueble - más compacta internamente */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${8 * captureScale}px`, marginBottom: `${16 * captureScale}px` }}>
          {/* Tipo de inmueble */}
          <h2 
            className="font-bold text-white"
            style={{ 
              fontSize: `${20 * captureScale}px`
            }}
          >
            {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
          </h2>
          
          {/* Ubicación */}
          {propertyData.ubicacion && (
            <p 
              className="font-semibold text-white"
              style={{ 
                fontSize: `${16 * captureScale}px`
              }}
            >
              📍 {propertyData.ubicacion}
            </p>
          )}
          
          {/* Precio */}
          {precio && (
            <div 
              style={{ 
                backgroundColor: aliadoConfig.colorPrimario,
                opacity: 0.95,
                border: `${2 * captureScale}px solid rgba(255,255,255,0.25)`,
                borderRadius: `${12 * captureScale}px`,
                padding: `${8 * captureScale}px ${20 * captureScale}px`
              }}
            >
              <p 
                className="font-black"
                style={{ 
                  fontSize: `${20 * captureScale}px`,
                  color: backgroundStyle === 'solid' ? textColor : '#FFFFFF'
                }}
              >
                💰 {formatPrecioColombia(precio)}{esVenta ? "" : "/mes"}
              </p>
            </div>
          )}
        </div>

        {/* Características clave */}
        {caracteristicas.length > 0 && (
          <div 
            className="flex flex-wrap justify-center"
            style={{ gap: `${8 * captureScale}px` }}
          >
            {caracteristicas.map((car, idx) => (
              <span
                key={idx}
                className="font-semibold"
                style={{
                  padding: `${8 * captureScale}px ${16 * captureScale}px`,
                  borderRadius: `${12 * captureScale}px`,
                  fontSize: `${16 * captureScale}px`,
                  backgroundColor: hexToRgba(brand, 0.88),
                  border: `${1.5 * captureScale}px solid rgba(255,255,255,0.2)`,
                  color: backgroundStyle === 'solid' ? textColor : '#FFFFFF'
                }}
              >
                {car.icon} {car.text}
              </span>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div 
          style={{ 
            padding: `${12 * captureScale}px ${24 * captureScale}px`,
            borderRadius: `${12 * captureScale}px`,
            backgroundColor: hexToRgba(brand, 0.94),
            border: `${2 * captureScale}px solid rgba(255,255,255,0.3)`
          }}
        >
          <p 
            className="font-bold"
            style={{ 
              fontSize: `${16 * captureScale}px`,
              marginBottom: `${4 * captureScale}px`,
              color: backgroundStyle === 'solid' ? textColor : '#FFFFFF'
            }}
          >
            📱 Agenda tu visita
          </p>
          <p 
            style={{ 
              fontSize: `${16 * captureScale}px`,
              color: backgroundStyle === 'solid' ? textColor : '#FFFFFF'
            }}
          >
            {customPhone || aliadoConfig.whatsapp}
          </p>
        </div>

        {/* Hashtag personalizado */}
        <p 
          className="font-medium"
          style={{ 
            fontSize: `${14 * captureScale}px`,
            marginTop: `${16 * captureScale}px`,
            color: backgroundStyle === 'solid' ? textColor : '#FFFFFF'
          }}
        >
          {customHashtag || `#TuNuevoHogarEn${aliadoConfig.ciudad.charAt(0).toUpperCase() + aliadoConfig.ciudad.slice(1)}`} 🏡
        </p>
        
        {/* Logo El Gestor - más discreto al final */}
        <img
          src={elGestorLogo}
          alt="El Gestor"
          data-eg-logo="true"
          className="mx-auto object-contain"
          style={{
            height: `${35 * captureScale}px`,
            marginTop: `${56 * captureScale}px`
          }}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
