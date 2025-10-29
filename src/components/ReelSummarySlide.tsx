import { PropertyData, AliadoConfig } from "@/types/property";
import { formatPrecioColombia } from "@/utils/formatters";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";

interface ReelSummarySlideProps {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  isVisible: boolean;
}

export const ReelSummarySlide = ({ 
  propertyData, 
  aliadoConfig,
  isVisible 
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

  return (
    <div 
      className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
      style={{
        background: `linear-gradient(135deg, ${aliadoConfig.colorPrimario}15 0%, ${aliadoConfig.colorSecundario}15 100%)`,
        backdropFilter: 'blur(20px)'
      }}
    >
      {/* Logos superiores */}
      <div className="space-y-4 mb-8">
        <img
          src={logoRubyMorales}
          alt={aliadoConfig.nombre}
          className="w-32 h-32 mx-auto rounded-2xl object-contain bg-white/95 p-2 shadow-2xl border-4 border-white"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        <img
          src={elGestorLogo}
          alt="El Gestor"
          className="h-12 mx-auto object-contain drop-shadow-2xl"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Información del inmueble */}
      <div className="space-y-4 mb-6">
        <h2 
          className="text-4xl font-black text-white"
          style={{ textShadow: '3px 3px 10px rgba(0,0,0,0.9)' }}
        >
          {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
        </h2>
        
        {propertyData.ubicacion && (
          <p 
            className="text-2xl font-bold text-white"
            style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8)' }}
          >
            📍 {propertyData.ubicacion}
          </p>
        )}

        {precio && (
          <div 
            className="inline-block px-8 py-4 rounded-3xl shadow-2xl"
            style={{ 
              backgroundColor: aliadoConfig.colorPrimario,
              border: '3px solid rgba(255, 255, 255, 0.4)'
            }}
          >
            <p className="text-3xl font-black text-white" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.8)' }}>
              💰 {formatPrecioColombia(precio)}{esVenta ? "" : "/mes"}
            </p>
          </div>
        )}
      </div>

      {/* Características */}
      {caracteristicas.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {caracteristicas.map((car, idx) => (
            <span
              key={idx}
              className="px-6 py-3 rounded-2xl shadow-xl text-white font-bold text-xl"
              style={{
                backgroundColor: aliadoConfig.colorSecundario,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                textShadow: '1px 1px 4px rgba(0,0,0,0.7)'
              }}
            >
              {car.icon} {car.text}
            </span>
          ))}
        </div>
      )}

      {/* CTA con WhatsApp */}
      <div 
        className="px-10 py-5 rounded-3xl shadow-2xl backdrop-blur-xl border-4 border-white/40"
        style={{
          background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%)'
        }}
      >
        <p className="text-2xl font-black text-white mb-2" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.9)' }}>
          📞 Agenda tu visita
        </p>
        <p className="text-3xl font-black text-white" style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.9)' }}>
          {aliadoConfig.whatsapp}
        </p>
      </div>

      {/* Hashtag */}
      <p 
        className="text-xl font-bold text-white mt-6"
        style={{ textShadow: '2px 2px 6px rgba(0,0,0,0.8)' }}
      >
        #TuNuevoHogarEn{aliadoConfig.ciudad} 🏡
      </p>
    </div>
  );
};
