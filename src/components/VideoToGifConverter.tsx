import { useState, useRef, useEffect } from "react";
import { PropertyData, AliadoConfig } from "@/types/property";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Film, Download, Info } from "lucide-react";
import { VideoToGifProgress } from "./VideoToGifProgress";
import { extractFramesFromVideo, GIF_PRESETS, estimateGifSize, getOptimalPreset } from "@/utils/videoToGifConverter";
import { VideoGenerationProgress } from "@/utils/videoGenerator";
// @ts-ignore - gif.js doesn't have TypeScript definitions
import GIF from "gif.js";
import html2canvas from "html2canvas";
import elGestorLogo from "@/assets/el-gestor-logo.png";

interface VideoToGifConverterProps {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  onComplete?: (blob: Blob) => void;
}

export const VideoToGifConverter = ({
  propertyData,
  aliadoConfig,
  onComplete,
}: VideoToGifConverterProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<VideoGenerationProgress>({
    stage: "initializing",
    progress: 0,
    message: "Listo para generar",
  });
  const [selectedPreset, setSelectedPreset] = useState<string>(
    getOptimalPreset(propertyData.fotos?.[0] ? 30 : 30)
  );
  const [duration, setDuration] = useState(0);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  const videoUrl = propertyData.fotos?.[0] || "";

  useEffect(() => {
    if (videoRef.current) {
      const handleLoadedMetadata = () => {
        const dur = videoRef.current?.duration || 0;
        setDuration(dur);
        setSelectedPreset(getOptimalPreset(dur));
      };
      videoRef.current.addEventListener("loadedmetadata", handleLoadedMetadata);
    }
  }, [videoUrl]);

  const renderFrameWithOverlay = async (
    videoFrame: HTMLCanvasElement
  ): Promise<HTMLCanvasElement> => {
    if (!canvasRef.current) throw new Error("Canvas container no encontrado");

    // Crear un canvas temporal para combinar video + overlays
    const combinedCanvas = document.createElement("canvas");
    combinedCanvas.width = 1080;
    combinedCanvas.height = 1920;
    const ctx = combinedCanvas.getContext("2d");

    if (!ctx) throw new Error("No se pudo crear contexto de canvas");

    // Dibujar el frame del video de fondo (escalado a 1080x1920)
    ctx.drawImage(videoFrame, 0, 0, 1080, 1920);

    // Capturar los overlays HTML
    const overlayCanvas = await html2canvas(canvasRef.current, {
      scale: 2.5,
      backgroundColor: null,
      logging: false,
      width: 432,
      height: 768,
      useCORS: true,
      allowTaint: false,
    });

    // Superponer los overlays sobre el video
    ctx.drawImage(overlayCanvas, 0, 0, 1080, 1920);

    return combinedCanvas;
  };

  const handleGenerateGif = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsGenerating(true);
    setProgress({
      stage: "initializing",
      progress: 0,
      message: "Inicializando generador de GIF...",
    });

    try {
      const preset = GIF_PRESETS[selectedPreset];
      const video = videoRef.current;

      // Paso 1: Extraer frames del video
      setProgress({
        stage: "capturing",
        progress: 10,
        message: "Extrayendo frames del video...",
      });

      const videoFrames = await extractFramesFromVideo(
        video,
        preset.fps,
        (current, total) => {
          const progressPercent = 10 + (current / total) * 40;
          setProgress({
            stage: "capturing",
            progress: progressPercent,
            currentFrame: current,
            totalFrames: total,
            message: `Extrayendo frame ${current} de ${total}...`,
          });
        }
      );

      // Paso 2: Renderizar cada frame con overlays
      setProgress({
        stage: "capturing",
        progress: 50,
        message: "Renderizando frames con overlays...",
      });

      const overlayedFrames: HTMLCanvasElement[] = [];
      for (let i = 0; i < videoFrames.length; i++) {
        const overlayedFrame = await renderFrameWithOverlay(videoFrames[i]);
        overlayedFrames.push(overlayedFrame);

        const progressPercent = 50 + (i / videoFrames.length) * 20;
        setProgress({
          stage: "capturing",
          progress: progressPercent,
          currentFrame: i + 1,
          totalFrames: videoFrames.length,
          message: `Procesando frame ${i + 1} de ${videoFrames.length}...`,
        });
      }

      // Paso 3: Compilar GIF
      setProgress({
        stage: "encoding",
        progress: 70,
        message: "Compilando GIF animado...",
      });

      const numWorkers = Math.min(navigator.hardwareConcurrency || 2, 8);
      const gif = new GIF({
        workers: numWorkers,
        quality: preset.quality,
        width: Math.round(1080 * preset.scale),
        height: Math.round(1920 * preset.scale),
        workerScript: "/gif.worker.js",
        repeat: 0,
        transparent: null,
        dither: false,
      });

      // Agregar frames al GIF
      const delay = 1000 / preset.fps;
      overlayedFrames.forEach((frame) => {
        // Escalar si es necesario
        if (preset.scale !== 1.0) {
          const scaledCanvas = document.createElement("canvas");
          scaledCanvas.width = Math.round(1080 * preset.scale);
          scaledCanvas.height = Math.round(1920 * preset.scale);
          const ctx = scaledCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(frame, 0, 0, scaledCanvas.width, scaledCanvas.height);
            gif.addFrame(scaledCanvas, { delay });
          }
        } else {
          gif.addFrame(frame, { delay });
        }
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        gif.on("finished", (blob: Blob) => {
          setProgress({
            stage: "complete",
            progress: 100,
            message: "¡GIF generado exitosamente!",
          });
          resolve(blob);
        });

        gif.on("progress", (p: number) => {
          setProgress({
            stage: "encoding",
            progress: 70 + p * 30,
            message: `Compilando GIF... ${Math.round(p * 100)}%`,
          });
        });

        gif.on("error", reject);
        gif.render();
      });

      setGeneratedBlob(blob);
      onComplete?.(blob);
    } catch (error) {
      console.error("Error generando GIF:", error);
      setProgress({
        stage: "error",
        progress: 0,
        message: error instanceof Error ? error.message : "Error generando GIF",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedBlob) return;

    const url = URL.createObjectURL(generatedBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reel-${propertyData.tipo}-${Date.now()}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!videoUrl) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Sube un video para comenzar</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview del video con overlays */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 text-primary">
          Preview del Reel (GIF Animado)
        </h3>

        <div className="relative aspect-[9/16] max-w-[400px] mx-auto bg-black rounded-xl overflow-hidden shadow-2xl">
          {/* Video oculto para extraer frames */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
          />

          {/* Canvas overlay (visible) - Esto se capturará para el GIF */}
          <div
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: 432, height: 768 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

            {/* Header */}
            <div className="absolute top-4 left-0 right-0 p-4">
              <div className="flex items-center gap-3">
                {aliadoConfig.logo && (
                  <img
                    src={aliadoConfig.logo}
                    alt={aliadoConfig.nombre}
                    className="w-10 h-10 rounded-full border-2 border-white object-contain"
                    data-ally-logo
                  />
                )}
                <div>
                  <p className="text-white font-bold text-sm">
                    {aliadoConfig.nombre}
                  </p>
                  <p className="text-white/80 text-xs">{aliadoConfig.ciudad}</p>
                </div>
              </div>
            </div>

            {/* Información inferior */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-white text-2xl font-bold mb-2">
                {propertyData.tipo.charAt(0).toUpperCase() +
                  propertyData.tipo.slice(1)}
              </h3>
              {propertyData.ubicacion && (
                <p className="text-white/90 text-sm mb-3">
                  📍 {propertyData.ubicacion}
                </p>
              )}
              {propertyData.canon && (
                <p className="text-white text-xl font-bold mb-3">
                  💰 {propertyData.canon}/mes
                </p>
              )}
              <div className="flex gap-3 text-white text-sm flex-wrap">
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
        </div>
      </Card>

      {/* Configuración de calidad */}
      {!isGenerating && !generatedBlob && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Configuración del GIF</h3>
            </div>

            <div className="space-y-2">
              <Label>Calidad</Label>
              <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GIF_PRESETS).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      {preset.description} - {preset.fps} FPS
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-accent/50 rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold mb-1">
                  Tamaño estimado: {estimateGifSize(duration, GIF_PRESETS[selectedPreset].fps)}
                </p>
                <p>
                  El GIF incluirá todos los overlays (logos, textos) integrados.
                  Tiempo de generación: 1-3 minutos.
                </p>
              </div>
            </div>

            <Button onClick={handleGenerateGif} className="w-full" size="lg">
              <Film className="w-5 h-5 mr-2" />
              Generar GIF Animado
            </Button>
          </div>
        </Card>
      )}

      {/* Progreso */}
      {isGenerating && <VideoToGifProgress progress={progress} />}

      {/* Descarga */}
      {generatedBlob && !isGenerating && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-3">
                <Download className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">¡GIF Listo! ✨</h3>
              <p className="text-sm text-muted-foreground mb-1">
                Tamaño: {(generatedBlob.size / (1024 * 1024)).toFixed(1)} MB
              </p>
              <p className="text-xs text-muted-foreground">
                Duración: {duration.toFixed(1)}s a {GIF_PRESETS[selectedPreset].fps} FPS
              </p>
            </div>

            <Button onClick={handleDownload} className="w-full" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Descargar GIF
            </Button>

            <Button
              onClick={() => {
                setGeneratedBlob(null);
                setProgress({
                  stage: "initializing",
                  progress: 0,
                  message: "Listo para generar",
                });
              }}
              variant="outline"
              className="w-full"
            >
              Generar Nuevo GIF
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
