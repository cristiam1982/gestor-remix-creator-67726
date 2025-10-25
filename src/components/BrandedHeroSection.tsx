import { AliadoConfig } from "@/types/property";
import elGestorLogo from "@/assets/el-gestor-logo.png";
interface BrandedHeroSectionProps {
  aliadoConfig: AliadoConfig;
}
export const BrandedHeroSection = ({
  aliadoConfig
}: BrandedHeroSectionProps) => {
  return <div className="text-center mb-12 animate-fade-in">
      {/* Logos - Aliado y El Gestor */}
      <div className="flex items-center justify-between max-w-4xl mx-auto mb-8 px-4">
        {aliadoConfig.logo && <img src={aliadoConfig.logo} alt={aliadoConfig.nombre} className="h-28 md:h-20 object-contain" />}
        <img src={elGestorLogo} alt="El Gestor" className="h-20 md:h-16 object-contain opacity-80" />
      </div>

      {/* Título con gradiente personalizado */}
      <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent" style={{
      backgroundImage: `linear-gradient(135deg, ${aliadoConfig.colorPrimario}, ${aliadoConfig.colorSecundario})`
    }}>
        🎨 Creador Inmobiliario
      </h1>

      <p className="text-xl text-gray-700 mb-6">Crea tu publicación profesional en minutos</p>

      {/* Badge con identidad del aliado */}
      <div className="inline-block px-6 py-3 rounded-xl border-2 font-semibold" style={{
      backgroundColor: `${aliadoConfig.colorPrimario}15`,
      borderColor: aliadoConfig.colorPrimario,
      color: aliadoConfig.colorPrimario
    }}>
        {aliadoConfig.nombre} • {aliadoConfig.ciudad}
      </div>
    </div>;
};