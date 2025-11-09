import { useState, useEffect } from "react";
import { ArrendadoData, ArrendadoType } from "@/types/arrendado";
import { AliadoConfig, LogoSettings } from "@/types/property";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download, GripVertical } from "lucide-react";
import { ReelLogoControls } from "./ReelLogoControls";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import { generateReelVideo, downloadBlob, VideoGenerationProgress } from "@/utils/videoGenerator";
import { VideoGenerationProgressModal } from "./VideoGenerationProgress";
import { useToast } from "@/hooks/use-toast";
import { formatPrecioColombia } from "@/utils/formatters";
import { darkenHex } from "@/utils/colorUtils";
import { ARR_THEME } from "@/utils/arrendadoTheme";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ArrendadoReelSlideshowProps {
  data: ArrendadoData;
  aliadoConfig: AliadoConfig;
  tipo: ArrendadoType;
  onDownload?: () => void;
}

interface SortablePhotoProps {
  photo: string;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const SortablePhoto = ({ photo, index, isActive, onClick }: SortablePhotoProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
        isActive
          ? "border-primary scale-105"
          : "border-transparent hover:border-primary/50"
      }`}
    >
      <button onClick={onClick} className="w-full h-full">
        <img
          src={photo}
          alt={`Miniatura ${index + 1}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
        <span className="absolute bottom-1 right-1 text-white text-xs font-bold bg-black/60 px-1 rounded">
          {index + 1}
        </span>
      </button>
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 cursor-grab active:cursor-grabbing bg-black/60 rounded p-1 hover:bg-black/80 transition-colors"
      >
        <GripVertical className="w-4 h-4 text-white" />
      </div>
    </div>
  );
};

