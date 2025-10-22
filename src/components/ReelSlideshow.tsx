import { useState, useEffect } from "react";
import { PropertyData, AliadoConfig } from "@/types/property";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download } from "lucide-react";
import { CanvasPreview } from "./CanvasPreview";
import elGestorLogo from "@/assets/el-gestor-logo.png";

interface ReelSlideshowProps {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  onDownload?: () => void;
}

export const ReelSlideshow = ({ propertyData, aliadoConfig, onDownload }: ReelSlideshowProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const slideDuration = 3000; // 3 segundos por foto
  const photos = propertyData.fotos || [];

  useEffect(() => {
    if (!isPlaying || photos.length === 0) return;

    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => {
        const next = (prev + 1) % photos.length;
        if (next === 0) {
          setIsPlaying(false); // Detener al final
          setProgress(0);
        }
        return next;
      });
      setProgress(0);
    }, slideDuration);

    return () => clearInterval(interval);
  }, [isPlaying, photos.length, slideDuration]);

  useEffect(() => {
    if (!isPlaying) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + (100 / (slideDuration / 100));
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [isPlaying, currentPhotoIndex]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePhotoClick = (index: number) => {
    setCurrentPhotoIndex(index);
    setProgress(0);
  };

  if (photos.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          Sube fotos para ver el slideshow animado
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-primary">Reel Slideshow</h3>
            <p className="text-sm text-muted-foreground">
              {photos.length} fotos · {photos.length * 3} segundos total
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            {onDownload && (
              <Button
                variant="hero"
                size="icon"
                onClick={onDownload}
              >
                <Download className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Vista previa principal */}
        <div className="relative aspect-[9/16] max-w-[400px] mx-auto bg-black rounded-xl overflow-hidden shadow-2xl mb-4">
          {/* Barras de progreso */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
            {photos.map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{
                    width: idx < currentPhotoIndex ? "100%" : idx === currentPhotoIndex ? `${progress}%` : "0%"
                  }}
                />
              </div>
            ))}
          </div>

          {/* Foto actual con overlay */}
          <div className="absolute inset-0">
            <img
              src={photos[currentPhotoIndex]}
              alt={`Foto ${currentPhotoIndex + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
          </div>

          {/* Información superpuesta */}
          <div className="absolute top-12 left-0 right-0 p-4 z-10">
            <div className="flex items-center gap-3 mb-2">
              {aliadoConfig.logo && (
                <img
                  src={aliadoConfig.logo}
                  alt={aliadoConfig.nombre}
                  className="w-10 h-10 rounded-full border-2 border-white object-contain"
                />
              )}
              <div>
                <p className="text-white font-bold text-sm">{aliadoConfig.nombre}</p>
                <p className="text-white/80 text-xs">{aliadoConfig.ciudad}</p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
            <h3 className="text-white text-2xl font-bold mb-2">
              {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
            </h3>
            {propertyData.ubicacion && (
              <p className="text-white/90 text-sm mb-3">📍 {propertyData.ubicacion}</p>
            )}
            {propertyData.canon && (
              <p className="text-white text-xl font-bold mb-3">
                💰 {propertyData.canon}/mes
              </p>
            )}
            <div className="flex gap-3 text-white text-sm">
              {propertyData.habitaciones && (
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  🛏️ {propertyData.habitaciones}
                </span>
              )}
              {propertyData.banos && (
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  🚿 {propertyData.banos}
                </span>
              )}
              {propertyData.area && (
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  📐 {propertyData.area}m²
                </span>
              )}
            </div>
          </div>

          {/* Logo El Gestor */}
          <div className="absolute bottom-4 right-4 z-30">
            <img 
              src={elGestorLogo} 
              alt="El Gestor" 
              className="h-8 object-contain opacity-80 drop-shadow-lg"
            />
          </div>

          {/* Play/Pause overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <button
                onClick={handlePlayPause}
                className="w-20 h-20 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 transition-all"
              >
                <Play className="w-10 h-10 text-white ml-1" />
              </button>
            </div>
          )}
        </div>

        {/* Miniaturas */}
        <div className="grid grid-cols-5 gap-2">
          {photos.map((photo, idx) => (
            <button
              key={idx}
              onClick={() => handlePhotoClick(idx)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentPhotoIndex
                  ? "border-primary scale-105"
                  : "border-transparent hover:border-primary/50"
              }`}
            >
              <img
                src={photo}
                alt={`Miniatura ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
              <span className="absolute bottom-1 right-1 text-white text-xs font-bold bg-black/60 px-1 rounded">
                {idx + 1}
              </span>
            </button>
          ))}
        </div>

        {/* Instrucciones */}
        <div className="mt-4 p-3 bg-accent/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            💡 Haz clic en ▶️ para ver la animación del reel. Cada foto se muestra 3 segundos.
          </p>
        </div>
      </Card>
    </div>
  );
};
