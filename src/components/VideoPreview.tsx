import { useRef, useState } from "react";
import { PropertyData, AliadoConfig } from "@/types/property";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, AlertCircle } from "lucide-react";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";
import { formatPrecioColombia } from "@/utils/formatters";

interface VideoPreviewProps {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
}

export const VideoPreview = ({ propertyData, aliadoConfig }: VideoPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoUrl = propertyData.fotos?.[0] || "";

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      
      // Validar duración máxima de 100 segundos
      if (dur > 100) {
        setError("⚠️ El video excede los 100 segundos máximos permitidos.");
      } else if (dur > 60) {
        setError("ℹ️ Tu video dura más de 60s. Funcionará en Instagram y TikTok, pero NO en YouTube Shorts (máx 60s).");
      } else {
        setError(null);
      }
    }
  };

  const handleError = () => {
    setError("❌ Error al cargar el video. Verifica que el formato sea compatible (MP4, MOV).");
  };

  if (!videoUrl) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Sube un video para ver la vista previa</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-primary">Reel con Video</h3>
            {duration > 0 && (
              <>
                <p className="text-sm text-muted-foreground">
                  ⏱️ Duración: {duration.toFixed(1)} segundos
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    duration <= 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    Instagram {duration <= 100 ? '✓' : '✗'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    duration <= 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    TikTok {duration <= 100 ? '✓' : '✗'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    duration <= 60 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    YouTube Shorts {duration <= 60 ? '✓' : '✗'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    duration <= 90 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    Facebook {duration <= 90 ? '✓' : '⚠️'}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleMuteToggle}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Error o advertencia */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Vista previa del video */}
        <div className="relative aspect-story max-w-[400px] mx-auto bg-black rounded-xl overflow-hidden shadow-2xl">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            onLoadedMetadata={handleLoadedMetadata}
            onError={handleError}
            onEnded={() => setIsPlaying(false)}
            muted={isMuted}
            playsInline
          />

          {/* Overlay con información */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
            
            {/* Header */}
            <div className="absolute top-4 left-0 right-0 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={logoRubyMorales}
                  alt={aliadoConfig.nombre}
                  className="w-10 h-10 rounded-full border-2 border-white object-contain"
                />
                <div>
                  <p className="text-white font-bold text-sm">{aliadoConfig.nombre}</p>
                  <p className="text-white/80 text-xs">{aliadoConfig.ciudad}</p>
                </div>
              </div>
            </div>

            {/* Información inferior */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-white text-2xl font-bold mb-2">
                {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
              </h3>
              {propertyData.ubicacion && (
                <p className="text-white/90 text-sm mb-3">📍 {propertyData.ubicacion}</p>
              )}
              {(() => {
                const esVenta = propertyData.modalidad === "venta" || (!!propertyData.valorVenta && !propertyData.canon);
                const precio = esVenta ? propertyData.valorVenta : propertyData.canon;
                if (!precio) return null;
                return (
                  <p className="text-white text-xl font-bold mb-3">
                    💰 {formatPrecioColombia(precio)}{esVenta ? "" : "/mes"}
                  </p>
                );
              })()}
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
          </div>

          {/* Play/Pause button */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
            {!isPlaying && (
              <button
                onClick={handlePlayPause}
                className="w-20 h-20 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 transition-all"
              >
                <Play className="w-10 h-10 text-white ml-1" />
              </button>
            )}
          </div>
        </div>

        {/* Instrucciones */}
        <div className="p-3 bg-accent/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            💡 Duración recomendada: 30-60 segundos (óptimo para todas las redes). Máximo: 100s. Se generará un GIF animado con todos los overlays integrados.
          </p>
        </div>

        {/* Advertencia de tiempo de procesamiento */}
        {duration > 60 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              ⏳ <strong>Videos largos (&gt;60s):</strong> El procesamiento puede tardar 2-4 minutos. Ten paciencia mientras se genera tu reel.
            </p>
          </div>
        )}

        {/* Botón de control visible */}
        <Button
          onClick={handlePlayPause}
          variant="outline"
          className="w-full"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Pausar Video
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Reproducir Video
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