export const ArrendadoReelSlideshow = ({
  data,
  aliadoConfig,
  tipo,
  onDownload
}: ArrendadoReelSlideshowProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationProgress, setGenerationProgress] = useState<VideoGenerationProgress | null>(null);
  const [photos, setPhotos] = useState<string[]>(data.fotos || []);
  const [logoSettings, setLogoSettings] = useState<LogoSettings>({
    position: 'bottom-center',
    size: 'medium',
    opacity: 90,
    background: 'box',
    shape: 'rounded',
    animation: 'none'
  });
  const { toast } = useToast();
  
  const slideDuration = 2000;
  const mainColor = tipo === "arrendado" 
    ? aliadoConfig.colorPrimario 
    : aliadoConfig.colorSecundario;
  const badgeText = tipo === "arrendado" ? "¡ARRENDADO!" : "¡VENDIDO!";
  const badgeColor = darkenHex(mainColor, ARR_THEME.badge.darkenAmount);

  // Logo style calculation (matching ReelSlideshow with new pro effects)
  const logoStyle = (() => {
    const sizes = { small: 60, medium: 88, large: 120 };
    const size = sizes[logoSettings.size];
    
    // Efectos de fondo profesionales con profundidad avanzada
    let backgroundClass = 'bg-white/95 shadow-[0_2px_12px_rgba(0,0,0,0.08)]';
    if (logoSettings.background === 'blur') backgroundClass = 'backdrop-blur-md bg-white/70 shadow-[0_4px_20px_rgba(0,0,0,0.12)]';
    if (logoSettings.background === 'shadow') backgroundClass = 'bg-white/85 shadow-[0_8px_32px_rgba(0,0,0,0.18)]';
    if (logoSettings.background === 'box') backgroundClass = 'bg-gradient-to-br from-white/95 to-white/90 shadow-[0_2px_16px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.5)]';
    if (logoSettings.background === 'none') backgroundClass = 'bg-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]';
    
    // Fase 2: Efectos Glow/Resplandor
    if (logoSettings.background === 'glow') backgroundClass = 'bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.4),0_0_40px_rgba(255,255,255,0.2),inset_0_0_20px_rgba(255,255,255,0.1)]';
    if (logoSettings.background === 'holographic') backgroundClass = 'bg-gradient-to-br from-white/95 via-blue-50/90 to-purple-50/85 shadow-[0_8px_32px_rgba(139,92,246,0.2)] border border-white/40';
    if (logoSettings.background === 'frosted') backgroundClass = 'backdrop-blur-[24px] bg-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.8)] border border-white/20';
    
    // Fase 4: Profundidad avanzada con múltiples capas de sombra
    if (logoSettings.background === 'elevated') backgroundClass = 'bg-gradient-to-br from-white via-white/98 to-gray-50/95 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_4px_rgba(0,0,0,0.04),0_4px_8px_rgba(0,0,0,0.04),0_8px_16px_rgba(0,0,0,0.04),0_16px_32px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)]';
    
    // Fase 3: Degradados avanzados mesh y animados
    if (logoSettings.background === 'premium-mesh') backgroundClass = 'bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.95)_50%,rgba(241,245,249,0.92)_100%)] shadow-[0_4px_24px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)]';
    if (logoSettings.background === 'gradient-animated') backgroundClass = 'bg-gradient-to-r from-white via-blue-50/90 to-white bg-[length:200%_100%] animate-gradient-shift shadow-[0_4px_20px_rgba(59,130,246,0.15)]';
    
    // Fase 6: Efecto iridiscente con borde animado
    if (logoSettings.background === 'iridescent') backgroundClass = 'bg-white/95 shadow-[0_4px_20px_rgba(0,0,0,0.1)] border-2 animate-border-glow';

    const positionClasses = {
      'top-left': 'top-6 left-6',
      'top-right': 'top-6 right-6',
      'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2'
    };

    const shapeClasses = {
      square: 'rounded-none',
      rounded: 'rounded-2xl',
      circle: 'rounded-full',
      squircle: 'rounded-3xl'
    };

    // Fase 1: Animaciones profesionales
    const animationClasses = {
      'none': '',
      'floating': 'animate-floating',
      'pulse': 'animate-glow-pulse'
    };

    return {
      size: `${size}px`,
      backgroundClass,
      positionClass: positionClasses[logoSettings.position],
      shapeClass: shapeClasses[logoSettings.shape || 'rounded'],
      opacity: logoSettings.opacity,
      animationClass: animationClasses[logoSettings.animation || 'none']
    };
  })();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setPhotos(data.fotos || []);
  }, [data.fotos]);

  useEffect(() => {
    if (!isPlaying || photos.length === 0) return;

    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => {
        const next = (prev + 1) % photos.length;
        if (next === 0) {
          setIsPlaying(false);
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
    setIsPlaying(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPhotos((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);

        if (oldIndex === currentPhotoIndex) {
          setCurrentPhotoIndex(newIndex);
        } else if (newIndex <= currentPhotoIndex && oldIndex > currentPhotoIndex) {
          setCurrentPhotoIndex(currentPhotoIndex + 1);
        } else if (newIndex >= currentPhotoIndex && oldIndex < currentPhotoIndex) {
          setCurrentPhotoIndex(currentPhotoIndex - 1);
        }

        return arrayMove(items, oldIndex, newIndex);
      });

      toast({
        title: "📸 Fotos reordenadas",
        description: "El orden del reel celebratorio se actualizó.",
      });
    }
  };

  const getVelocidadText = () => {
    if (data.diasEnMercado <= 7) {
      return `🚀 En solo ${data.diasEnMercado} día${data.diasEnMercado === 1 ? '' : 's'}`;
    } else if (data.diasEnMercado <= 15) {
      return `⚡ En ${data.diasEnMercado} días`;
    }
    return `🎉 En ${data.diasEnMercado} días`;
  };

  const tipoLabel = {
    apartamento: "Apartamento",
    casa: "Casa",
    local: "Local Comercial",
    oficina: "Oficina",
    bodega: "Bodega",
    lote: "Lote"
  }[data.tipo];

  const handleDownloadVideo = async () => {
    try {
      setIsPlaying(false);
      setCurrentPhotoIndex(0);
      
      toast({
        title: "✨ ¡Generando reel celebratorio!",
        description: "Esto tomará 10-20 segundos.",
      });

      const changePhoto = async (index: number): Promise<void> => {
        setCurrentPhotoIndex(index);
        return new Promise((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
      };

      const videoBlob = await generateReelVideo(
        photos,
        "arrendado-reel-capture",
        setGenerationProgress,
        changePhoto
      );

      downloadBlob(
        videoBlob,
        `reel-${tipo}-${data.ubicacion.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.gif`
      );

      toast({
        title: "🎉 ¡Reel generado!",
        description: "Tu publicación celebratoria se ha descargado.",
      });

      if (onDownload) onDownload();
    } catch (error) {
      console.error("Error generando reel:", error);
      toast({
        title: "Error al generar reel",
        description: "Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setGenerationProgress(null), 2000);
    }
  };

  if (photos.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          Sube fotos para ver el reel celebratorio
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {generationProgress && <VideoGenerationProgressModal progress={generationProgress} />}
      
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold" style={{ color: mainColor }}>
              Reel {tipo === "arrendado" ? "Arrendado" : "Vendido"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {photos.length} fotos · {(photos.length * 2.0).toFixed(1)}s total
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handlePlayPause}>
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            <Button variant="hero" size="icon" onClick={handleDownloadVideo}>
              <Download className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Vista previa */}
        <div 
          className="relative aspect-story mx-auto bg-black rounded-xl overflow-hidden shadow-2xl mb-4"
          style={{
            maxWidth: '420px',
            height: 'auto'
          }}
        >
          {/* Barras de progreso */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
            {photos.map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{
                    width: idx < currentPhotoIndex ? "100%" : 
                           idx === currentPhotoIndex ? `${progress}%` : "0%"
                  }}
                />
              </div>
            ))}
          </div>

          {/* Foto actual */}
          <div className="absolute inset-0">
            <img
              src={photos[currentPhotoIndex]}
              alt={`Foto ${currentPhotoIndex + 1}`}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          </div>

          {/* Contenido superpuesto */}
          <div className="absolute inset-0 flex flex-col p-6 text-white z-10">
            {/* Badge celebratorio */}
            <div className="flex justify-center items-center pt-10">
              <div 
                className={`px-8 py-4 rounded-3xl font-black text-3xl text-center ${ARR_THEME.badge.shadowClass} ${ARR_THEME.badge.ringClass}`}
                style={{ backgroundColor: badgeColor, color: "#fff" }}
              >
                {badgeText}
              </div>
            </div>

            {/* Centro: Precio + Info + CTA (CENTRADO VERTICALMENTE) */}
            <div className="flex flex-col items-center gap-4 my-auto">
              <div className="text-center">
                <p className="text-[2.75rem] font-black drop-shadow-2xl leading-none">
                  {formatPrecioColombia(data.precio)}
                </p>
                {tipo === "arrendado" && (
                  <p className="text-base font-semibold opacity-90 mt-1">/mes</p>
                )}
              </div>

              <div className="w-24 h-0.5 bg-white/50 rounded-full" />

              <div className="bg-white/20 px-6 py-3 rounded-xl">
                <p className="text-xl font-black drop-shadow-lg">
                  {getVelocidadText()}
                </p>
              </div>

              <div className="text-center space-y-1">
                <p className="text-xl font-black drop-shadow-lg">
                  {tipoLabel}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">📍</span>
                  <p className="text-lg font-bold drop-shadow-lg">
                    {data.ubicacion}
                  </p>
                </div>
              </div>

              {aliadoConfig.logo && (
                <div 
                  className={`absolute ${logoStyle.positionClass} z-20`}
                  style={{ opacity: logoStyle.opacity / 100 }}
                >
                  <img
                    src={aliadoConfig.logo}
                    alt={aliadoConfig.nombre}
                    className={`${logoStyle.shapeClass} object-contain p-2.5 ${logoStyle.backgroundClass} ${logoStyle.animationClass} transition-all duration-300`}
                    style={{ width: logoStyle.size, height: logoStyle.size }}
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              {/* CTA - AHORA DENTRO DEL BLOQUE CENTRAL */}
              <div className="text-center px-6 mt-6">
                <p className="text-[1.575rem] font-black drop-shadow-lg leading-tight">
                  {data.ctaCustom || 
                   (tipo === "arrendado" ? aliadoConfig.ctaArrendado : aliadoConfig.ctaVendido) ||
                   `💪 ¿Quieres ${tipo === "arrendado" ? "arrendar" : "vender"} tu inmueble rápido?`}
                </p>
              </div>
            </div>

            {/* Footer: Logo El Gestor - 20% más grande */}
            <div className="pb-6 flex justify-center mt-auto">
              <img 
                src={elGestorLogo}
                alt="El Gestor"
                className="h-8 object-contain opacity-90"
                crossOrigin="anonymous"
              />
            </div>
          </div>

          {/* Play overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center z-30">
              <button
                onClick={() => setIsPlaying(true)}
                className="w-20 h-20 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 transition-all"
              >
                <Play className="w-10 h-10 text-white ml-1" />
              </button>
            </div>
          )}
        </div>

        {/* Canvas oculto para captura */}
        <div 
          id="arrendado-reel-capture"
          className="relative absolute pointer-events-none"
          style={{ 
            width: '1080px',
            height: '1920px',
            left: '0px',
            top: '0px',
            opacity: 0,
            backgroundColor: '#000000'
          }}
        >
          <div className="absolute inset-0">
            <img
              src={photos[currentPhotoIndex]}
              alt="Capture"
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          </div>

          <div className="absolute inset-0 flex flex-col p-6 text-white">
            <div className="flex justify-center items-center pt-10">
              <div 
                className={`px-8 py-4 rounded-3xl font-black text-3xl text-center ${ARR_THEME.badge.shadowClass} ${ARR_THEME.badge.ringClass}`}
                style={{ backgroundColor: badgeColor, color: "#fff" }}
              >
                {badgeText}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 my-auto">
              <div className="text-center">
                <p className="text-[2.75rem] font-black drop-shadow-2xl leading-none">
                  {formatPrecioColombia(data.precio)}
                </p>
                {tipo === "arrendado" && (
                  <p className="text-base font-semibold opacity-90 mt-1">/mes</p>
                )}
              </div>

              <div className="w-24 h-0.5 bg-white/50 rounded-full" />

              <div className="bg-white/20 px-6 py-3 rounded-xl">
                <p className="text-xl font-black drop-shadow-lg">
                  {getVelocidadText()}
                </p>
              </div>

              <div className="text-center space-y-1">
                <p className="text-xl font-black drop-shadow-lg">
                  {tipoLabel}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">📍</span>
                  <p className="text-lg font-bold drop-shadow-lg">
                    {data.ubicacion}
                  </p>
                </div>
              </div>

              {aliadoConfig.logo && (
                <div 
                  className={`absolute ${logoStyle.positionClass} z-20`}
                  style={{ opacity: logoStyle.opacity / 100 }}
                >
                  <img
                    src={aliadoConfig.logo}
                    alt={aliadoConfig.nombre}
                    className={`${logoStyle.shapeClass} object-contain p-2.5 ${logoStyle.backgroundClass} ${logoStyle.animationClass} transition-all duration-300`}
                    style={{ width: logoStyle.size, height: logoStyle.size }}
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              {/* CTA - AHORA DENTRO DEL BLOQUE CENTRAL */}
              <div className="text-center px-6 mt-6">
                <p className="text-[1.575rem] font-black drop-shadow-lg leading-tight">
                  {data.ctaCustom || 
                   (tipo === "arrendado" ? aliadoConfig.ctaArrendado : aliadoConfig.ctaVendido) ||
                   `💪 ¿Quieres ${tipo === "arrendado" ? "arrendar" : "vender"} tu inmueble rápido?`}
                </p>
              </div>
            </div>

            <div className="pb-6 flex justify-center mt-auto">
              <img 
                src={elGestorLogo}
                alt="El Gestor"
                className="h-8 object-contain opacity-90"
                crossOrigin="anonymous"
              />
            </div>
          </div>
        </div>

        {/* Miniaturas ordenables */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Arrastra para reordenar las fotos
            </p>
            <SortableContext items={photos} strategy={horizontalListSortingStrategy}>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {photos.map((photo, idx) => (
                  <SortablePhoto
                    key={photo}
                    photo={photo}
                    index={idx}
                    isActive={idx === currentPhotoIndex}
                    onClick={() => handlePhotoClick(idx)}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        </DndContext>
      </Card>

      {/* Controles del Logo */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">🎨 Personalización del Logo</h3>
        <ReelLogoControls
          settings={logoSettings}
          onChange={setLogoSettings}
        />
      </Card>
    </div>
  );
};
