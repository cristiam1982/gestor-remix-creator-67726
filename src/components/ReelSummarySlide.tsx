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
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'blur(48px)',
                opacity: 0.3
              }}
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.2))'
            }} />
          </>
        ) : null;
        
      case 'mosaic':
        return photos.length > 0 ? (
          <>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '4px',
              padding: '8px'
            }}>
              {photos.slice(0, 4).map((photo, idx) => (
                <img 
                  key={idx}
                  src={photo} 
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.2,
                    filter: 'blur(4px)'
                  }}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.2))'
            }} />
          </>
        ) : null;
        
      case 'solid':
      default:
        return null;
    }
  };

  return (
    <div 
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
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
        style={{
          position: 'relative',
          zIndex: 10,
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
          style={{
            marginLeft: 'auto',
            marginRight: 'auto',
            borderRadius: '12px',
            objectFit: 'contain',
            backgroundColor: '#FFFFFF',
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
            style={{ 
              fontSize: `${20 * captureScale}px`,
              fontWeight: 700,
              color: '#FFFFFF',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
          </h2>
          
          {/* Ubicación */}
          {propertyData.ubicacion && (
            <p 
              style={{ 
                fontSize: `${16 * captureScale}px`,
                fontWeight: 600,
                color: '#FFFFFF',
                textShadow: '0 2px 8px rgba(0,0,0,0.3)'
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
                style={{ 
                  fontSize: `${20 * captureScale}px`,
                  fontWeight: 900,
                  color: backgroundStyle === 'solid' ? textColor : '#FFFFFF',
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)'
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
            style={{ 
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: `${8 * captureScale}px` 
            }}
          >
            {caracteristicas.map((car, idx) => (
              <span
                key={idx}
                style={{
                  padding: `${8 * captureScale}px ${16 * captureScale}px`,
                  borderRadius: `${12 * captureScale}px`,
                  fontSize: `${16 * captureScale}px`,
                  fontWeight: 600,
                  backgroundColor: hexToRgba(brand, 0.88),
                  border: `${1.5 * captureScale}px solid rgba(255,255,255,0.2)`,
                  color: backgroundStyle === 'solid' ? textColor : '#FFFFFF',
                  textShadow: '0 2px 8px rgba(0,0,0,0.3)'
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
            style={{ 
              fontSize: `${16 * captureScale}px`,
              fontWeight: 700,
              marginBottom: `${4 * captureScale}px`,
              color: backgroundStyle === 'solid' ? textColor : '#FFFFFF',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            📱 Agenda tu visita
          </p>
          <p 
            style={{ 
              fontSize: `${16 * captureScale}px`,
              fontWeight: 400,
              color: backgroundStyle === 'solid' ? textColor : '#FFFFFF',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            {customPhone || aliadoConfig.whatsapp}
          </p>
        </div>

        {/* Hashtag personalizado */}
        <p 
          style={{ 
            fontSize: `${14 * captureScale}px`,
            fontWeight: 500,
            marginTop: `${16 * captureScale}px`,
            color: backgroundStyle === 'solid' ? textColor : '#FFFFFF',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          {customHashtag || `#TuNuevoHogarEn${aliadoConfig.ciudad.charAt(0).toUpperCase() + aliadoConfig.ciudad.slice(1)}`} 🏡
        </p>
        
        {/* Logo El Gestor - más discreto al final */}
        <img
          src={elGestorLogo}
          alt="El Gestor"
          data-eg-logo="true"
          style={{
            marginLeft: 'auto',
            marginRight: 'auto',
            objectFit: 'contain',
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
