import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Download, AlertCircle } from "lucide-react";
import { PropertyData, AliadoConfig } from "@/types/property";
import { VideoRecordingProgress } from "@/components/VideoRecordingProgress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import elGestorLogo from "@/assets/el-gestor-logo.png";

interface VideoReelRecorderProps {
  videoUrl: string;
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  onComplete: (blob: Blob, duration: number) => void;
}

export const VideoReelRecorder = ({
  videoUrl,
  propertyData,
  aliadoConfig,
  onComplete,
}: VideoReelRecorderProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [recordingStage, setRecordingStage] = useState<"idle" | "recording" | "processing" | "complete">("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [elGestorLogoImage, setElGestorLogoImage] = useState<HTMLImageElement | null>(null);
  const [isCompatible, setIsCompatible] = useState(true);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  // Verificar compatibilidad del navegador
  useEffect(() => {
    const compatible = 
      typeof MediaRecorder !== "undefined" && 
      HTMLCanvasElement.prototype.captureStream !== undefined;
    
    setIsCompatible(compatible);
  }, []);

  // Precargar logos como Image objects para canvas
  useEffect(() => {
    const loadLogos = async () => {
      // Logo del aliado
      if (aliadoConfig.logo) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = aliadoConfig.logo;
          await img.decode();
          setLogoImage(img);
        } catch (error) {
          console.error("Error loading aliado logo:", error);
        }
      }

      // Logo de El Gestor
      try {
        const img = new Image();
        img.src = elGestorLogo;
        await img.decode();
        setElGestorLogoImage(img);
      } catch (error) {
        console.error("Error loading El Gestor logo:", error);
      }
    };

    loadLogos();
  }, [aliadoConfig.logo]);

  // Configurar video cuando cargue
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => video.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, []);

  // Detectar formato de video soportado
  const getSupportedMimeType = (): string => {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    
    return types.find(type => MediaRecorder.isTypeSupported(type)) || "video/webm";
  };

  // Dibujar overlays en canvas
  const drawOverlays = (ctx: CanvasRenderingContext2D) => {
    // Sombra para mejorar legibilidad
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    // Logo del aliado (superior izquierda) - más grande
    if (logoImage) {
      // Fondo semi-transparente para el logo
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(30, 30, 160, 160);
      ctx.drawImage(logoImage, 40, 40, 140, 140);
    }

    // Reset shadow para el resto
    ctx.shadowBlur = 15;

    // Tipo de inmueble - badge más grande y redondeado
    const badgeY = logoImage ? 220 : 50;
    ctx.fillStyle = aliadoConfig.colorPrimario;
    ctx.beginPath();
    ctx.roundRect(40, badgeY, 300, 70, 15);
    ctx.fill();
    
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 38px Poppins, sans-serif";
    ctx.fillText(propertyData.tipo.toUpperCase(), 60, badgeY + 48);

    // Ubicación - más prominente
    const ubicacionY = badgeY + 100;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 42px Poppins, sans-serif";
    ctx.fillText(`📍 ${propertyData.ubicacion || ""}`, 40, ubicacionY);

    // Canon/Precio - mucho más grande y visible
    const precioY = ubicacionY + 80;
    ctx.font = "bold 72px Poppins, sans-serif";
    const precio = propertyData.canon || propertyData.valorVenta || "";
    ctx.fillText(precio, 40, precioY);

    // Características - con fondo semi-transparente
    let yPos = precioY + 80;
    ctx.font = "32px Poppins, sans-serif";

    const features = [];
    if (propertyData.habitaciones) features.push(`🛏️ ${propertyData.habitaciones} hab`);
    if (propertyData.banos) features.push(`🚿 ${propertyData.banos} baños`);
    if (propertyData.parqueaderos) features.push(`🚗 ${propertyData.parqueaderos} parq`);
    if (propertyData.area) features.push(`📐 ${propertyData.area}m²`);

    features.forEach((feature) => {
      // Fondo para cada característica
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(30, yPos - 35, 320, 50);
      
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(feature, 40, yPos);
      yPos += 60;
    });

    // Sección inferior con información de contacto
    const bottomY = 1700;
    
    // Fondo semi-transparente para la sección inferior
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, bottomY, 1080, 220);

    // WhatsApp del aliado (inferior izquierda) - más grande
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 40px Poppins, sans-serif";
    ctx.fillText(`📱 ${aliadoConfig.whatsapp}`, 40, bottomY + 80);

    // Nombre del aliado debajo del WhatsApp
    ctx.font = "28px Poppins, sans-serif";
    ctx.fillStyle = "#E0E0E0";
    ctx.fillText(aliadoConfig.nombre, 40, bottomY + 130);

    // Logo El Gestor (inferior derecha) - más grande y mejor posicionado
    if (elGestorLogoImage) {
      ctx.drawImage(elGestorLogoImage, 850, bottomY + 40, 190, 120);
    }

    // Reset shadow
    ctx.shadowBlur = 0;
  };

  // Iniciar grabación
  const startRecording = async () => {
    const canvas = canvasRef.current;
    const video = hiddenVideoRef.current;
    
    if (!canvas || !video) return;

    try {
      setIsRecording(true);
      setRecordingStage("recording");
      chunksRef.current = [];

      // Configurar stream del canvas a 30 FPS
      const stream = canvas.captureStream(30);
      
      // Opciones de MediaRecorder
      const mimeType = getSupportedMimeType();
      const options = {
        mimeType,
        videoBitsPerSecond: 5000000, // 5 Mbps
      };

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        setRecordingStage("processing");
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setGeneratedBlob(blob);
        setRecordingStage("complete");
        setIsRecording(false);
        onComplete(blob, video.duration);
      };

      // Iniciar grabación
      recorder.start(100); // Guardar datos cada 100ms

      // Iniciar video desde el principio
      video.currentTime = 0;
      await video.play();

      // Iniciar animación de canvas
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const animate = () => {
        if (!video.paused && !video.ended) {
          // Dibujar frame del video
          ctx.clearRect(0, 0, 1080, 1920);
          ctx.drawImage(video, 0, 0, 1080, 1920);
          
          // Dibujar overlays
          drawOverlays(ctx);
          
          // Actualizar progreso
          setCurrentTime(video.currentTime);
          
          requestAnimationFrame(animate);
        }
      };

      animate();

      // Detener cuando termine el video
      video.onended = () => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      };

    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
      setRecordingStage("idle");
    }
  };

  // Descargar video generado
  const handleDownload = () => {
    if (!generatedBlob) return;

    const url = URL.createObjectURL(generatedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reel-${aliadoConfig.nombre}-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Toggle play/pause del preview
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  if (!isCompatible) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Tu navegador no soporta grabación de video. Por favor usa Chrome, Firefox o Safari actualizado.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview visible */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Vista Previa del Video</h3>
        
        <div className="relative aspect-[9/16] max-w-[400px] mx-auto bg-black rounded-xl overflow-hidden shadow-2xl">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            onTimeUpdate={(e) => !isRecording && setCurrentTime(e.currentTarget.currentTime)}
          />
          
          {/* Overlays preview */}
          <div className="absolute inset-0 pointer-events-none text-white">
            {/* Logo aliado - más grande */}
            {aliadoConfig.logo && (
              <div className="absolute top-3 left-3 w-32 h-32 bg-black/30 rounded-lg p-2">
                <img
                  src={aliadoConfig.logo}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* Contenido superior */}
            <div className="absolute top-3 left-3 right-3" style={{ top: aliadoConfig.logo ? '140px' : '12px' }}>
              {/* Tipo de inmueble - badge más grande */}
              <Badge
                style={{ backgroundColor: aliadoConfig.colorPrimario }}
                className="text-white text-xl px-6 py-3 rounded-xl shadow-lg"
              >
                {propertyData.tipo.toUpperCase()}
              </Badge>

              {/* Ubicación - más prominente */}
              <p className="text-3xl font-bold mt-4 drop-shadow-lg">
                📍 {propertyData.ubicacion}
              </p>

              {/* Precio - más grande */}
              <p className="text-5xl font-bold mt-4 drop-shadow-lg">
                {propertyData.canon || propertyData.valorVenta}
              </p>

              {/* Características con fondo */}
              <div className="mt-4 space-y-2 text-2xl">
                {propertyData.habitaciones && (
                  <div className="bg-black/40 inline-block px-4 py-2 rounded-lg">
                    🛏️ {propertyData.habitaciones} hab
                  </div>
                )}
                {propertyData.banos && (
                  <div className="bg-black/40 inline-block px-4 py-2 rounded-lg ml-2">
                    🚿 {propertyData.banos} baños
                  </div>
                )}
                {propertyData.parqueaderos && (
                  <div className="bg-black/40 inline-block px-4 py-2 rounded-lg mt-2">
                    🚗 {propertyData.parqueaderos} parq
                  </div>
                )}
                {propertyData.area && (
                  <div className="bg-black/40 inline-block px-4 py-2 rounded-lg ml-2">
                    📐 {propertyData.area}m²
                  </div>
                )}
              </div>
            </div>

            {/* Sección inferior con fondo */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
              <div className="flex justify-between items-center">
                {/* WhatsApp y nombre */}
                <div>
                  <p className="text-3xl font-bold drop-shadow-lg">📱 {aliadoConfig.whatsapp}</p>
                  <p className="text-lg text-gray-200 mt-1">{aliadoConfig.nombre}</p>
                </div>
                
                {/* Logo El Gestor */}
                <img 
                  src={elGestorLogo} 
                  alt="El Gestor" 
                  className="h-20 object-contain drop-shadow-lg" 
                />
              </div>
            </div>
          </div>

          {/* Control de play/pause */}
          {!isRecording && (
            <button
              onClick={handlePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-16 h-16 text-white" />
              ) : (
                <Play className="w-16 h-16 text-white" />
              )}
            </button>
          )}
        </div>

        {/* Botones de acción */}
        <div className="mt-6 space-y-3">
          {recordingStage === "idle" && (
            <Button
              onClick={startRecording}
              variant="hero"
              size="lg"
              className="w-full"
              disabled={isRecording || !logoImage}
            >
              🎬 Generar Video con Overlays
            </Button>
          )}

          {recordingStage === "complete" && generatedBlob && (
            <Button
              onClick={handleDownload}
              variant="hero"
              size="lg"
              className="w-full"
            >
              <Download className="w-5 h-5 mr-2" />
              Descargar Video ({(generatedBlob.size / (1024 * 1024)).toFixed(1)} MB)
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          💡 El video se procesará en tiempo real (~{Math.round(duration)}s). 
          Formato: WebM compatible con todas las redes sociales.
        </p>
      </Card>

      {/* Canvas oculto para grabación */}
      <canvas
        ref={canvasRef}
        width={1080}
        height={1920}
        className="hidden"
      />

      {/* Video oculto para grabación */}
      <video
        ref={hiddenVideoRef}
        src={videoUrl}
        className="hidden"
        muted
        playsInline
        crossOrigin="anonymous"
      />

      {/* Progreso de grabación */}
      {(recordingStage === "recording" || recordingStage === "processing") && (
        <VideoRecordingProgress
          currentTime={currentTime}
          duration={duration}
          stage={recordingStage}
        />
      )}
    </div>
  );
};
