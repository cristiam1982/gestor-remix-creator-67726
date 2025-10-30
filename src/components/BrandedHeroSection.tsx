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

      {/* Título en color primario (naranja) */}
      <h1 className="text-4xl md:text-5xl font-bold mb-2" style={{
      color: aliadoConfig.colorPrimario
    }}>
        🎨 Creador Inmobiliario
      </h1>

      {/* Subtítulo en color secundario (azul) */}
      <p className="text-xl font-semibold mb-6" style={{
      color: aliadoConfig.colorSecundario
    }}>
        Crea tu publicación profesional en minutos
      </p>

      {/* Badge con ambos colores de marca */}
      <div className="inline-block px-6 py-3 rounded-xl border-2 font-semibold" style={{
      background: `linear-gradient(90deg, ${aliadoConfig.colorPrimario}25, ${aliadoConfig.colorSecundario}35)`,
      borderColor: aliadoConfig.colorPrimario,
      color: aliadoConfig.colorSecundario
    }}>
        {aliadoConfig.nombre} • {aliadoConfig.ciudad}
      </div>
    </div>;
};