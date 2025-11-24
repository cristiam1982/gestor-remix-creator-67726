import { PropertyData } from "../../types/landing";
import { LandingTheme } from "../../templates/landingTemplates";
import { Card } from "@/components/ui/card";

type LocationSectionProps = {
  property: PropertyData;
  theme: LandingTheme;
};

export const LocationSection = ({ property, theme }: LocationSectionProps) => {
  return (
    <section className={`${theme.sectionSpacing} bg-muted/30`}>
      <div className="container mx-auto px-4">
        <h2 className={`text-3xl lg:text-4xl ${theme.headingFontClass} mb-8 text-foreground`}>
          Ubicación
        </h2>

        <Card className={`${theme.cardPadding} lg:p-12 max-w-4xl mx-auto ${theme.cardBackground} ${theme.borderRadius} ${theme.shadow} ${theme.borderStyle}`}>
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl">📍</span>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {property.neighborhood}, {property.city}
                </h3>
                {!property.hideAddress && property.address && (
                  <p className="text-muted-foreground">{property.address}</p>
                )}
                {property.hideAddress && (
                  <p className="text-sm text-muted-foreground italic">
                    Dirección exacta disponible al contactar
                  </p>
                )}
              </div>
            </div>
          </div>

          {property.mapEmbedUrl && (
            <div className={`relative aspect-video ${theme.borderRadius} overflow-hidden ${theme.shadow}`}>
              <iframe
                src={property.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de ubicación"
              />
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};
