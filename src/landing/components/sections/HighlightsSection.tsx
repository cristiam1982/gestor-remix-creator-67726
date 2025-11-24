import { PropertyData } from "../../types/landing";
import { LandingTheme } from "../../templates/landingTemplates";
import { Card } from "@/components/ui/card";

type HighlightsSectionProps = {
  property: PropertyData;
  theme: LandingTheme;
};

export const HighlightsSection = ({ property, theme }: HighlightsSectionProps) => {
  const highlights = [
    {
      icon: "📐",
      label: "Área Construida",
      value: property.builtArea ? `${property.builtArea} m²` : null,
    },
    {
      icon: "🏠",
      label: "Área Privada",
      value: property.privateArea ? `${property.privateArea} m²` : null,
    },
    {
      icon: "🛏️",
      label: "Habitaciones",
      value: property.bedrooms ? property.bedrooms : null,
    },
    {
      icon: "🚿",
      label: "Baños",
      value: property.bathrooms ? property.bathrooms : null,
    },
    {
      icon: "🚗",
      label: "Parqueaderos",
      value: property.parking ? property.parking : null,
    },
    {
      icon: "🏢",
      label: "Estrato",
      value: property.stratum ? property.stratum : null,
    },
    {
      icon: "🔢",
      label: "Piso",
      value: property.floor ? property.floor : null,
    },
    {
      icon: "📅",
      label: "Antigüedad",
      value: property.age || null,
    },
  ].filter((h) => h.value !== null);

  if (highlights.length === 0) {
    return null;
  }

  return (
    <section className={`${theme.sectionSpacing} bg-muted/30`}>
      <div className="container mx-auto px-4">
        <h2 className={`text-3xl lg:text-4xl ${theme.headingFontClass} mb-8 text-foreground`}>
          Características Principales
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {highlights.map((highlight, index) => (
            <Card
              key={index}
              className={`${theme.cardPadding} hover:shadow-lg transition-shadow ${theme.cardBackground} ${theme.borderRadius} ${theme.shadow} ${theme.borderStyle}`}
            >
              <div className="text-4xl mb-3">{highlight.icon}</div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {highlight.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {highlight.label}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
