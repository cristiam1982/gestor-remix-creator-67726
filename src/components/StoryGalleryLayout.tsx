import { PropertyData, AliadoConfig } from "@/types/property";
import { Badge } from "@/components/ui/badge";
import { Clock, Bed, Bath, Car, Maximize, MapPin, Phone, Image as ImageIcon } from "lucide-react";
import elGestorLogo from "@/assets/el-gestor-logo.png";

interface StoryGalleryLayoutProps {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  activePhotoIndex: number;
}

export const StoryGalleryLayout = ({ 
  propertyData, 
  aliadoConfig,
  activePhotoIndex 
}: StoryGalleryLayoutProps) => {
  // Color de fondo personalizable (con override de sesión)
  const bgColor = propertyData.galleryBackgroundColorOverride 
    || aliadoConfig.galleryBackgroundColor 
    || aliadoConfig.colorSecundario 
    || '#000000';
  
  // Validación defensiva: asegurar que haya fotos suficientes
  const availablePhotos = propertyData.fotos && propertyData.fotos.length >= 4 
    ? propertyData.fotos 
    : propertyData.fotos || [];
  
  const mainPhoto = availablePhotos[activePhotoIndex] || availablePhotos[0];
  // Excluir la foto principal y tomar las siguientes 3
  const thumbnails = availablePhotos
    .filter((_, idx) => idx !== activePhotoIndex)
    .slice(0, 3);
  const modalidadText = propertyData.modalidad === "arriendo" ? "EN ARRIENDO" : "EN VENTA";
  const precioValue = propertyData.modalidad === "arriendo" ? propertyData.canon : propertyData.valorVenta;

  // Características en 2 columnas
  const leftFeatures = [
    { icon: Bed, label: `${propertyData.habitaciones || 0} Habitaciones` },
    { icon: Bath, label: `${propertyData.banos || 0} Baños` },
    ...(propertyData.piso ? [{ icon: null as any, label: `Piso ${propertyData.piso}` }] : [])
  ];

  const rightFeatures = [
    { icon: Maximize, label: `${propertyData.area || 0}m²` },
    { icon: Car, label: `${propertyData.parqueaderos || 0} Parqueaderos` },
    ...(propertyData.estrato ? [{ icon: null as any, label: `Estrato ${propertyData.estrato}` }] : [])
  ];

  return (
    <div 
      id="story-gallery-preview"
      className="relative w-full bg-black overflow-hidden"
      style={{ 
        aspectRatio: "9/16",
        maxWidth: "450px",
        margin: "0 auto"
      }}
    >
      {/* Sección Superior: Foto Principal (52%) */}
      <div className="relative h-[52%] bg-gray-900">
        <img 
          src={mainPhoto} 
          alt="Foto principal"
          className="w-full h-full object-cover"
        />
        
        {/* Badge LIMITED OFFER - Top Right */}
        <div className="absolute top-4 right-4 z-10">
          <Badge 
            className="px-3 py-1.5 text-xs font-bold border-2 backdrop-blur-sm"
            style={{ 
              backgroundColor: `${bgColor}CC`, // 80% opacidad del color de fondo
              borderColor: aliadoConfig.colorPrimario,
              color: aliadoConfig.colorPrimario
            }}
          >
            <Clock className="w-3 h-3 mr-1" />
            {aliadoConfig.galleryBadgeText || "OFERTA LIMITADA"}
          </Badge>
        </div>

        {/* Logo del Aliado - Top Left */}
        <div className="absolute top-4 left-4 z-10">
          <div 
            className="w-16 h-16 rounded-lg overflow-hidden shadow-xl border-2 border-white/20"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
          >
            <img 
              src={aliadoConfig.logo} 
              alt={aliadoConfig.nombre}
              className="w-full h-full object-contain p-1"
            />
          </div>
        </div>
      </div>

      {/* Grid de Miniaturas - Centrado sobre la división */}
      {thumbnails.length >= 3 && (
        <div className="absolute left-1/2 transform -translate-x-1/2" style={{ top: "48%" }}>
          <div className="flex gap-2">
            {thumbnails.map((photo, idx) => (
              <div 
                key={idx}
                className="w-[107px] h-[107px] rounded-lg overflow-hidden border-4 border-white shadow-2xl bg-gray-800"
              >
                {photo ? (
                  <img 
                    src={photo} 
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección Inferior: Información (48%) */}
      <div 
        className="absolute bottom-0 w-full h-[48%] px-6 py-8 flex flex-col justify-between"
        style={{ 
          background: `linear-gradient(to bottom, rgba(0, 0, 0, 0.1), ${bgColor}F0)`,
          paddingTop: thumbnails.length >= 3 ? "5rem" : "2.5rem" 
        }}
      >
        {/* Header: Estado + Ubicación */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/10 text-white text-xs px-2 py-1">
              {modalidadText}
            </Badge>
            <div className="flex items-center gap-1 text-white/80 text-sm">
              <MapPin className="w-3 h-3" />
              <span>{propertyData.ubicacion}</span>
            </div>
          </div>

          {/* Precio Destacado */}
          <div 
            className="inline-block px-4 py-2 rounded-lg"
            style={{ backgroundColor: aliadoConfig.colorPrimario }}
          >
            <div className="text-2xl font-bold text-black">
              {precioValue}
            </div>
          </div>
        </div>

        {/* Características en 2 columnas */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 my-4">
          {/* Columna Izquierda */}
          <div className="space-y-2">
            {leftFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="flex items-center gap-2 text-white/90 text-xs">
                  <div 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: aliadoConfig.colorSecundario }}
                  />
                  {Icon && <Icon className="w-3 h-3" style={{ color: aliadoConfig.colorSecundario }} />}
                  <span>{feature.label}</span>
                </div>
              );
            })}
          </div>

          {/* Columna Derecha */}
          <div className="space-y-2">
            {rightFeatures.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="flex items-center gap-2 text-white/90 text-xs">
                  <div 
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: aliadoConfig.colorSecundario }}
                  />
                  {Icon && <Icon className="w-3 h-3" style={{ color: aliadoConfig.colorSecundario }} />}
                  <span>{feature.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA "AGENDA TU VISITA" */}
        <div className="relative">
          <div 
            className="text-center py-3 rounded-lg border-2 font-bold text-sm"
            style={{ 
              borderColor: '#EF4444',
              color: '#EF4444'
            }}
          >
            <span className="text-green-500 mr-2">&gt;&gt;&gt;</span>
            AGENDA TU VISITA
            <span className="text-green-500 ml-2">&lt;&lt;&lt;</span>
          </div>
        </div>

        {/* Footer: Contacto + Logo El Gestor */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <Phone className="w-3 h-3" />
            <span>{aliadoConfig.whatsapp}</span>
          </div>
          <img 
            src={elGestorLogo} 
            alt="El Gestor"
            className="h-7 object-contain opacity-80"
          />
        </div>
      </div>
    </div>
  );
};
