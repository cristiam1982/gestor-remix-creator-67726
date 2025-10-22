import { useEffect, useRef } from "react";
import { PropertyData, AliadoConfig, ContentType } from "@/types/property";
import { Home, Bed, Bath, Car, MapPin, Square } from "lucide-react";

interface CanvasPreviewProps {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  contentType: ContentType;
  onReady?: () => void;
}

export const CanvasPreview = ({ propertyData, aliadoConfig, contentType, onReady }: CanvasPreviewProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onReady) {
      onReady();
    }
  }, [onReady]);

  const isStory = contentType === "historia";
  const dimensions = isStory ? "aspect-[9/16]" : "aspect-square";

  const renderPropertyIcons = () => {
    const icons = [];
    
    if (propertyData.habitaciones) {
      icons.push(
        <div key="hab" className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-lg">
          <Bed className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">{propertyData.habitaciones}</span>
        </div>
      );
    }
    
    if (propertyData.banos) {
      icons.push(
        <div key="ban" className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-lg">
          <Bath className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">{propertyData.banos}</span>
        </div>
      );
    }
    
    if (propertyData.parqueaderos) {
      icons.push(
        <div key="par" className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-lg">
          <Car className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">{propertyData.parqueaderos}</span>
        </div>
      );
    }
    
    if (propertyData.area) {
      icons.push(
        <div key="area" className="flex items-center gap-2 bg-white/90 px-3 py-2 rounded-lg">
          <Square className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold">{propertyData.area}m²</span>
        </div>
      );
    }

    return icons;
  };

  return (
    <div 
      ref={canvasRef}
      id="canvas-preview"
      className={`relative ${dimensions} w-full max-w-[540px] mx-auto overflow-hidden rounded-xl shadow-2xl`}
      style={{ backgroundColor: aliadoConfig.color || "#192A56" }}
    >
      {/* Foto principal */}
      {propertyData.fotos && propertyData.fotos.length > 0 && (
        <div className="absolute inset-0">
          <img 
            src={propertyData.fotos[0]} 
            alt="Propiedad"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        </div>
      )}

      {/* Header con logo del aliado */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 bg-white/95 px-4 py-3 rounded-xl shadow-lg">
          {aliadoConfig.logo && (
            <img 
              src={aliadoConfig.logo} 
              alt={aliadoConfig.nombre}
              className="w-10 h-10 object-contain"
            />
          )}
          <div>
            <p className="font-bold text-sm" style={{ color: aliadoConfig.color || "#192A56" }}>
              {aliadoConfig.nombre}
            </p>
            <p className="text-xs text-muted-foreground">{aliadoConfig.ciudad}</p>
          </div>
        </div>
      </div>

      {/* Información principal */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: aliadoConfig.color || "#192A56" }}>
                {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
              </h2>
              {propertyData.ubicacion && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{propertyData.ubicacion}</span>
                </div>
              )}
            </div>
            {propertyData.canon && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Canon mensual</p>
                <p className="text-2xl font-bold" style={{ color: aliadoConfig.color || "#192A56" }}>
                  {propertyData.canon}
                </p>
              </div>
            )}
            {propertyData.valorVenta && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Valor venta</p>
                <p className="text-2xl font-bold" style={{ color: aliadoConfig.color || "#192A56" }}>
                  {propertyData.valorVenta}
                </p>
              </div>
            )}
          </div>

          {/* Iconos de atributos */}
          <div className="flex flex-wrap gap-2">
            {renderPropertyIcons()}
          </div>

          {/* WhatsApp */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-semibold" style={{ color: aliadoConfig.color || "#192A56" }}>
              📱 WhatsApp: {aliadoConfig.whatsapp}
            </p>
          </div>
        </div>
      </div>

      {/* Logo El Gestor (marca de agua) */}
      <div className="absolute bottom-4 right-4 z-20 opacity-70">
        <div className="bg-white/90 px-3 py-2 rounded-lg">
          <p className="text-xs font-bold text-primary">El Gestor</p>
        </div>
      </div>
    </div>
  );
};
