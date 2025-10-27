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
import elGestorLogo from "@/assets/el-gestor-logo.png";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";

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
        img.src = logoRubyMorales;
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
      const mainColor = variant === "arrendado" ? "#10B981" : "#3B82F6";
      const badgeText = variant === "arrendado" ? "¡ARRENDADO!" : "¡VENDIDO!";
      
      // Logo del aliado (superior izquierda)
      if (logoImage) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.roundRect(30, 30, 240, 240, 20);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.drawImage(logoImage, 38, 38, 224, 224);
      }
      
      ctx.shadowBlur = 15;
      
      // Badge celebratorio grande
      ctx.fillStyle = "white";
      ctx.fillRect(canvas.width / 2 - 200, 250, 400, 100);
      ctx.fillStyle = mainColor;
      ctx.font = "bold 56px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(badgeText, canvas.width / 2, 320);
      
      // Validar que los datos estén completos
      if (!arrendadoData.precio || !arrendadoData.diasEnMercado) {
        console.error("Datos de arrendado incompletos");
        return;
      }
      
      // Precio prominente
      ctx.textAlign = "center";
      ctx.fillStyle = "white";
      ctx.font = "20px Inter, sans-serif";
      ctx.fillText(
        variant === "arrendado" ? "Arrendado por:" : "Vendido por:",
        canvas.width / 2,
        canvas.height / 2 - 80
      );
      ctx.font = "bold 84px Inter, sans-serif";
      ctx.fillText(formatPrecioColombia(arrendadoData.precio), canvas.width / 2, canvas.height / 2);
      if (variant === "arrendado") {
        ctx.font = "28px Inter, sans-serif";
        ctx.fillText("/mes", canvas.width / 2, canvas.height / 2 + 50);
      }
      
      // Velocidad
      const diasTexto = arrendadoData.diasEnMercado <= 7 
        ? `🚀 En solo ${arrendadoData.diasEnMercado} día${arrendadoData.diasEnMercado === 1 ? '' : 's'}`
        : arrendadoData.diasEnMercado <= 15
        ? `⚡ En ${arrendadoData.diasEnMercado} días`
        : `🎉 En ${arrendadoData.diasEnMercado} días`;
      ctx.font = "bold 32px Inter, sans-serif";
      ctx.fillText(diasTexto, canvas.width / 2, canvas.height / 2 + 120);
      
      // Tipo + Ubicación
      const tipoLabel = {
        apartamento: "Apartamento",
        casa: "Casa",
        local: "Local Comercial",
        oficina: "Oficina",
        bodega: "Bodega",
        lote: "Lote"
      }[arrendadoData.tipo] || arrendadoData.tipo;
      
      ctx.font = "bold 36px Inter, sans-serif";
      ctx.fillText(tipoLabel, canvas.width / 2, canvas.height / 2 + 180);
      ctx.fillText(
        `📍 ${arrendadoData.ubicacion}`,
        canvas.width / 2,
        canvas.height / 2 + 230
      );
      
      // CTA inferior
      ctx.font = "bold 32px Inter, sans-serif";
      ctx.fillText(
        `💪 ¿Quieres ${variant === "arrendado" ? "arrendar" : "vender"} tu inmueble rápido?`,
        canvas.width / 2,
        1640
      );
      
    } else {
      // ===== DISEÑO ACTUAL PARA INMUEBLES DISPONIBLES =====
      const propData = propertyData as PropertyData;
      
      // Logo del aliado (superior izquierda) - formato cuadrado
      if (logoImage) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.roundRect(30, 30, 160, 160, 16);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.drawImage(logoImage, 38, 38, 144, 144);
      }

      ctx.shadowBlur = 15;

      // Tipo de inmueble
      const badgeY = logoImage ? 220 : 50;
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
      ctx.font = "bold 72px Poppins, sans-serif";
      const precio = propData.canon || propData.valorVenta || "";
      ctx.fillText(precio, 40, precioY);

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

    // Sección inferior con información de contacto (común para ambas variantes)
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

    // Logo El Gestor (inferior derecha) - sin opacidad, proporción correcta
    if (elGestorLogoImage) {
      const logoHeight = 104; // Altura deseada (+15%)
      const logoAspectRatio = elGestorLogoImage.width / elGestorLogoImage.height;
      const logoWidth = logoHeight * logoAspectRatio; // Calcular ancho proporcional
      const logoX = 1080 - logoWidth - 30; // Posición X ajustada al ancho real
      
      ctx.drawImage(elGestorLogoImage, logoX, 1582, logoWidth, logoHeight);
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
          
          {/* Overlays preview - Sincronizado con canvas */}
          <div className="absolute inset-0 pointer-events-none text-white">
            {/* Logo aliado - Canvas: 160x160px → Preview: 59px (cuadrado con diseño unificado) */}
            <div 
              className="absolute rounded-xl border-2 bg-white/90"
              style={{ 
                top: '11px', 
                left: '11px', 
                width: '59px', 
                height: '59px',
                padding: '2px',
                borderColor: 'rgba(255, 255, 255, 0.8)'
              }}
            >
              <img
                src={logoRubyMorales}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Ciudad junto al logo */}
            <div 
              className="absolute"
              style={{ 
                left: '78px', 
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
              style={{ top: '82px' }}
            >
              {/* Tipo de inmueble - Canvas: 300x70px, font 38px → Preview: 111x26px, font 14px */}
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

              {/* Ubicación - Canvas: font 42px → Preview: font 16px */}
              <p 
                className="font-bold drop-shadow-lg"
                style={{ 
                  fontSize: '16px',
                  marginTop: '15px'
                }}
              >
                📍 {propertyData.ubicacion}
              </p>

              {/* Precio - Canvas: font 72px → Preview: font 27px */}
              <p 
                className="font-bold drop-shadow-lg leading-tight"
                style={{ 
                  fontSize: '27px',
                  marginTop: '12px'
                }}
              >
                {'canon' in propertyData ? propertyData.canon || propertyData.valorVenta : ''}
              </p>

              {/* Características - Canvas: font 32px → Preview: font 12px */}
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

            {/* Sección inferior - Canvas: Y=1700, height 220px */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-black/50"
              style={{ padding: '11px' }}
            >
              <div className="flex items-center">
                {/* WhatsApp y nombre */}
                <div>
                  {/* WhatsApp - Canvas: font 40px → Preview: font 15px */}
                  <p 
                    className="font-bold drop-shadow-lg"
                    style={{ fontSize: '15px' }}
                  >
                    📱 {aliadoConfig.whatsapp}
                  </p>
                  {/* Nombre - Canvas: font 28px → Preview: font 10px */}
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
