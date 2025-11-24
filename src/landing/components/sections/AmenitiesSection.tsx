import { PropertyData } from "../../types/landing";
import { Card } from "@/components/ui/card";

type AmenitiesSectionProps = {
  property: PropertyData;
};

const amenityIcons: Record<string, string> = {
  seguridad: "🔒",
  "zonas verdes": "🌳",
  mascotas: "🐕",
  gimnasio: "💪",
  piscina: "🏊",
  portería: "🚪",
  "parqueadero visitantes": "🅿️",
  ascensor: "🛗",
  "salón social": "🎉",
  bbq: "🍖",
  "zona infantil": "🎪",
  "cancha deportiva": "⚽",
};

const getAmenityIcon = (amenity: string): string => {
  const normalized = amenity.toLowerCase().trim();
  return amenityIcons[normalized] || "✨";
};

export const AmenitiesSection = ({ property }: AmenitiesSectionProps) => {
  if (!property.benefits || property.benefits.length === 0) {
    return null;
  }

  return (
    <section className="py-12 lg:py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-foreground">
          Amenidades y Beneficios
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {property.benefits.map((amenity, index) => (
            <Card
              key={index}
              className="p-4 hover:shadow-lg transition-shadow bg-card border-border"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getAmenityIcon(amenity)}</span>
                <span className="text-sm font-medium text-foreground capitalize">
                  {amenity}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
