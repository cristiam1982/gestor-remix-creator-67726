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
    // Logo del aliado (superior izquierda)
    if (logoImage) {
      ctx.drawImage(logoImage, 40, 40, 100, 100);
    }

    // Tipo de inmueble
    ctx.fillStyle = aliadoConfig.colorPrimario;
    ctx.fillRect(40, 180, 240, 50);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 28px Poppins, sans-serif";
    ctx.fillText(propertyData.tipo.toUpperCase(), 60, 213);

    // Ubicación
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "32px Poppins, sans-serif";
    ctx.fillText(`📍 ${propertyData.ubicacion || ""}`, 40, 280);

    // Canon/Precio
    ctx.font = "bold 56px Poppins, sans-serif";
    const precio = propertyData.canon || propertyData.valorVenta || "";
    ctx.fillText(precio, 40, 370);

    // Características (habitaciones, baños, etc.)
    let yPos = 450;
    const iconSize = 24;
    ctx.font = "24px Poppins, sans-serif";

    if (propertyData.habitaciones) {
      ctx.fillText(`🛏️ ${propertyData.habitaciones} hab`, 40, yPos);
      yPos += 40;
    }

    if (propertyData.banos) {
      ctx.fillText(`🚿 ${propertyData.banos} baños`, 40, yPos);
      yPos += 40;
    }

    if (propertyData.parqueaderos) {
      ctx.fillText(`🚗 ${propertyData.parqueaderos} parq`, 40, yPos);
      yPos += 40;
    }

    if (propertyData.area) {
      ctx.fillText(`📐 ${propertyData.area}m²`, 40, yPos);
    }

    // Logo El Gestor (inferior derecha)
    if (elGestorLogoImage) {
      ctx.drawImage(elGestorLogoImage, 880, 1780, 160, 100);
    }

    // WhatsApp del aliado (inferior izquierda)
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 28px Poppins, sans-serif";
    ctx.fillText(`📱 ${aliadoConfig.whatsapp}`, 40, 1860);
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
          <div className="absolute inset-0 pointer-events-none text-white p-4">
            {/* Logo aliado */}
            {aliadoConfig.logo && (
              <img
                src={aliadoConfig.logo}
                alt="Logo"
                className="w-20 h-20 object-contain rounded-lg bg-white/10 backdrop-blur-sm p-2"
              />
            )}

            {/* Tipo de inmueble */}
            <div className="mt-4">
              <Badge
                style={{ backgroundColor: aliadoConfig.colorPrimario }}
                className="text-white text-lg px-4 py-2"
              >
                {propertyData.tipo.toUpperCase()}
              </Badge>
            </div>

            {/* Ubicación */}
            <p className="text-2xl font-semibold mt-3">
              📍 {propertyData.ubicacion}
            </p>

            {/* Precio */}
            <p className="text-4xl font-bold mt-3">
              {propertyData.canon || propertyData.valorVenta}
            </p>

            {/* Características */}
            <div className="mt-4 space-y-2 text-lg">
              {propertyData.habitaciones && <p>🛏️ {propertyData.habitaciones} hab</p>}
              {propertyData.banos && <p>🚿 {propertyData.banos} baños</p>}
              {propertyData.parqueaderos && <p>🚗 {propertyData.parqueaderos} parq</p>}
              {propertyData.area && <p>📐 {propertyData.area}m²</p>}
            </div>

            {/* WhatsApp y logo El Gestor abajo */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <p className="text-xl font-bold">📱 {aliadoConfig.whatsapp}</p>
              <img src={elGestorLogo} alt="El Gestor" className="h-16 object-contain" />
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
