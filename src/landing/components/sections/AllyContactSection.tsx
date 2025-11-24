import { AllyData, PropertyData } from "../../types/landing";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AllyContactSectionProps = {
  ally: AllyData;
  property: PropertyData;
};

export const AllyContactSection = ({ ally, property }: AllyContactSectionProps) => {
  const handleWhatsAppClick = () => {
    const phone = ally.whatsapp || ally.phone || "";
    const message = `Hola ${ally.name}, quiero más información sobre el ${property.type} en ${property.neighborhood}`;
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleEmailClick = () => {
    if (ally.email) {
      const subject = `Consulta sobre ${property.type} en ${property.neighborhood}`;
      const body = `Hola,\n\nEstoy interesado en obtener más información sobre el ${property.type} ubicado en ${property.neighborhood}, ${property.city}.\n\nQuedo atento a su respuesta.\n\nSaludos.`;
      window.location.href = `mailto:${ally.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  return (
    <section className="py-12 lg:py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl lg:text-4xl font-bold mb-8 text-center text-foreground">
          Contacta al Asesor
        </h2>

        <Card 
          className="max-w-2xl mx-auto p-8 lg:p-12 border-2"
          style={{ 
            borderColor: ally.colors.primary,
            backgroundColor: `${ally.colors.background}15`
          }}
        >
          <div className="flex flex-col items-center text-center">
            {/* Logo or Avatar */}
            {ally.logoUrl ? (
              <div className="w-32 h-32 mb-6 rounded-full overflow-hidden bg-white p-4 shadow-lg">
                <img
                  src={ally.logoUrl}
                  alt={ally.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div 
                className="w-32 h-32 mb-6 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg"
                style={{ backgroundColor: ally.colors.primary }}
              >
                {ally.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Ally Info */}
            <h3 className="text-2xl font-bold mb-2 text-foreground">
              {ally.name}
            </h3>
            <p className="text-muted-foreground mb-6">
              📍 {ally.city}
            </p>

            {/* Contact Details */}
            <div className="space-y-3 mb-8 w-full">
              {(ally.whatsapp || ally.phone) && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <span>📱</span>
                  <span>{ally.whatsapp || ally.phone}</span>
                </div>
              )}
              {ally.email && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <span>✉️</span>
                  <span>{ally.email}</span>
                </div>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Button
                onClick={handleWhatsAppClick}
                size="lg"
                className="flex-1 text-lg py-6 rounded-xl shadow-lg hover:scale-105 transition-transform"
                style={{ 
                  backgroundColor: ally.colors.primary,
                  color: "white"
                }}
              >
                💬 WhatsApp
              </Button>
              
              {ally.email && (
                <Button
                  onClick={handleEmailClick}
                  size="lg"
                  variant="outline"
                  className="flex-1 text-lg py-6 rounded-xl shadow-lg hover:scale-105 transition-transform"
                  style={{ 
                    borderColor: ally.colors.primary,
                    color: ally.colors.primary
                  }}
                >
                  ✉️ Email
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
