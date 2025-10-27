import { useEffect, useRef } from "react";
import { ArrendadoData, ArrendadoType } from "@/types/arrendado";
import { AliadoConfig } from "@/types/property";
import { Card } from "@/components/ui/card";

interface ArrendadoPreviewProps {
  data: ArrendadoData;
  aliadoConfig: AliadoConfig;
  tipo: ArrendadoType;
  size?: "post" | "historia";
}

export const ArrendadoPreview = ({ 
  data, 
  aliadoConfig, 
  tipo,
  size = "post" 
}: ArrendadoPreviewProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const dimensions = size === "post" 
    ? { width: 1080, height: 1080 }
    : { width: 1080, height: 1920 };

  const isPost = size === "post";

  const getVelocidadText = () => {
    const dias = data.diasEnMercado;
    if (dias <= 7) return `🚀 ¡RÉCORD! En solo ${dias} día${dias === 1 ? '' : 's'}`;
    if (dias <= 15) return `⚡ En solo ${dias} días`;
    return `🎉 En ${dias} días`;
  };

  const badgeText = tipo === "arrendado" ? "¡ARRENDADO!" : "¡VENDIDO!";
  const mainColor = tipo === "arrendado" ? "#10B981" : "#3B82F6";

  const tipoLabel = {
    apartamento: "Apartamento",
    casa: "Casa",
    local: "Local",
    oficina: "Oficina",
    bodega: "Bodega",
    lote: "Lote"
  }[data.tipo];

  return (
    <Card className="w-full max-w-2xl mx-auto p-4">
      <div 
        ref={canvasRef}
        className="relative overflow-hidden rounded-2xl"
        style={{
          width: "100%",
          aspectRatio: isPost ? "1/1" : "9/16",
          maxWidth: "600px",
          margin: "0 auto"
        }}
      >
        {/* Imagen de fondo */}
        {data.fotos?.[0] && (
          <div className="absolute inset-0">
            <img 
              src={data.fotos[0]} 
              alt="Inmueble"
              className="w-full h-full object-cover"
            />
            {/* Overlay oscuro para legibilidad */}
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${mainColor}CC, ${mainColor}99)`
              }}
            />
          </div>
        )}

        {/* Contenido principal */}
        <div className="relative h-full flex flex-col justify-between p-8 text-white">
          
          {/* Header: Badge celebratorio */}
          <div className="flex flex-col items-center gap-4">
            <div 
              className="px-8 py-4 rounded-2xl font-black text-4xl text-center shadow-2xl animate-scale-in"
              style={{ 
                backgroundColor: "white",
                color: mainColor
              }}
            >
              {badgeText}
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold drop-shadow-lg">
                {getVelocidadText()}
              </p>
            </div>
          </div>

          {/* Centro: Info del inmueble */}
          <div className="flex flex-col items-center gap-6 my-8">
            <div className="text-center space-y-2">
              <p className="text-3xl font-extrabold drop-shadow-lg">
                {tipoLabel}
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">📍</span>
                <p className="text-2xl font-semibold drop-shadow-lg">
                  {data.ubicacion}
                </p>
              </div>
            </div>

            {/* Línea decorativa */}
            <div className="w-24 h-1 bg-white/50 rounded-full" />

            {/* Logo del aliado */}
            {aliadoConfig.logo && (
              <div className="bg-white/10 backdrop-blur-sm px-6 py-4 rounded-xl">
                <img 
                  src={aliadoConfig.logo} 
                  alt={aliadoConfig.nombre}
                  className="h-16 object-contain"
                />
              </div>
            )}
          </div>

          {/* Footer: CTA para propietarios */}
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-xl font-bold drop-shadow-lg">
                💪 ¿Quieres {tipo === "arrendado" ? "arrendar" : "vender"} tu inmueble rápido?
              </p>
              <div 
                className="inline-block px-6 py-3 rounded-lg font-semibold text-lg"
                style={{ backgroundColor: "white", color: mainColor }}
              >
                📱 {aliadoConfig.whatsapp}
              </div>
            </div>

            {/* Logo El Gestor */}
            <div className="flex justify-center">
              <img 
                src="/src/assets/el-gestor-logo.png" 
                alt="El Gestor"
                className="h-8 object-contain opacity-90"
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
