import { PropertyData, AliadoConfig } from "@/types/property";
import { formatPrecioColombia } from "@/utils/formatters";
import { hexToRgba, isLightColor } from "@/utils/colorUtils";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";

interface ReelSummarySlideProps {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  isVisible: boolean;
  photos?: string[];
  backgroundStyle?: 'solid' | 'blur' | 'mosaic';
  solidColor?: string;
  customHashtag?: string;
}

export const ReelSummarySlide = ({ 
  propertyData, 
  aliadoConfig,
  isVisible,
  photos = [],
  backgroundStyle = 'solid',
  solidColor,
  customHashtag
}: ReelSummarySlideProps) => {
  if (!isVisible) return null;

  const esVenta = propertyData.modalidad === "venta" || (!!propertyData.valorVenta && !propertyData.canon);
  const precio = esVenta ? propertyData.valorVenta : propertyData.canon;
  
  // Color de marca del aliado
  const brand = aliadoConfig.colorPrimario || '#00A5BD';
  
  // Validación de contraste para fondo sólido
  const textColor = solidColor && isLightColor(solidColor) ? '#000000' : '#FFFFFF';

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
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
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
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
          </>
        ) : null;
        
      case 'solid':
      default:
        return null;
    }
  };

  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
      style={backgroundStyle === 'solid' ? {
        backgroundColor: solidColor || hexToRgba(brand, 0.12),
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)'
      } : {}}
    >
      {renderBackground()}
      
      <div className="space-y-4 relative z-10 pt-12">
        {/* Logo del aliado - más grande y protagonista */}
        <img
          src={logoRubyMorales}
          alt={aliadoConfig.nombre}
          className="w-[140px] h-[140px] mx-auto rounded-xl object-contain bg-white p-2.5 shadow-2xl"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />

        {/* Información del inmueble - más compacta internamente */}
        <div className="space-y-2 mb-4">
          {/* Tipo de inmueble - más pequeño */}
          <h2 className="text-xl font-bold text-white drop-shadow-2xl">
            {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
          </h2>
          
          {/* Ubicación - más pequeña */}
          {propertyData.ubicacion && (
            <p className="text-base font-semibold text-white drop-shadow-xl">
              📍 {propertyData.ubicacion}
            </p>
          )}
          
          {/* Precio - single-brand color */}
          {precio && (
            <div 
              className="inline-block px-5 py-2 rounded-xl shadow-2xl"
              style={{ 
                backgroundColor: aliadoConfig.colorPrimario,
                opacity: 0.95,
                border: '2px solid rgba(255,255,255,0.25)'
              }}
            >
              <p 
                className="text-xl font-black drop-shadow-2xl"
                style={{ 
                  color: backgroundStyle === 'solid' ? textColor : '#FFFFFF',
                  textShadow: '0 3px 10px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,1)' 
                }}
              >
                💰 {formatPrecioColombia(precio)}{esVenta ? "" : "/mes"}
              </p>
            </div>
          )}
        </div>

        {/* Características clave - single-brand color */}
        {caracteristicas.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {caracteristicas.map((car, idx) => (
              <span
                key={idx}
                className="px-4 py-2 rounded-xl shadow-xl font-semibold text-base"
                style={{ 
                  backgroundColor: hexToRgba(brand, 0.88),
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  color: backgroundStyle === 'solid' ? textColor : '#FFFFFF',
                  textShadow: '0 2px 6px rgba(0,0,0,0.85)'
                }}
              >
                {car.icon} {car.text}
              </span>
            ))}
          </div>
        )}

        {/* Call to Action - single-brand color */}
        <div 
          className="px-6 py-3 rounded-xl shadow-2xl"
          style={{ 
            backgroundColor: hexToRgba(brand, 0.94),
            border: '2px solid rgba(255,255,255,0.3)'
          }}
        >
          <p 
            className="font-bold text-base mb-1"
            style={{ 
              color: backgroundStyle === 'solid' ? textColor : '#FFFFFF',
              textShadow: '0 2px 6px rgba(0,0,0,0.8)' 
            }}
          >
            📱 Agenda tu visita
          </p>
          <p 
            className="text-base" 
            style={{ 
              color: backgroundStyle === 'solid' ? textColor : '#FFFFFF',
              textShadow: '0 2px 6px rgba(0,0,0,0.8)' 
            }}
          >
            {aliadoConfig.whatsapp}
          </p>
        </div>

        {/* Hashtag personalizado */}
        <p 
          className="text-sm font-medium mt-4"
          style={{ 
            color: backgroundStyle === 'solid' ? textColor : '#FFFFFF',
            textShadow: '0 2px 8px rgba(0,0,0,0.9)' 
          }}
        >
          {customHashtag || `#TuNuevoHogarEn${aliadoConfig.ciudad.charAt(0).toUpperCase() + aliadoConfig.ciudad.slice(1)}`} 🏡
        </p>
        
        {/* Logo El Gestor - más discreto al final */}
        <img
          src={elGestorLogo}
          alt="El Gestor"
          className="h-[35px] mx-auto mt-14 object-contain drop-shadow-2xl"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
