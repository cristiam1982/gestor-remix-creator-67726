import { AllyData } from "../../types/landing";
import { LandingTheme } from "../../templates/landingTemplates";
import elGestorLogo from "@/assets/el-gestor-logo.png";

type FooterBrandSectionProps = {
  ally: AllyData;
  theme: LandingTheme;
};

export const FooterBrandSection = ({ ally, theme }: FooterBrandSectionProps) => {
  return (
    <footer 
      className={`${theme.sectionSpacing} ${theme.borderStyle}`}
      style={{ 
        backgroundColor: `${ally.colors.background}30`,
        borderColor: `${theme.primary}20`
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center gap-6">
          {/* El Gestor Logo */}
          <img
            src={ally.gestorBadgeUrl || elGestorLogo}
            alt="El Gestor"
            className="h-16 object-contain opacity-80"
          />

          {/* Footer Text */}
          <p className="text-muted-foreground max-w-2xl">
            Con respaldo de <strong>El Gestor</strong> – Administración profesional de inmuebles.
          </p>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground/60">
            © {new Date().getFullYear()} {ally.name}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
