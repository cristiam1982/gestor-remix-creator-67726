import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Download, AlertCircle } from "lucide-react";
import { PropertyData, AliadoConfig } from "@/types/property";
import { ArrendadoData } from "@/types/arrendado";
import { formatPrecioColombia } from "@/utils/formatters";
import { VideoRecordingProgress } from "@/components/VideoRecordingProgress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";
import FFmpegManager from "@/utils/ffmpegManager";
import { renderOverlayImage } from "@/utils/overlayRenderer";
import { addOverlaysWithFFmpeg } from "@/utils/fastVideoOverlay";

interface VideoReelRecorderProps {
  videoUrl: string;
  propertyData: PropertyData | ArrendadoData;
  aliadoConfig: AliadoConfig;
  variant?: "disponible" | "arrendado" | "vendido";
  onComplete: (blob: Blob, duration: number) => void;
}

export const VideoReelRecorder = ({
  videoUrl,
  propertyData,
  aliadoConfig,
  variant = "disponible",
  onComplete,
}: VideoReelRecorderProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const { toast } = useToast();
  
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
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = aliadoConfig.logo || logoRubyMorales;
        await img.decode();
        setLogoImage(img);
      } catch (error) {
        console.error("Error loading aliado logo:", error);
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
  }, []);

  // Log para debugging
  useEffect(() => {
    console.log('[VideoReelRecorder] Estado actual:', {
      variant,
      hasVideoUrl: !!videoUrl,
      videoUrlLength: videoUrl?.length,
      videoUrlPreview: videoUrl?.substring(0, 50) + '...',
      hasLogoImage: !!logoImage,
      hasElGestorLogo: !!elGestorLogoImage,
      propertyDataKeys: Object.keys(propertyData),
      isArrendado: variant === "arrendado" || variant === "vendido"
    });
  }, [variant, videoUrl, logoImage, elGestorLogoImage, propertyData]);

  // Configurar video cuando cargue
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      console.log('[VideoReelRecorder] Video cargado correctamente, duración:', video.duration);
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
    const isArrendadoVariant = variant === "arrendado" || variant === "vendido";
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Sombra para mejorar legibilidad
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    if (isArrendadoVariant) {
      // ===== DISEÑO CELEBRATORIO PARA ARRENDADO/VENDIDO =====
      const arrendadoData = propertyData as ArrendadoData;
      const mainColor = variant === "arrendado" 
        ? aliadoConfig.colorPrimario 
        : aliadoConfig.colorSecundario;
      const badgeText = variant === "arrendado" ? "¡ARRENDADO!" : "¡VENDIDO!";
      
      // Logo del aliado (superior izquierda) - MÁS GRANDE
      if (logoImage) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.roundRect(30, 30, 260, 260, 20);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.drawImage(logoImage, 40, 40, 240, 240);
      }
      
      // Resetear sombra antes del badge (sin sombra negra)
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Badge celebratorio - fondo sólido corporativo con texto blanco
      ctx.fillStyle = mainColor;
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.roundRect(40, 250, 1000, 120, 20);
      ctx.fill();
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 68px Poppins, sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 10;
      ctx.fillText(badgeText, canvas.width / 2, 335);
      ctx.shadowBlur = 0;
      
      // Validar que los datos estén completos
      if (!arrendadoData.precio || !arrendadoData.diasEnMercado) {
        console.error("Datos de arrendado incompletos");
        return;
      }
      
      // Restaurar sombra para otros elementos
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      
      // Precio prominente - más cerca del badge
      ctx.textAlign = "center";
      ctx.fillStyle = "white";
      ctx.font = "bold 72px Poppins, sans-serif";
      ctx.fillText(formatPrecioColombia(arrendadoData.precio), canvas.width / 2, 470);
      if (variant === "arrendado") {
        ctx.font = "bold 36px Poppins, sans-serif";
        ctx.fillText("/mes", canvas.width / 2, 520);
      }
      
      // Velocidad - como badge secundario
      const diasTexto = arrendadoData.diasEnMercado <= 7 
        ? `🚀 ¡RÉCORD! En solo ${arrendadoData.diasEnMercado} día${arrendadoData.diasEnMercado === 1 ? '' : 's'}`
        : arrendadoData.diasEnMercado <= 15
        ? `⚡ En solo ${arrendadoData.diasEnMercado} días`
        : `🎉 En ${arrendadoData.diasEnMercado} días`;
      ctx.font = "36px Poppins, sans-serif";
      ctx.fillText(diasTexto, canvas.width / 2, 590);
      
      // Tipo de inmueble
      const tipoLabel = {
        apartamento: "Apartamento",
        casa: "Casa",
        local: "Local Comercial",
        oficina: "Oficina",
        bodega: "Bodega",
        lote: "Lote"
      }[arrendadoData.tipo] || arrendadoData.tipo;
      
      ctx.font = "bold 44px Poppins, sans-serif";
      ctx.fillText(tipoLabel, canvas.width / 2, 1100);
      
      // Ubicación
      ctx.font = "bold 48px Poppins, sans-serif";
      ctx.fillText(
        `📍 ${arrendadoData.ubicacion}`,
        canvas.width / 2,
        1200
      );
      
      // CTA inferior - MÁS GRANDE
      ctx.font = "bold 42px Inter, sans-serif";
      ctx.fillText(
        `💪 ¿Quieres ${variant === "arrendado" ? "arrendar" : "vender"} tu inmueble rápido?`,
        canvas.width / 2,
        1580
      );
      
    } else {
      // ===== DISEÑO ACTUAL PARA INMUEBLES DISPONIBLES =====
      const propData = propertyData as PropertyData;
      
      // Logo del aliado (superior izquierda) - formato cuadrado AMPLIADO
      if (logoImage) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.roundRect(30, 30, 240, 240, 20);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.drawImage(logoImage, 42, 42, 216, 216);
      }

      ctx.shadowBlur = 15;

      // Tipo de inmueble
      const badgeY = logoImage ? 290 : 50;
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.roundRect(40, badgeY, 300, 70, 15);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 38px Poppins, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(propData.tipo.toUpperCase(), 60, badgeY + 48);

      // Ubicación
      const ubicacionY = badgeY + 100;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 42px Poppins, sans-serif";
      ctx.fillText(`📍 ${propData.ubicacion || ""}`, 40, ubicacionY);

      // Canon/Precio
      const precioY = ubicacionY + 80;
      ctx.font = "bold 56px Poppins, sans-serif";
      const esVenta = propData.modalidad === "venta" || (!!propData.valorVenta && !propData.canon);
      const precioRaw = esVenta ? propData.valorVenta : propData.canon;
      const precioFmt = formatPrecioColombia(precioRaw || "");
      ctx.fillText(`${precioFmt}${esVenta ? "" : "/mes"}`, 40, precioY);

      // Características
      let yPos = precioY + 80;
      ctx.font = "32px Poppins, sans-serif";

      const features = [];
      if (propData.habitaciones) features.push(`🛏️ ${propData.habitaciones} hab`);
      if (propData.banos) features.push(`🚿 ${propData.banos} baños`);
      if (propData.parqueaderos) features.push(`🚗 ${propData.parqueaderos} parq`);
      if (propData.estrato) features.push(`🏢 Estrato ${propData.estrato}`);
      if (propData.piso) features.push(`🏢 Piso ${propData.piso}`);
      if (propData.trafico) features.push(`🚦 Tráfico ${propData.trafico}`);
      if (propData.alturaLibre) features.push(`📏 ${propData.alturaLibre}m altura`);
      if (propData.vitrina) features.push(`🪟 Con vitrina`);
      if (propData.uso) features.push(`🏗️ Uso ${propData.uso}`);
      if (propData.area) features.push(`📐 ${propData.area}m²`);

      features.forEach((feature) => {
        const bgColor = aliadoConfig.colorSecundario || "#000000";
        ctx.fillStyle = `${bgColor}F0`;
        ctx.beginPath();
        ctx.roundRect(30, yPos - 35, 320, 50, 12);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(feature, 40, yPos);
        yPos += 60;
      });
    }

    // Logo El Gestor (right-4 bottom-12, h=40 para paridad con Canvas)
    if (elGestorLogoImage) {
      const gestorHeight = 40;
      const gestorAspectRatio = elGestorLogoImage.width / elGestorLogoImage.height;
      const gestorWidth = gestorHeight * gestorAspectRatio;
      const gestorX = 1080 - gestorWidth - 16; // right-4
      const gestorY = 1920 - gestorHeight - 48; // bottom-12
      
      ctx.save();
      // Drop-shadow equivalente al DOM (sin globalAlpha)
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      ctx.drawImage(elGestorLogoImage, gestorX, gestorY, gestorWidth, gestorHeight);
      ctx.restore();
    }

    // Reset shadow
    ctx.shadowBlur = 0;
  };

  // Iniciar grabación con MediaRecorder (fallback)
  const startRecordingWithMediaRecorder = async () => {
    const canvas = canvasRef.current;
    const video = hiddenVideoRef.current;
    
    if (!canvas || !video) return;

    try {
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
      console.error("Error starting recording with MediaRecorder:", error);
      setIsRecording(false);
      setRecordingStage("idle");
      throw error;
    }
  };

  // Iniciar grabación - intenta FFmpeg primero, fallback a MediaRecorder
  const startRecording = async () => {
    const video = hiddenVideoRef.current;
    if (!video) return;

    setIsRecording(true);
    setRecordingStage("recording");
    setCurrentTime(0);

    try {
      console.log("🔄 Cargando FFmpeg para procesamiento rápido...");
      
      // Intentar usar FFmpeg con timeout de 15 segundos
      const ffmpeg = FFmpegManager.getInstance();
      
      if (!ffmpeg.isLoaded()) {
        toast({
          title: "⚡ Preparando procesamiento rápido",
          description: "Cargando optimizador de video...",
        });
        
        const loadPromise = ffmpeg.load((progress) => {
          setCurrentTime(progress * 0.2 * video.duration);
        });
        
        const timeoutPromise = new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('FFmpeg load timeout')), 15000)
        );
        
        await Promise.race([loadPromise, timeoutPromise]);
      }
      
      console.log("✅ FFmpeg cargado, generando overlay...");
      
      // Convertir video a Blob
      console.log("📦 Convirtiendo video a blob...");
      const videoBlob = await fetch(videoUrl).then(r => r.blob());
      console.log(`📦 Video blob size: ${videoBlob.size} bytes`);
      
      // Renderizar overlays como PNG
      console.log("🎨 Generando overlays...");
      const overlayPng = await renderOverlayImage(
        propertyData,
        aliadoConfig,
        variant,
        logoImage,
        elGestorLogoImage
      );
      console.log(`🎨 Overlay PNG size: ${overlayPng.size} bytes`);
      
      console.log("⚡ Procesando video con FFmpeg...");
      
      // Procesar con FFmpeg
      const resultBlob = await addOverlaysWithFFmpeg(
        videoBlob,
        overlayPng,
        (progress, stage) => {
          const mappedProgress = 0.4 + (progress / 100) * 0.6;
          setCurrentTime(mappedProgress * video.duration);
        }
      );
      
      setGeneratedBlob(resultBlob);
      setRecordingStage("complete");
      setIsRecording(false);
      
      toast({
        title: "✅ Video generado (procesamiento rápido)",
        description: "Tu video está listo para descargar",
      });
      
      onComplete(resultBlob, video.duration);
      
    } catch (ffmpegError) {
      console.warn("⚠️ FFmpeg no disponible, usando MediaRecorder:", ffmpegError);
      
      // Resetear estado antes del fallback
      setCurrentTime(0);
      
      toast({
        title: "🔄 Usando método compatible",
        description: "El video se generará en tiempo real (puede tardar más)",
      });
      
      // Fallback a MediaRecorder
      try {
        await startRecordingWithMediaRecorder();
      } catch (mediaRecorderError) {
        console.error("❌ Error en MediaRecorder:", mediaRecorderError);
        setIsRecording(false);
        setRecordingStage("idle");
        toast({
          title: "Error al generar video",
          description: "Por favor intenta nuevamente",
          variant: "destructive",
        });
      }
    }
  };

  // Descargar video generado
  const handleDownload = () => {
    if (!generatedBlob) return;

    const url = URL.createObjectURL(generatedBlob);
    const a = document.createElement("a");
    a.href = url;
    const ext = generatedBlob.type.includes('mp4') ? 'mp4' : generatedBlob.type.includes('webm') ? 'webm' : 'mp4';
    a.download = `reel-${aliadoConfig.nombre}-${Date.now()}.${ext}`;
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
            onError={(e) => {
              console.error('[VideoReelRecorder] Error loading video:', e);
              toast({
                title: "❌ Error al cargar el video",
                description: "El formato de video no es compatible. Intenta con MP4.",
                variant: "destructive",
              });
            }}
            onLoadedMetadata={() => {
              console.log('[VideoReelRecorder] Video metadata cargada');
            }}
          />
          
          {/* Overlays preview */}
          <div className="absolute inset-0 pointer-events-none text-white">
            {variant === "arrendado" || variant === "vendido" ? (
              // ===== PREVIEW CELEBRATORIO =====
              <>
                {/* Logo aliado más grande */}
                <div 
                  className="absolute rounded-2xl border-[3px] bg-white/90"
                  style={{ 
                    top: '11px', 
                    left: '11px', 
                    width: '96px',  // Canvas: 260px → 96px (260 * 400/1080)
                    height: '96px',
                    padding: '4px',
                    borderColor: 'rgba(255, 255, 255, 0.8)'
                  }}
                >
                  <img
                    src={aliadoConfig.logo || logoRubyMorales}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Badge celebratorio (sin sombra negra, 10% más grande) */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 rounded-2xl font-black text-center"
                  style={{
                    top: '118px',  // Canvas: 320px → 118px (320 * 400/1080)
                    backgroundColor: 'white',
                    color: variant === "arrendado" ? aliadoConfig.colorPrimario : aliadoConfig.colorSecundario,
                    padding: '14px 35px',
                    fontSize: '26px'  // Canvas: 62px → 26px (62 * 400/1080 + ajuste)
                  }}
                >
                  {variant === "arrendado" ? "¡ARRENDADO!" : "¡VENDIDO!"}
                </div>

                {/* Precio prominente (centro) */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 text-center"
                  style={{ top: '350px' }}
                >
                  <p className="text-[12px] font-bold drop-shadow-lg opacity-90">
                    {variant === "arrendado" ? "Arrendado por:" : "Vendido por:"}
                  </p>
                  <p className="text-[36px] font-black drop-shadow-2xl leading-none">
                    {formatPrecioColombia(('precio' in propertyData) ? propertyData.precio : '')}
                  </p>
                  {variant === "arrendado" && (
                    <p className="text-[13px] font-bold opacity-80">/mes</p>
                  )}
                </div>

                {/* Velocidad */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ top: '435px' }}
                >
                  <p className="text-[15px] font-bold drop-shadow-lg">
                    {(() => {
                      const dias = ('diasEnMercado' in propertyData) ? propertyData.diasEnMercado : 0;
                      if (dias <= 7) return `🚀 En solo ${dias} día${dias === 1 ? '' : 's'}`;
                      if (dias <= 15) return `⚡ En ${dias} días`;
                      return `🎉 En ${dias} días`;
                    })()}
                  </p>
                </div>

                {/* Tipo + Ubicación */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 text-center"
                  style={{ top: '485px' }}
                >
                  <p className="text-[16px] font-extrabold drop-shadow-lg">
                    {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
                  </p>
                  <p className="text-[16px] font-semibold drop-shadow-lg">
                    📍 {propertyData.ubicacion}
                  </p>
                </div>

                {/* CTA inferior */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 text-center"
                  style={{ bottom: '75px' }}
                >
                  <p className="text-[16px] font-bold drop-shadow-lg">
                    💪 ¿Quieres {variant === "arrendado" ? "arrendar" : "vender"} tu inmueble rápido?
                  </p>
                </div>

                {/* Logo El Gestor inferior (marca secundaria) */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2"
                  style={{ bottom: '18px' }}
                >
                  <img 
                    src={elGestorLogo}
                    alt="El Gestor"
                    className="h-[30px] object-contain opacity-75"
                  />
                </div>
              </>
            ) : (
              // ===== PREVIEW DISPONIBLE =====
              <>
                {/* Logo aliado - Canvas: 240x240px → Preview: 88px */}
                <div 
                  className="absolute rounded-xl border-2 bg-white/90"
                  style={{ 
                    top: '11px', 
                    left: '11px', 
                    width: '88px', 
                    height: '88px',
                    padding: '2px',
                    borderColor: 'rgba(255, 255, 255, 0.8)'
                  }}
                >
                  <img
                    src={aliadoConfig.logo || logoRubyMorales}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Ciudad junto al logo */}
                <div 
                  className="absolute"
                  style={{ 
                    left: '103px', 
                    top: '26px'
                  }}
                >
                  <p className="text-sm font-semibold text-white drop-shadow-lg">
                    {aliadoConfig.ciudad}
                  </p>
                </div>

                {/* Contenido superior */}
                <div 
                  className="absolute left-[11px] right-[11px]" 
                  style={{ top: '107px' }}
                >
                  {/* Tipo de inmueble */}
                  <Badge
                    style={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      padding: '10px 22px',
                      borderRadius: '6px'
                    }}
                    className="text-white shadow-lg inline-block"
                  >
                    {propertyData.tipo.toUpperCase()}
                  </Badge>

                  {/* Ubicación */}
                  <p 
                    className="font-bold drop-shadow-lg"
                    style={{ 
                      fontSize: '16px',
                      marginTop: '15px'
                    }}
                  >
                    📍 {propertyData.ubicacion}
                  </p>

                  {/* Precio */}
                  {(() => {
                    const propData = propertyData as PropertyData;
                    const esVenta = propData.modalidad === "venta" || (!!propData.valorVenta && !propData.canon);
                    const precio = esVenta ? propData.valorVenta : propData.canon;
                    
                    if (!precio) return null;
                    
                    return (
                      <p 
                        className="font-bold drop-shadow-lg leading-tight"
                        style={{ 
                          fontSize: '21px',
                          marginTop: '12px'
                        }}
                      >
                        💰 {formatPrecioColombia(precio)}{esVenta ? "" : "/mes"}
                      </p>
                    );
                  })()}

                   {/* Características */}
                   <div 
                     className="space-y-[7px]"
                     style={{ 
                       marginTop: '12px',
                       fontSize: '12px',
                       fontWeight: '600'
                     }}
                   >
                     {'habitaciones' in propertyData && propertyData.habitaciones && (
                       <div 
                         className="inline-block rounded-xl"
                         style={{ 
                           padding: '8px 12px',
                           backgroundColor: `${aliadoConfig.colorSecundario || '#000000'}F0`,
                           border: '1px solid rgba(255, 255, 255, 0.2)'
                         }}
                       >
                         🛏️ {propertyData.habitaciones} hab
                       </div>
                     )}
                     {'banos' in propertyData && propertyData.banos && (
                       <div 
                         className="inline-block rounded-xl"
                         style={{ 
                           padding: '8px 12px', 
                           marginLeft: '7px',
                           backgroundColor: `${aliadoConfig.colorSecundario || '#000000'}F0`,
                           border: '1px solid rgba(255, 255, 255, 0.2)'
                         }}
                       >
                         🚿 {propertyData.banos} baños
                       </div>
                     )}
                     {'parqueaderos' in propertyData && propertyData.parqueaderos && (
                       <div 
                         className="inline-block rounded-xl"
                         style={{ 
                           padding: '8px 12px', 
                           marginTop: '7px',
                           backgroundColor: `${aliadoConfig.colorSecundario || '#000000'}F0`,
                           border: '1px solid rgba(255, 255, 255, 0.2)'
                         }}
                       >
                         🚗 {propertyData.parqueaderos} parq
                       </div>
                     )}
                     {'area' in propertyData && propertyData.area && (
                       <div 
                         className="inline-block rounded-xl"
                         style={{ 
                           padding: '8px 12px', 
                           marginLeft: '7px',
                           backgroundColor: `${aliadoConfig.colorSecundario || '#000000'}F0`,
                           border: '1px solid rgba(255, 255, 255, 0.2)'
                         }}
                       >
                         📐 {propertyData.area}m²
                       </div>
                     )}
                     {'estrato' in propertyData && propertyData.estrato && (
                       <div 
                         className="inline-block rounded-xl"
                         style={{ 
                           padding: '8px 12px', 
                           marginLeft: '7px',
                           backgroundColor: `${aliadoConfig.colorSecundario || '#000000'}F0`,
                           border: '1px solid rgba(255, 255, 255, 0.2)'
                         }}
                       >
                         🏢 Estrato {propertyData.estrato}
                       </div>
                     )}
                     {'piso' in propertyData && propertyData.piso && (
                       <div 
                         className="inline-block rounded-xl"
                         style={{ 
                           padding: '8px 12px', 
                           marginTop: '7px',
                           backgroundColor: `${aliadoConfig.colorSecundario || '#000000'}F0`,
                           border: '1px solid rgba(255, 255, 255, 0.2)'
                         }}
                       >
                         🏢 Piso {propertyData.piso}
                       </div>
                     )}
                     {'trafico' in propertyData && propertyData.trafico && (
                       <div 
                         className="inline-block rounded-xl"
                         style={{ 
                           padding: '8px 12px', 
                           marginLeft: '7px',
                           backgroundColor: `${aliadoConfig.colorSecundario || '#000000'}F0`,
                           border: '1px solid rgba(255, 255, 255, 0.2)'
                         }}
                       >
                         🚦 Tráfico {propertyData.trafico}
                       </div>
                     )}
                     {'alturaLibre' in propertyData && propertyData.alturaLibre && (
                       <div 
                         className="inline-block rounded-xl"
                         style={{ 
                           padding: '8px 12px', 
                           marginTop: '7px',
                           backgroundColor: `${aliadoConfig.colorSecundario || '#000000'}F0`,
                           border: '1px solid rgba(255, 255, 255, 0.2)'
                         }}
                       >
                         📏 {propertyData.alturaLibre}m altura
                       </div>
                     )}
                     {'vitrina' in propertyData && propertyData.vitrina && (
                       <div 
                         className="inline-block rounded-xl"
                         style={{ 
                           padding: '8px 12px', 
                           marginLeft: '7px',
                           backgroundColor: `${aliadoConfig.colorSecundario || '#000000'}F0`,
                           border: '1px solid rgba(255, 255, 255, 0.2)'
                         }}
                       >
                         🪟 Con vitrina
                       </div>
                     )}
                     {'uso' in propertyData && propertyData.uso && (
                       <div 
                         className="inline-block rounded-xl"
                         style={{ 
                           padding: '8px 12px', 
                           marginTop: '7px',
                           backgroundColor: `${aliadoConfig.colorSecundario || '#000000'}F0`,
                           border: '1px solid rgba(255, 255, 255, 0.2)'
                         }}
                       >
                         🏗️ Uso {propertyData.uso}
                       </div>
                     )}
                   </div>
                </div>

                {/* Logo El Gestor - inferior derecha */}
                <div className="absolute bottom-[100px] right-[15px] z-30">
                  <img 
                    src={elGestorLogo} 
                    alt="El Gestor" 
                    className="h-8 object-contain drop-shadow-lg" 
                  />
                </div>

                {/* Sección inferior */}
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-black/50"
                  style={{ padding: '11px' }}
                >
                  <div className="flex items-center">
                    <div>
                      <p 
                        className="font-bold drop-shadow-lg"
                        style={{ fontSize: '15px' }}
                      >
                        📱 {aliadoConfig.whatsapp}
                      </p>
                      <p 
                        className="text-gray-200"
                        style={{ 
                          fontSize: '10px',
                          marginTop: '2px'
                        }}
                      >
                        {aliadoConfig.nombre}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
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
            <>
              <Button
                onClick={startRecording}
                variant="hero"
                size="lg"
                className="w-full"
                disabled={isRecording || !logoImage}
              >
                🎬 Generar Video con Overlays
              </Button>
              {!logoImage && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  ⏳ Cargando logos...
                </p>
              )}
            </>
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
