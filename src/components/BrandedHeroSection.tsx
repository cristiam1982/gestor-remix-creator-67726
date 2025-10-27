import { AliadoConfig } from "@/types/property";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";
interface BrandedHeroSectionProps {
  aliadoConfig: AliadoConfig;
}
export const BrandedHeroSection = ({
  aliadoConfig
}: BrandedHeroSectionProps) => {
  return <div className="text-center mb-12 animate-fade-in">
      {/* Logos - Aliado (principal) y El Gestor (secundario) */}
      <div className="flex items-center justify-between max-w-4xl mx-auto mb-8 px-4">
        <img src={logoRubyMorales} alt={aliadoConfig.nombre} className="h-36 md:h-28 object-contain" />
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-1">Powered by</p>
          <img src={elGestorLogo} alt="El Gestor" className="h-14 md:h-10 object-contain opacity-60" />
        </div>
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