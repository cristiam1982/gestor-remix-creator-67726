import { PropertyData } from "../../types/landing";
import { Card } from "@/components/ui/card";

type LocationSectionProps = {
  property: PropertyData;
};

export const LocationSection = ({ property }: LocationSectionProps) => {
  return (
    <section className="py-12 lg:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-foreground">
          Ubicación
        </h2>

        <Card className="p-8 lg:p-12 max-w-4xl mx-auto bg-card border-border">
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
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg">
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
