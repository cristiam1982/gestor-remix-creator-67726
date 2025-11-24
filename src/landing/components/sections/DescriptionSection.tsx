import { PropertyData } from "../../types/landing";
import { LandingTheme } from "../../templates/landingTemplates";
import { Card } from "@/components/ui/card";

type DescriptionSectionProps = {
  property: PropertyData;
  theme: LandingTheme;
};

export const DescriptionSection = ({ property, theme }: DescriptionSectionProps) => {
  if (!property.description) {
    return null;
  }

  return (
    <section className={`${theme.sectionSpacing} bg-muted/30`}>
      <div className="container mx-auto px-4">
        <h2 className={`text-3xl lg:text-4xl ${theme.headingFontClass} mb-8 text-foreground`}>
          Descripción del Inmueble
        </h2>

        <Card className={`${theme.cardPadding} lg:p-12 max-w-4xl mx-auto ${theme.cardBackground} ${theme.borderRadius} ${theme.shadow} ${theme.borderStyle}`}>
          <p className="text-lg leading-relaxed text-foreground whitespace-pre-line">
            {property.description}
          </p>
        </Card>
      </div>
    </section>
  );
};
