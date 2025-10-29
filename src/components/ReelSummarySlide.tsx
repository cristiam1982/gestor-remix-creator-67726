import { PropertyData, AliadoConfig } from "@/types/property";
import { formatPrecioColombia } from "@/utils/formatters";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";

interface ReelSummarySlideProps {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  isVisible: boolean;
  photos?: string[];
  backgroundStyle?: 'solid' | 'blur' | 'mosaic';
}

export const ReelSummarySlide = ({ 
  propertyData, 
  aliadoConfig,
  isVisible,
  photos = [],
  backgroundStyle = 'solid'
}: ReelSummarySlideProps) => {
  if (!isVisible) return null;

  const esVenta = propertyData.modalidad === "venta" || (!!propertyData.valorVenta && !propertyData.canon);
  const precio = esVenta ? propertyData.valorVenta : propertyData.canon;

  // Obtener características principales
  const caracteristicas = [];
  if (propertyData.habitaciones) caracteristicas.push({ icon: "🛏️", text: `${propertyData.habitaciones}` });
  if (propertyData.banos) caracteristicas.push({ icon: "🚿", text: `${propertyData.banos}` });
  if (propertyData.parqueaderos) caracteristicas.push({ icon: "🚗", text: `${propertyData.parqueaderos}` });
  if (propertyData.area) caracteristicas.push({ icon: "📐", text: `${propertyData.area}m²` });

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
        background: `linear-gradient(135deg, ${aliadoConfig.colorPrimario}15 0%, ${aliadoConfig.colorSecundario}15 100%)`,
        backdropFilter: 'blur(20px)'
      } : {}}
    >
      {renderBackground()}
      
      <div className="space-y-8 relative z-10">
        {/* Logo del aliado - más grande y protagonista */}
        <img
          src={logoRubyMorales}
          alt={aliadoConfig.nombre}
          className="w-40 h-40 mx-auto rounded-2xl object-contain bg-white p-3 shadow-2xl"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />

        {/* Información del inmueble - más compacta internamente */}
        <div className="space-y-2 mb-4">
          {/* Tipo de inmueble - más pequeño */}
          <h2 className="text-2xl font-black text-white drop-shadow-2xl">
            {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
          </h2>
          
          {/* Ubicación - más pequeña */}
          {propertyData.ubicacion && (
            <p className="text-lg font-bold text-white drop-shadow-xl">
              📍 {propertyData.ubicacion}
            </p>
          )}
          
          {/* Precio - más sutil */}
          {precio && (
            <div 
              className="inline-block px-5 py-2.5 rounded-2xl shadow-2xl"
              style={{ 
                background: `linear-gradient(135deg, ${aliadoConfig.colorPrimario}DD, ${aliadoConfig.colorSecundario}DD)`
              }}
            >
              <p className="text-xl font-black text-white drop-shadow-2xl">
                💰 {formatPrecioColombia(precio)}{esVenta ? "" : "/mes"}
              </p>
            </div>
          )}
        </div>

        {/* Características clave - más juntas */}
        {caracteristicas.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {caracteristicas.map((car, idx) => (
              <span
                key={idx}
                className="px-4 py-1.5 rounded-2xl shadow-xl text-white font-bold text-base"
                style={{ 
                  background: `linear-gradient(135deg, ${aliadoConfig.colorSecundario}CC, ${aliadoConfig.colorPrimario}CC)`
                }}
              >
                {car.icon} {car.text}
              </span>
            ))}
          </div>
        )}

        {/* Call to Action - menos dominante */}
        <div 
          className="px-6 py-3 rounded-2xl shadow-2xl"
          style={{ 
            background: `linear-gradient(135deg, ${aliadoConfig.colorPrimario}EE, ${aliadoConfig.colorSecundario}EE)`
          }}
        >
          <p className="text-lg font-bold text-white mb-1 drop-shadow-2xl">
            📞 Agenda tu visita
          </p>
          <p className="text-xl font-black text-white drop-shadow-2xl">
            {aliadoConfig.whatsapp}
          </p>
        </div>

        {/* Hashtag personalizado - más sutil */}
        <p className="text-sm font-semibold text-white mt-6 drop-shadow-2xl">
          #TuNuevoHogarEn{aliadoConfig.ciudad.charAt(0).toUpperCase() + aliadoConfig.ciudad.slice(1)} 🏡
        </p>
        
        {/* Logo El Gestor - más discreto al final */}
        <img
          src={elGestorLogo}
          alt="El Gestor"
          className="h-8 mx-auto mt-6 object-contain drop-shadow-2xl"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </div>
    </div>
  );
};
