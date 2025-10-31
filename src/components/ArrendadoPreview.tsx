import { useEffect, useRef } from "react";
import { ArrendadoData, ArrendadoType } from "@/types/arrendado";
import { AliadoConfig } from "@/types/property";
import { Card } from "@/components/ui/card";
import { formatPrecioColombia } from "@/utils/formatters";
import elGestorLogo from "@/assets/el-gestor-logo.png";

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
  size = "historia"
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
  const mainColor = tipo === "arrendado" 
    ? aliadoConfig.colorPrimario 
    : aliadoConfig.colorSecundario;

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
        id="canvas-preview"
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
        <div className="relative h-full flex flex-col px-8 pt-10 pb-6 text-white">
          
          {/* Header: Badge celebratorio */}
          <div className="flex flex-col items-center gap-3 pt-8">
            <div 
              className="px-12 py-6 rounded-3xl font-black text-6xl text-center shadow-2xl animate-scale-in"
              style={{ 
                backgroundColor: mainColor,
                color: "#fff"
              }}
            >
              {badgeText}
            </div>
          </div>

          {/* Centro: PRECIO + Velocidad + Info + CTA (CENTRADO VERTICALMENTE) */}
          <div className="flex flex-col items-center gap-4 my-auto">
            
            {/* PRECIO - 10% más pequeño */}
            <div className="text-center">
              <p className="text-6xl font-black drop-shadow-2xl leading-none">
                {formatPrecioColombia(data.precio)}
              </p>
              {tipo === "arrendado" && (
                <p className="text-lg font-semibold opacity-90 mt-2">/mes</p>
              )}
            </div>

            {/* Línea decorativa */}
            <div className="w-32 h-1 bg-white/50 rounded-full" />

            {/* Velocidad */}
            <div className="bg-white/25 px-8 py-4 rounded-xl">
              <p className="text-3xl font-black drop-shadow-lg">
                {getVelocidadText()}
              </p>
            </div>

            {/* Tipo + Ubicación */}
            <div className="text-center space-y-1">
              <p className="text-3xl font-black drop-shadow-lg">
                {tipoLabel}
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">📍</span>
                <p className="text-2xl font-bold drop-shadow-lg">
                  {data.ubicacion}
                </p>
              </div>
            </div>

            {/* Logo del aliado - 20% más grande */}
            {aliadoConfig.logo && (
              <div className="bg-white/25 px-8 py-4 rounded-xl">
                <img 
                  src={aliadoConfig.logo} 
                  alt={aliadoConfig.nombre}
                  className="h-24 object-contain"
                  crossOrigin="anonymous"
                />
              </div>
            )}

            {/* CTA - AHORA DENTRO DEL BLOQUE CENTRAL */}
            <div className="text-center px-6 mt-2">
              <p className="text-2xl font-black drop-shadow-lg leading-tight">
                {data.ctaCustom || 
                 (tipo === "arrendado" ? aliadoConfig.ctaArrendado : aliadoConfig.ctaVendido) ||
                 `💪 ¿Quieres ${tipo === "arrendado" ? "arrendar" : "vender"} tu inmueble rápido?`}
              </p>
            </div>
          </div>

          {/* Footer: Logo El Gestor - 20% más grande */}
          <div className="flex justify-center pb-2 mt-auto">
            <img 
              src={elGestorLogo} 
              alt="El Gestor"
              className="h-12 object-contain opacity-70"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
