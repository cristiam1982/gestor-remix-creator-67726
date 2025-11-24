import { AllyData, PropertyData } from "../../types/landing";
import { Button } from "@/components/ui/button";

type HeroSectionProps = {
  ally: AllyData;
  property: PropertyData;
};

export const HeroSection = ({ ally, property }: HeroSectionProps) => {
  const heroImage = property.photos[0] || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200";
  
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const handleWhatsAppClick = () => {
    const phone = ally.whatsapp || ally.phone || "";
    const message = `Hola, estoy interesado en el ${property.type} en ${property.neighborhood}`;
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="relative w-full h-screen min-h-[600px] lg:min-h-[700px]">
      {/* Hero Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
      </div>

      {/* Ally Logo */}
      {ally.logoUrl && (
        <div className="absolute top-6 right-6 z-10">
          <div className="bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-lg">
            <img 
              src={ally.logoUrl} 
              alt={ally.name}
              className="h-12 w-auto object-contain"
            />
          </div>
        </div>
      )}

      {/* Hero Content */}
      <div className="absolute inset-x-0 bottom-0 z-10 p-6 lg:p-12">
        <div className="max-w-4xl">
          {/* Property Type Badge */}
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-sm font-medium text-gray-900">
              {property.type}
            </span>
            <span 
              className="px-4 py-2 backdrop-blur-sm rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: ally.colors.primary }}
            >
              {property.operation.toUpperCase()}
            </span>
          </div>

          {/* Price */}
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-3 drop-shadow-2xl">
            {formatPrice(property.price)}
          </h1>

          {/* Location */}
          <p className="text-xl lg:text-2xl text-white/95 mb-6 drop-shadow-lg">
            📍 {property.neighborhood}, {property.city}
          </p>

          {/* CTA Button */}
          <Button
            onClick={handleWhatsAppClick}
            size="lg"
            className="text-lg px-8 py-6 rounded-full shadow-2xl hover:scale-105 transition-transform"
            style={{ 
              backgroundColor: ally.colors.primary,
              color: "white"
            }}
          >
            💬 Contactar ahora por WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
};
