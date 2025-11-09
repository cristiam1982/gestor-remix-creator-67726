import { useState, useEffect, useMemo, useCallback } from "react";
import { PropertyData, AliadoConfig, ReelTemplate, LogoSettings, TextCompositionSettings, VisualLayers } from "@/types/property";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Download, GripVertical, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";
import { generateReelVideo, downloadBlob, VideoGenerationProgress, generateReelVideoMP4_FFmpegFrames, isIOSOrSafari } from "@/utils/videoGenerator";
import { fetchFile } from '@ffmpeg/util';
import { VideoGenerationProgressModal } from "./VideoGenerationProgress";
import { TemplateSelector } from "./TemplateSelector";
import { ReelControlsPanel } from "./ReelControlsPanel";
import { ReelSummarySlide } from "./ReelSummarySlide";
import { ReelDurationControl } from "./ReelDurationControl";
import { formatPrecioColombia } from "@/utils/formatters";
import { hexToRgba } from "@/utils/colorUtils";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import FFmpegManager from "@/utils/ffmpegManager";
import { REEL_TEMPLATES, getTemplateForProperty, applyGradientIntensity } from "@/utils/reelTemplates";
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

interface ReelSlideshowProps {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  onDownload?: () => void;
  caption?: string;
  onCaptionChange?: (v: string) => void;
  onCopyCaption?: () => void;
  onRegenerateCaption?: () => void;
}

interface PhotoItem {
  id: string;
  src: string;
}

interface SortablePhotoProps {
  id: string;
  src: string;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const SortablePhoto = ({ id, src, index, isActive, onClick }: SortablePhotoProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

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
      <button
        onClick={onClick}
        className="w-full h-full"
      >
        <img
          src={src}
          alt={`Miniatura ${index + 1}`}
          className="w-full h-full object-cover"
        />
        {!isActive && <div className="absolute inset-0 bg-black/20" />}
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

export const ReelSlideshow = ({ 
  propertyData, 
  aliadoConfig, 
  onDownload,
  caption,
  onCaptionChange,
  onCopyCaption,
  onRegenerateCaption
}: ReelSlideshowProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [previousPhotoIndex, setPreviousPhotoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationProgress, setGenerationProgress] = useState<VideoGenerationProgress | null>(null);
  const [photosList, setPhotosList] = useState<PhotoItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReelTemplate>(
    propertyData.template || getTemplateForProperty(propertyData.tipo, propertyData.uso)
  );
  const [gradientDirection, setGradientDirection] = useState<'top' | 'bottom' | 'both' | 'none'>(
    propertyData.gradientDirection || 'both'
  );
  const [gradientIntensity, setGradientIntensity] = useState(
    propertyData.gradientIntensity !== undefined ? propertyData.gradientIntensity : 50
  );
  const [summaryBackground, setSummaryBackground] = useState<'solid' | 'blur' | 'mosaic'>(
    propertyData.summaryBackgroundStyle || 'solid'
  );
  const [summarySolidColor, setSummarySolidColor] = useState(aliadoConfig.colorPrimario || '#0E1216');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSummarySlide, setShowSummarySlide] = useState(false);
  const [isChangingGradient, setIsChangingGradient] = useState(false);
  const [customHashtag, setCustomHashtag] = useState<string>('');
  const [slideDuration, setSlideDuration] = useState(1300); // Duración por foto en ms
  
  // Fase 6: Logo settings
  const [logoSettings, setLogoSettings] = useState<LogoSettings>(
    propertyData.logoSettings || {
      position: 'top-left',
      opacity: 90,
      background: 'box',
      size: 'medium',
      shape: 'rounded'
    }
  );

  // Fase 6: Text composition settings
  const [textComposition, setTextComposition] = useState<TextCompositionSettings>(
    propertyData.textComposition || {
      typographyScale: 0,
      badgeStyle: 'rounded',
      ctaAlignment: 'left',
      verticalSpacing: 'normal'
    }
  );

  // Fase 6: Visual layers
  const [visualLayers, setVisualLayers] = useState<VisualLayers>(
    propertyData.visualLayers || {
      showPhoto: true,
      showPrice: true,
      showBadge: true,
      showIcons: true,
      showAllyLogo: true,
      showCTA: true
    }
  );

  // Estado para el zoom del preview
  const [zoomLevel, setZoomLevel] = useState(80); // 80 = 80% (tamaño perfecto por defecto), rango: 50-200

  const { toast } = useToast();

  // Funciones de zoom
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(200, prev + 25)); // Máximo 200%
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(50, prev - 25)); // Mínimo 50%
  };

  const handleResetZoom = () => {
    setZoomLevel(100); // Reset a 100%
  };

  // Color de marca del aliado
  const brand = aliadoConfig.colorPrimario || '#00A5BD';
  
  const summaryDuration = 2500; // 2.5 segundos para slide de resumen
  const currentTemplate = REEL_TEMPLATES[selectedTemplate];
  
  // PARTE 2: Fix gradiente con CSS inline en vez de clases Tailwind dinámicas
  const gradientOverlayStyle = useMemo(() => {
    if (gradientDirection === 'none') return {};
    
    const intensity = Math.max(0, Math.min(100, gradientIntensity));
    const alpha = (intensity / 100) * 0.7; // Mapear 0-100 a 0-0.7
    const rgba = (a: number) => `rgba(0,0,0,${a.toFixed(3)})`;
    
    if (gradientDirection === 'top') {
      return { background: `linear-gradient(to bottom, ${rgba(alpha)} 0%, ${rgba(0)} 60%)` };
    }
    if (gradientDirection === 'bottom') {
      return { background: `linear-gradient(to top, ${rgba(alpha)} 0%, ${rgba(0)} 60%)` };
    }
    // both
    return {
      background: `linear-gradient(to bottom, ${rgba(alpha)} 0%, ${rgba(0)} 60%), linear-gradient(to top, ${rgba(alpha)} 0%, ${rgba(0)} 60%)`
    };
  }, [gradientDirection, gradientIntensity]);

  // Fase 6: Estilos dinámicos del logo
  const logoStyle = useMemo(() => {
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
      'square': 'rounded-none',
      'rounded': 'rounded-xl',
      'circle': 'rounded-full',
      'squircle': 'rounded-[22%]'
    };

    // Fase 1: Animaciones profesionales
    const animationClasses = {
      'none': '',
      'floating': 'animate-floating',
      'pulse': 'animate-glow-pulse'
    };

    return {
      size: `${size}px`,
      opacity: logoSettings.opacity / 100,
      backgroundClass,
      positionClass: positionClasses[logoSettings.position],
      shapeClass: shapeClasses[logoSettings.shape || 'rounded'],
      animationClass: animationClasses[logoSettings.animation || 'none']
    };
  }, [logoSettings]);

  // Fase 6: Estilos dinámicos del texto
  const textStyle = useMemo(() => {
    const scale = 1 + (textComposition.typographyScale / 100);
    
    const badgeClasses = {
      circular: 'rounded-full',
      rectangular: 'rounded-none',
      rounded: 'rounded-xl',
      none: 'hidden'
    };

    const alignmentClasses = {
      left: 'items-start text-left',
      center: 'items-center text-center',
      right: 'items-end text-right'
    };

    const spacingValues = {
      compact: 'gap-0.5',
      normal: 'gap-2',
      spacious: 'gap-4'
    };

    return {
      scale,
      badgeClass: badgeClasses[textComposition.badgeStyle],
      alignmentClass: alignmentClasses[textComposition.ctaAlignment],
      spacingClass: spacingValues[textComposition.verticalSpacing]
    };
  }, [textComposition]);


  // Sensors para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // PARTE 1: Sincronizar fotos con IDs únicos y estables
  useEffect(() => {
    const newFotos = propertyData.fotos || [];
    
    setPhotosList(prevList => {
      // Crear mapa de src existentes a sus ids, guardando ocurrencias
      const existingMap = new Map<string, string[]>();
      prevList.forEach(p => {
        const existing = existingMap.get(p.src) || [];
        existing.push(p.id);
        existingMap.set(p.src, existing);
      });
      
      // Mapear con contador de ocurrencias para IDs únicos
      const occurrenceCount = new Map<string, number>();
      
      return newFotos.map((src) => {
        const occurrence = (occurrenceCount.get(src) || 0);
        occurrenceCount.set(src, occurrence + 1);
        
        // Reutilizar id si existe para esta ocurrencia
        const existingIds = existingMap.get(src) || [];
        const existingId = existingIds[occurrence];
        
        return {
          id: existingId || `${src}::${occurrence}::${crypto.randomUUID()}`,
          src
        };
      });
    });
  }, [propertyData.fotos]);
  
  // PARTE 1: Función para cambiar foto con crossfade
  const goToPhoto = useCallback((nextIndex: number) => {
    setCurrentPhotoIndex(current => {
      setPreviousPhotoIndex(current);
      return nextIndex;
    });
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 600);
  }, []);

  // PARTE 1: Autoplay mejorado con goToPhoto
  useEffect(() => {
    if (!isPlaying || photosList.length === 0) return;

    const interval = setInterval(() => {
      if (showSummarySlide) {
        // Después del slide de resumen, volver al inicio
        setShowSummarySlide(false);
        setIsPlaying(false);
        goToPhoto(0);
      } else if (currentPhotoIndex >= photosList.length - 1) {
        // Última foto, mostrar slide de resumen
        setShowSummarySlide(true);
      } else {
        // Siguiente foto
        goToPhoto(currentPhotoIndex + 1);
      }
      setProgress(0);
    }, showSummarySlide ? summaryDuration : slideDuration);

    return () => clearInterval(interval);
  }, [isPlaying, photosList.length, slideDuration, summaryDuration, showSummarySlide, currentPhotoIndex, goToPhoto]);

  useEffect(() => {
    if (!isPlaying) return;

    const duration = showSummarySlide ? summaryDuration : slideDuration;
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + (100 / (duration / 100));
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [isPlaying, currentPhotoIndex, slideDuration, summaryDuration, showSummarySlide]);

  // Precargar FFmpeg para evitar timeouts
  useEffect(() => {
    FFmpegManager.getInstance().load().catch(() => {
      console.log('FFmpeg precarga falló, se cargará al descargar');
    });
  }, []);

  const handlePlayPause = () => {
    if (!isPlaying) {
      setShowSummarySlide(false); // Resetear slide de resumen al iniciar
    }
    setIsPlaying(!isPlaying);
  };

  const handlePhotoClick = (index: number) => {
    goToPhoto(index);
    setShowSummarySlide(false);
    setProgress(0);
    setIsPlaying(false);
  };

  // PARTE 4: Handler para cambio de intensidad con feedback visual
  const handleGradientIntensityChange = (value: number) => {
    setGradientIntensity(value);
    setIsChangingGradient(true);
    setTimeout(() => setIsChangingGradient(false), 600);
  };

  // PARTE 1: DnD mejorado con IDs únicos
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPhotosList((items) => {
        const oldIndex = items.findIndex(p => p.id === active.id);
        const newIndex = items.findIndex(p => p.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return items;

        // Actualizar índice actual si es necesario
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
        description: "El nuevo orden se aplicará en el video.",
      });
    }
  };

  const handleDownloadVideo = async () => {
    try {
      setIsPlaying(false);
      setCurrentPhotoIndex(0);
      setShowSummarySlide(false);
      
      toast({
        title: "✨ ¡Generando tu reel!",
        description: "Esto tomará 10-30 segundos. No cierres esta pestaña.",
      });

      // Función para cambiar foto durante la captura
      const changePhoto = async (index: number): Promise<void> => {
        if (index >= photosList.length) {
          setShowSummarySlide(true);
          setCurrentPhotoIndex(photosList.length - 1);
        } else {
          setShowSummarySlide(false);
          setCurrentPhotoIndex(index);
        }
        
        return new Promise((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
      };

      const photoSources = photosList.map(p => p.src);
      let videoBlob: Blob;
      let usedFFmpegFrames = false;

      // DETECCIÓN DE NAVEGADOR: Usar FFmpeg frames directamente en iOS/Safari
      if (isIOSOrSafari()) {
        console.log('🍎 iOS/Safari detectado - Usando pipeline FFmpeg frames');
        toast({
          title: "🍎 Modo compatible activado",
          description: "Generando video H.264 para iPhone/Safari...",
        });
        
        videoBlob = await generateReelVideoMP4_FFmpegFrames(
          photoSources,
          "reel-capture-canvas",
          setGenerationProgress,
          changePhoto,
          true,
          slideDuration
        );
        usedFFmpegFrames = true;
      } else {
        // NAVEGADORES MODERNOS: Intentar MediaRecorder primero
        try {
          const { generateReelVideoMP4 } = await import("../utils/videoGenerator");
          
      videoBlob = await generateReelVideoMP4(
        photoSources,
        "reel-capture-canvas",
        setGenerationProgress,
        changePhoto,
        true,
        slideDuration,
        propertyData,
        aliadoConfig
      );

          // Si es WebM, necesitamos convertir o usar fallback
          const blobType = videoBlob.type.toLowerCase();
          
          if (blobType.includes('webm')) {
            // Verificar tamaño del blob (si es muy pequeño, posiblemente falló)
            if (videoBlob.size < 100000) { // < 100KB
              throw new Error('Video WebM demasiado pequeño, usando fallback FFmpeg');
            }

            // Intentar conversión con timeout
            try {
              console.log('🔄 Convirtiendo WebM a MP4...');
              
              toast({
                title: "🔄 Convirtiendo a MP4",
                description: "Optimizando compatibilidad...",
              });

              const ffmpeg = FFmpegManager.getInstance();
              
              if (!ffmpeg.isLoaded()) {
                await ffmpeg.load();
              }

              const inputData = new Uint8Array(await videoBlob.arrayBuffer());
              await ffmpeg.writeFile('input.webm', inputData);

              await Promise.race([
                ffmpeg.exec([
                  '-i', 'input.webm',
                  '-c:v', 'libx264',
                  '-preset', 'fast',
                  '-crf', '23',
                  '-pix_fmt', 'yuv420p',
                  '-movflags', '+faststart',
                  '-an',
                  'output.mp4'
                ]),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Timeout de conversión')), 20000)
                )
              ]);

              const data = await ffmpeg.readFile('output.mp4');
              videoBlob = new Blob([data as BlobPart], { type: 'video/mp4' });

              await ffmpeg.deleteFile('input.webm');
              await ffmpeg.deleteFile('output.mp4');
              
            } catch (conversionError) {
              console.warn('⚠️ Conversión falló, usando FFmpeg frames como fallback');
              throw new Error('Fallback a FFmpeg frames');
            }
          }
        } catch (mediaRecorderError) {
          console.warn('⚠️ MediaRecorder falló, usando FFmpeg frames:', mediaRecorderError);
          
          toast({
            title: "🔄 Activando modo compatible",
            description: "Generando video H.264 optimizado...",
          });
          
          videoBlob = await generateReelVideoMP4_FFmpegFrames(
            photoSources,
            "reel-capture-canvas",
            setGenerationProgress,
            changePhoto,
            true,
            slideDuration
          );
          usedFFmpegFrames = true;
        }
      }

      // Descargar video
      const mp4Filename = `reel-${propertyData.tipo}-${Date.now()}.mp4`;
      downloadBlob(videoBlob, mp4Filename);
      
      toast({
        title: "✅ Video descargado",
        description: usedFFmpegFrames 
          ? "Video H.264 compatible con iPhone e Instagram" 
          : "Tu reel está listo para compartir",
      });

      if (onDownload) onDownload();
    } catch (error) {
      console.error("Error generando video:", error);
      
      let errorDescription = "Por favor intenta de nuevo.";
      if (error instanceof Error) {
        if (error.message.includes("CORS") || error.message.includes("tainted")) {
          errorDescription = "Se detectó un problema con el logo. El reel se generó sin él.";
        } else {
          errorDescription = error.message;
        }
      }
      
      toast({
        title: "Error al generar reel",
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setShowSummarySlide(false);
      setTimeout(() => setGenerationProgress(null), 2000);
    }
  };

  if (photosList.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          Sube fotos para ver el slideshow animado
        </p>
      </Card>
    );
  }
  
  // PARTE 4: Determinar si mostrar slide de resumen (reproducción)
  const shouldShowSummary = showSummarySlide;

  return (
    <>
      {generationProgress && <VideoGenerationProgressModal progress={generationProgress} />}

      {/* Header y Botón FIJOS - fuera del scroll */}
      <div className="hidden lg:block space-y-3 pb-3 border-b bg-background">
        {/* Header con título */}
        <div className="flex items-center justify-between px-4 lg:px-6 pt-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">🎬 Editor de Reel</h2>
            <p className="text-sm text-muted-foreground">
              {photosList.length} fotos · {((photosList.length * slideDuration / 1000) + 2.5).toFixed(1)}s · {currentTemplate.name}
            </p>
          </div>
        </div>

        {/* Botón de descarga FIJO */}
        <div className="px-4 lg:px-6">
          <Card className="p-3 bg-primary/5 border-primary/20">
            <Button 
              onClick={handleDownloadVideo} 
              size="lg" 
              className="w-full gap-2 bg-primary hover:bg-primary/90"
            >
              <Download className="w-5 h-5" /> Descargar Video
            </Button>
          </Card>
        </div>
      </div>

      {/* Desktop: ScrollArea principal que envuelve todo */}
      <ScrollArea className="hidden lg:block h-[calc(100vh-80px)]">
        <div className="space-y-4 max-w-full mx-auto pb-8">
          {/* Layout de 2 columnas con ScrollAreas independientes */}
          <div className="grid grid-cols-[1fr_480px] gap-6 h-[calc(100vh-100px)] px-4 lg:px-6">
        {/* PANEL DE CONTROLES - Izquierda */}
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4 pb-6">
            <Card className="p-4">
              <h3 className="text-lg font-bold mb-4">⚙️ Controles de Personalización</h3>
              
              {/* Control de duración fuera del accordion */}
              <div className="mb-4">
                <ReelDurationControl
                  duration={slideDuration}
                  onChange={setSlideDuration}
                  photoCount={photosList.length}
                />
              </div>

              {/* Accordion colapsable */}
              <Accordion type="multiple" defaultValue={["fotos", "estilo"]} className="w-full">
                {/* Fotos del Reel */}
                <AccordionItem value="fotos">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                    📸 Fotos del Reel ({photosList.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={photosList.map(p => p.id)} strategy={horizontalListSortingStrategy}>
                        <div className="grid grid-cols-4 gap-2">
                          {photosList.map((photo, idx) => (
                            <SortablePhoto
                              key={photo.id}
                              id={photo.id}
                              src={photo.src}
                              index={idx}
                              isActive={idx === currentPhotoIndex && !showSummarySlide}
                              onClick={() => handlePhotoClick(idx)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </AccordionContent>
                </AccordionItem>

                {/* Estilo Visual */}
                <AccordionItem value="estilo">
                  <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                    🎨 Estilo Visual
                  </AccordionTrigger>
                  <AccordionContent>
                    <Accordion type="multiple" defaultValue={["tema", "personalizacion"]} className="w-full">
                      {/* Tema del Inmueble */}
                      <AccordionItem value="tema">
                        <AccordionTrigger className="text-base font-semibold">
                          🏠 Tema del Inmueble
                        </AccordionTrigger>
                        <AccordionContent>
                          <TemplateSelector 
                            selected={selectedTemplate}
                            onChange={setSelectedTemplate}
                            showTitle={false}
                          />
                        </AccordionContent>
                      </AccordionItem>

                      {/* Opciones de Personalización */}
                      <AccordionItem value="personalizacion">
                        <AccordionTrigger className="text-base font-semibold">
                          ⚙️ Opciones de Personalización
                        </AccordionTrigger>
                        <AccordionContent>
                          <ReelControlsPanel
                            gradientDirection={gradientDirection}
                            onGradientDirectionChange={setGradientDirection}
                            gradientIntensity={gradientIntensity}
                            onGradientIntensityChange={handleGradientIntensityChange}
                            summaryBackground={summaryBackground}
                            onSummaryBackgroundChange={setSummaryBackground}
                            summarySolidColor={summarySolidColor}
                            onSummarySolidColorChange={setSummarySolidColor}
                            logoSettings={logoSettings}
                            onLogoSettingsChange={setLogoSettings}
                            textComposition={textComposition}
                            onTextCompositionChange={setTextComposition}
                            visualLayers={visualLayers}
                            onVisualLayersChange={setVisualLayers}
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>

            {/* Caption Card */}
            {caption !== undefined && (
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-primary">📝 Caption Generado</h3>
                <div className="space-y-2 mb-4">
                  <Textarea
                    value={caption}
                    onChange={(e) => onCaptionChange?.(e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                    placeholder="Tu caption aparecerá aquí..."
                  />
                  <p className="text-xs text-muted-foreground">
                    {caption.length} caracteres
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={onCopyCaption} variant="secondary" className="flex-1" disabled={!onCopyCaption}>
                    📋 Copiar Caption
                  </Button>
                  <Button 
                    onClick={onRegenerateCaption}
                    variant="outline"
                    disabled={!onRegenerateCaption}
                  >
                    Regenerar
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* PANEL DE PREVIEW - Derecha */}
        <ScrollArea className="h-full">
          <div className="space-y-4 pb-6">
          <Card className="p-4 shadow-2xl border-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold">Vista Previa en Vivo</h3>
                <p className="text-xs text-muted-foreground">
                  {!shouldShowSummary ? `Foto ${currentPhotoIndex + 1} de ${photosList.length}` : 'Slide Final'} · Zoom: {zoomLevel}%
                </p>
              </div>
              <div className="flex items-center gap-1">
                {/* Botón Zoom Out */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 50}
                  className="h-8 w-8"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                
                {/* Botón Reset Zoom */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleResetZoom}
                  disabled={zoomLevel === 100}
                  className="h-8 w-8"
                  title="Reset Zoom (100%)"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
                
                {/* Botón Zoom In */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 200}
                  className="h-8 w-8"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                
                {/* Separador */}
                <div className="w-px h-6 bg-border mx-1" />
                
                {/* Botón Play/Pause existente */}
                <Button variant="ghost" size="icon" onClick={handlePlayPause} className="h-8 w-8">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Slider de zoom */}
            <div className="px-2 pb-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>50%</span>
                <span className="font-semibold text-foreground">{zoomLevel}%</span>
                <span>200%</span>
              </div>
              <Slider
                value={[zoomLevel]}
                onValueChange={(value) => setZoomLevel(value[0])}
                min={50}
                max={200}
                step={5}
                className="w-full"
              />
            </div>

            {/* Vista previa principal - CON ZOOM */}
            <div className="relative w-full overflow-auto">
              <div 
                className="relative aspect-story mx-auto rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300"
                style={{
                  width: '100%',
                  maxWidth: '700px',
                  height: 'auto',
                  backgroundColor: shouldShowSummary && summaryBackground === 'solid' 
                    ? (summarySolidColor || hexToRgba(brand, 0.12)) 
                    : '#000000',
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'center center'
                }}
              >
          {/* Barras de progreso - incluye slide de resumen */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
            {[...photosList, { id: 'summary', src: '' }].map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{
                    width: idx < currentPhotoIndex ? "100%" : 
                           (idx === currentPhotoIndex && !shouldShowSummary) ? `${progress}%` :
                           (idx === photosList.length && shouldShowSummary) ? `${progress}%` : "0%"
                  }}
                />
              </div>
            ))}
          </div>

          {/* Slide de resumen - Mostrar si está en reproducción O editando pestaña final */}
          {shouldShowSummary && (
            <ReelSummarySlide 
              propertyData={propertyData}
              aliadoConfig={aliadoConfig}
              isVisible={true}
              photos={photosList.map(p => p.src)}
              backgroundStyle={summaryBackground}
              solidColor={summarySolidColor}
              customHashtag={customHashtag}
            />
          )}

          {/* Foto actual con overlay y crossfade - Solo mostrar si NO es slide de resumen */}
          {!shouldShowSummary && (
            <div className="absolute inset-0">
              {/* Foto anterior (fade out) */}
              {photosList[previousPhotoIndex] && (
                <img
                  src={photosList[previousPhotoIndex].src}
                  alt={`Foto ${previousPhotoIndex + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover photo-crossfade ${
                    isTransitioning ? 'photo-crossfade-enter' : 'photo-crossfade-active'
                  }`}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              )}
              
              {/* Foto actual (fade in) */}
              {photosList[currentPhotoIndex] && (
                <img
                  src={photosList[currentPhotoIndex].src}
                  alt={`Foto ${currentPhotoIndex + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover photo-crossfade ${
                    isTransitioning ? 'photo-crossfade-active' : 'opacity-0'
                  }`}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
              )}
              
              {/* PARTE 2: Gradient overlay con CSS inline */}
              {gradientDirection !== 'none' && (
                <div className="absolute inset-0 pointer-events-none" style={{ ...gradientOverlayStyle, zIndex: 5 }} />
              )}
            </div>
          )}

          {/* Logo del aliado - Fase 6: Estilos dinámicos */}
          {!shouldShowSummary && visualLayers.showAllyLogo && (
            <div 
              className={`absolute z-20 ${logoStyle.positionClass}`}
              style={{ opacity: logoStyle.opacity }}
            >
              <img
                src={logoRubyMorales}
                alt={aliadoConfig.nombre}
                className={`${logoStyle.shapeClass} object-contain p-2.5 ${logoStyle.backgroundClass} ${logoStyle.animationClass} transition-all duration-300`}
                style={{ width: logoStyle.size, height: logoStyle.size }}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {/* PARTE 3: Información del inmueble con precio más visible */}
          {!shouldShowSummary && (() => {
            const esVenta = propertyData.modalidad === "venta" || (!!propertyData.valorVenta && !propertyData.canon);
            const precio = esVenta ? propertyData.valorVenta : propertyData.canon;
            
            return (
              <div className={`absolute bottom-0 left-0 right-0 p-4 pr-20 pb-12 z-10 flex flex-col ${textStyle.alignmentClass} ${textStyle.spacingClass}`}>
                {/* Subtítulo sobre el precio */}
                {visualLayers.showBadge && propertyData.subtitulos?.[currentPhotoIndex] && (
                  <div className="w-full flex justify-center mb-3">
                    <div className={`${currentTemplate.subtitleStyle.background} px-4 py-1.5 ${textStyle.badgeClass} shadow-lg max-w-[80%]`}>
                      <p 
                        className={`${currentTemplate.subtitleStyle.textColor} ${currentTemplate.subtitleStyle.textSize} font-semibold text-center leading-tight`}
                        style={{ fontSize: `calc(${currentTemplate.subtitleStyle.textSize.match(/\d+/)?.[0] || 12}px * ${textStyle.scale})` }}
                      >
                        {propertyData.subtitulos[currentPhotoIndex]}
                      </p>
                    </div>
                  </div>
                )}

                {/* Precio con máxima visibilidad */}
                {visualLayers.showPrice && precio && (
                  <div 
                    className={`relative z-40 inline-flex flex-col gap-0.5 px-5 py-2.5 shadow-md mb-2 ${currentTemplate.priceStyle.className}`}
                    style={{ 
                      backgroundColor: aliadoConfig.colorPrimario,
                      opacity: 0.9,
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      transform: `scale(${textStyle.scale})`
                    }}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider leading-none text-white/90">
                      {esVenta ? "Venta" : "Arriendo"}
                    </span>
                    <span className="text-2xl font-black leading-none text-white">
                      {formatPrecioColombia(precio)}
                    </span>
                  </div>
                )}
                
                {visualLayers.showCTA && (
                  <>
                    <h3 
                      className="text-white text-2xl font-black mb-1.5" 
                      style={{ 
                        textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                        fontSize: `calc(2rem * ${textStyle.scale})`
                      }}
                    >
                      {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
                    </h3>
                    {propertyData.ubicacion && (
                      <p 
                        className="text-white text-lg font-bold mb-4" 
                        style={{ 
                          textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                          fontSize: `calc(1.125rem * ${textStyle.scale})`
                        }}
                      >
                        📍 {propertyData.ubicacion}
                      </p>
                  )}
                </>
              )}

              {/* Iconografía de características - Fase 6 */}
              {visualLayers.showIcons && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {propertyData.habitaciones && (
                    <div 
                      className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg"
                      style={{ transform: `scale(${textStyle.scale})` }}
                    >
                      <span className="text-base">🛏️</span>
                      <span className="text-sm font-bold text-gray-800">{propertyData.habitaciones}</span>
                    </div>
                  )}
                  {propertyData.banos && (
                    <div 
                      className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg"
                      style={{ transform: `scale(${textStyle.scale})` }}
                    >
                      <span className="text-base">🚿</span>
                      <span className="text-sm font-bold text-gray-800">{propertyData.banos}</span>
                    </div>
                  )}
                  {propertyData.parqueaderos && (
                    <div 
                      className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg"
                      style={{ transform: `scale(${textStyle.scale})` }}
                    >
                      <span className="text-base">🚗</span>
                      <span className="text-sm font-bold text-gray-800">{propertyData.parqueaderos}</span>
                    </div>
                  )}
                  {propertyData.area && (
                    <div 
                      className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg"
                      style={{ transform: `scale(${textStyle.scale})` }}
                    >
                      <span className="text-base">📐</span>
                      <span className="text-sm font-bold text-gray-800">{propertyData.area}m²</span>
                    </div>
                  )}
                </div>
              )}

              </div>
            );
          })()}

              {/* Logo El Gestor - inferior derecha - SIEMPRE visible */}
              <div className="absolute bottom-12 right-4 z-40">
                  <img 
                    src={elGestorLogo} 
                    alt="El Gestor" 
                    data-eg-logo="true"
                    className="h-10 object-contain drop-shadow-2xl"
                  />
                </div>

          {/* PARTE 4: Feedback visual al cambiar gradiente */}
          {isChangingGradient && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-black/70 backdrop-blur-sm px-6 py-3 rounded-2xl animate-fade-in shadow-2xl border border-white/20">
              <p className="text-white text-xl font-bold">
                🌗 {gradientIntensity}%
              </p>
            </div>
          )}

          {/* Play/Pause overlay */}
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
            </div>
            
          </Card>
          </div>
        </ScrollArea>
      </div>
        </div>
      </ScrollArea>

      {/* Mobile/Tablet: Scroll natural de la página */}
      <div className="lg:hidden space-y-4 max-w-full mx-auto pb-0">
        {/* Header con título */}
        <div className="flex items-center justify-between px-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">🎬 Editor de Reel</h2>
            <p className="text-sm text-muted-foreground">
              {photosList.length} fotos · {((photosList.length * slideDuration / 1000) + 2.5).toFixed(1)}s · {currentTemplate.name}
            </p>
          </div>
        </div>
      </div>

      {/* Canvas de captura OCULTO - SIEMPRE 1080x1920 para exportación */}
      <div 
        id="reel-capture-canvas" 
        className="relative absolute pointer-events-none"
        style={{ 
          width: '1080px', 
          height: '1920px',
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          visibility: 'hidden',
          pointerEvents: 'none',
          backgroundColor: '#000000'
        }}
      >
          {/* Slide de resumen para captura */}
          {showSummarySlide && (
            <ReelSummarySlide 
              propertyData={propertyData}
              aliadoConfig={aliadoConfig}
              isVisible={true}
              photos={photosList.map(p => p.src)}
              backgroundStyle={summaryBackground}
              solidColor={summarySolidColor}
              customHashtag={customHashtag}
            />
          )}

          {/* Foto actual con overlay - CÓDIGO IDÉNTICO AL PREVIEW + Template */}
          {!showSummarySlide && (
            <>
              <div className="absolute inset-0">
                {photosList[currentPhotoIndex] && (
                  <img
                    src={photosList[currentPhotoIndex].src}
                    alt={`Foto ${currentPhotoIndex + 1}`}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                )}
                {/* PARTE 2: Gradient overlay con CSS inline en canvas */}
                {gradientDirection !== 'none' && (
                  <div className="absolute inset-0 pointer-events-none" style={{ ...gradientOverlayStyle, zIndex: 5 }} />
                )}
              </div>

              {/* Logo del aliado - Canvas con estilos dinámicos */}
              {visualLayers.showAllyLogo && (
                <div 
                  className={`absolute z-20 ${logoStyle.positionClass}`}
                  style={{ opacity: logoStyle.opacity }}
                >
                  <img
                    src={logoRubyMorales}
                    alt={aliadoConfig.nombre}
                    className={`${logoStyle.shapeClass} object-contain p-2.5 ${logoStyle.backgroundClass} ${logoStyle.animationClass} transition-all duration-300`}
                    style={{ width: logoStyle.size, height: logoStyle.size }}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    data-ally-logo="true"
                  />
                </div>
              )}

              {/* Precio movido al área inferior - Canvas con estilos dinámicos */}
              {(() => {
                const esVenta = propertyData.modalidad === "venta" || (!!propertyData.valorVenta && !propertyData.canon);
                const precio = esVenta ? propertyData.valorVenta : propertyData.canon;
                
                return (
                  <div className={`absolute bottom-0 left-0 right-0 p-4 pr-20 pb-12 z-10 flex flex-col ${textStyle.alignmentClass} ${textStyle.spacingClass}`}>
                    {visualLayers.showBadge && propertyData.subtitulos?.[currentPhotoIndex] && (
                      <div className="w-full flex justify-center mb-3">
                        <div className={`${currentTemplate.subtitleStyle.background} px-4 py-1.5 ${textStyle.badgeClass} shadow-lg max-w-[80%]`}>
                          <p 
                            className={`${currentTemplate.subtitleStyle.textColor} font-semibold text-center leading-tight`}
                            style={{ fontSize: `calc(${currentTemplate.subtitleStyle.textSize.match(/\d+/)?.[0] || 12}px * ${textStyle.scale})` }}
                          >
                            {propertyData.subtitulos[currentPhotoIndex]}
                          </p>
                        </div>
                      </div>
                    )}

                    {visualLayers.showPrice && precio && (
                      <div 
                        className={`relative z-40 inline-flex flex-col gap-0.5 px-5 py-2.5 shadow-md mb-2 ${currentTemplate.priceStyle.className}`}
                        style={{ 
                          backgroundColor: aliadoConfig.colorPrimario,
                          opacity: 0.9,
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#ffffff',
                          transform: `scale(${textStyle.scale})`
                        }}
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wider leading-none text-white/90">
                          {esVenta ? "Venta" : "Arriendo"}
                        </span>
                        <span className="text-2xl font-black leading-none text-white">
                          {formatPrecioColombia(precio)}
                        </span>
                      </div>
                    )}
                    
                    {visualLayers.showCTA && (
                      <>
                        <h3 className="text-white text-2xl font-black mb-1.5" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9)', fontSize: `calc(2rem * ${textStyle.scale})` }}>
                          {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
                        </h3>
                        {propertyData.ubicacion && (
                          <p className="text-white text-lg font-bold mb-4" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9)', fontSize: `calc(1.125rem * ${textStyle.scale})` }}>📍 {propertyData.ubicacion}</p>
                  )}
                </>
              )}

              {/* Logo El Gestor - SIEMPRE visible */}
              <div className="absolute bottom-12 right-4 z-40">
                  <img src={elGestorLogo} alt="El Gestor" data-eg-logo="true" className="h-10 object-contain drop-shadow-2xl" />
                </div>
              </div>
                );
              })()}
            </>
          )}
        </div>

      {/* Layout móvil vertical - ya dentro del div lg:hidden anterior */}
      <div className="space-y-4 lg:hidden">
        {/* Vista previa móvil */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Vista Previa</h3>
              <p className="text-sm text-muted-foreground">
                {!showSummarySlide ? `Foto ${currentPhotoIndex + 1} de ${photosList.length}` : 'Slide Final'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handlePlayPause}>
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          <div 
            className="relative aspect-story mx-auto bg-black rounded-xl overflow-hidden shadow-2xl mb-2"
            style={{
              maxWidth: '420px',
              height: 'auto',
              backgroundColor: shouldShowSummary && summaryBackground === 'solid' 
                ? (summarySolidColor || hexToRgba(brand, 0.12)) 
                : '#000000' 
            }}
          >
            {/* Barras de progreso */}
            <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
              {[...photosList, { id: 'summary', src: '' }].map((_, idx) => (
                <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-100"
                    style={{
                      width: idx < currentPhotoIndex ? "100%" : 
                             (idx === currentPhotoIndex && !showSummarySlide) ? `${progress}%` :
                             (idx === photosList.length && showSummarySlide) ? `${progress}%` : "0%"
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Foto o slide de resumen */}
            {showSummarySlide ? (
              <ReelSummarySlide 
                propertyData={propertyData}
                aliadoConfig={aliadoConfig}
                isVisible={true}
                photos={photosList.map(p => p.src)}
                backgroundStyle={summaryBackground}
                solidColor={summarySolidColor}
                customHashtag={customHashtag}
              />
            ) : (
              <img
                src={photosList[currentPhotoIndex]?.src}
                alt={`Foto ${currentPhotoIndex + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
            )}

            {/* Play overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center z-30">
                <button
                  onClick={() => setIsPlaying(true)}
                  className="w-16 h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/40 transition-all"
                >
                  <Play className="w-8 h-8 text-white ml-1" />
                </button>
              </div>
            )}
          </div>
        </Card>


        {/* PANEL DE CONTROLES */}
        <aside className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-bold mb-4">⚙️ Controles de Personalización</h3>
            
            {/* Control de duración fuera del accordion */}
            <div className="mb-4">
              <ReelDurationControl
                duration={slideDuration}
                onChange={setSlideDuration}
                photoCount={photosList.length}
              />
            </div>

            {/* Accordion colapsable e independiente */}
            <Accordion type="multiple" defaultValue={["fotos", "estilo"]} className="w-full">
              {/* Gestión de Fotos */}
              <AccordionItem value="fotos">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  📸 Fotos del Reel ({photosList.length})
                </AccordionTrigger>
                <AccordionContent>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext items={photosList.map(p => p.id)} strategy={horizontalListSortingStrategy}>
                      <div className="grid grid-cols-4 gap-2">
                        {photosList.map((photo, idx) => (
                          <SortablePhoto
                            key={photo.id}
                            id={photo.id}
                            src={photo.src}
                            index={idx}
                            isActive={idx === currentPhotoIndex && !showSummarySlide}
                            onClick={() => handlePhotoClick(idx)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </AccordionContent>
              </AccordionItem>

              {/* Estilo Visual */}
              <AccordionItem value="estilo">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                  🎨 Estilo Visual
                </AccordionTrigger>
                <AccordionContent>
                  <Accordion type="multiple" defaultValue={["tema", "personalizacion"]} className="w-full">
                    {/* Tema del Inmueble */}
                    <AccordionItem value="tema">
                      <AccordionTrigger className="text-base font-semibold">
                        🏠 Tema del Inmueble
                      </AccordionTrigger>
                        <AccordionContent>
                        <TemplateSelector 
                          selected={selectedTemplate}
                          onChange={setSelectedTemplate}
                          showTitle={false}
                        />
                      </AccordionContent>
                    </AccordionItem>

                    {/* Opciones de Personalización */}
                    <AccordionItem value="personalizacion">
                      <AccordionTrigger className="text-base font-semibold">
                        ⚙️ Opciones de Personalización
                      </AccordionTrigger>
                      <AccordionContent>
                        <ReelControlsPanel
                          gradientDirection={gradientDirection}
                          onGradientDirectionChange={setGradientDirection}
                          gradientIntensity={gradientIntensity}
                          onGradientIntensityChange={handleGradientIntensityChange}
                          summaryBackground={summaryBackground}
                          onSummaryBackgroundChange={setSummaryBackground}
                          summarySolidColor={summarySolidColor}
                          onSummarySolidColorChange={setSummarySolidColor}
                          logoSettings={logoSettings}
                          onLogoSettingsChange={setLogoSettings}
                          textComposition={textComposition}
                          onTextCompositionChange={setTextComposition}
                          visualLayers={visualLayers}
                          onVisualLayersChange={setVisualLayers}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        </aside>

        {/* PREVIEW */}
        <div className="sticky top-2 z-20">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Vista Previa en Vivo</h3>
                <p className="text-sm text-muted-foreground">
                  {!showSummarySlide ? `Foto ${currentPhotoIndex + 1} de ${photosList.length}` : 'Slide Final'}
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
              </div>
            </div>

            {/* Vista previa principal - móvil */}
            <div 
              className="relative aspect-story w-full max-w-[420px] mx-auto rounded-xl overflow-hidden shadow-2xl mb-4"
              style={{ 
                backgroundColor: shouldShowSummary && summaryBackground === 'solid' 
                  ? (summarySolidColor || hexToRgba(brand, 0.12)) 
                  : '#000000' 
              }}
            >
              {/* Resto del contenido del preview - mismo código que desktop */}
              {/* Barras de progreso */}
              <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
                {[...photosList, { id: 'summary', src: '' }].map((_, idx) => (
                  <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-100"
                      style={{
                        width: idx < currentPhotoIndex ? "100%" : 
                               (idx === currentPhotoIndex && !shouldShowSummary) ? `${progress}%` :
                               (idx === photosList.length && shouldShowSummary) ? `${progress}%` : "0%"
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Slide de resumen */}
              {shouldShowSummary && (
                <ReelSummarySlide 
                  propertyData={propertyData}
                  aliadoConfig={aliadoConfig}
                  isVisible={true}
                  photos={photosList.map(p => p.src)}
                  backgroundStyle={summaryBackground}
                  solidColor={summarySolidColor}
                  customHashtag={customHashtag}
                />
              )}

              {/* Foto actual con overlay */}
              {!shouldShowSummary && (
                <div className="absolute inset-0">
                  {photosList[previousPhotoIndex] && (
                    <img
                      src={photosList[previousPhotoIndex].src}
                      alt={`Foto ${previousPhotoIndex + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover photo-crossfade ${
                        isTransitioning ? 'photo-crossfade-enter' : 'photo-crossfade-active'
                      }`}
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  
                  {photosList[currentPhotoIndex] && (
                    <img
                      src={photosList[currentPhotoIndex].src}
                      alt={`Foto ${currentPhotoIndex + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover photo-crossfade ${
                        isTransitioning ? 'photo-crossfade-active' : 'opacity-0'
                      }`}
                      crossOrigin="anonymous"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  
                  {gradientDirection !== 'none' && (
                    <div className="absolute inset-0 pointer-events-none" style={{ ...gradientOverlayStyle, zIndex: 5 }} />
                  )}
                </div>
              )}

              {/* Logo del aliado */}
              {!shouldShowSummary && visualLayers.showAllyLogo && (
                <div 
                  className={`absolute z-20 ${logoStyle.positionClass}`}
                  style={{ opacity: logoStyle.opacity }}
                >
                  <img
                    src={logoRubyMorales}
                    alt={aliadoConfig.nombre}
                    className={`${logoStyle.shapeClass} object-contain p-2.5 ${logoStyle.backgroundClass} ${logoStyle.animationClass} transition-all duration-300`}
                    style={{ width: logoStyle.size, height: logoStyle.size }}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Información del inmueble */}
              {!shouldShowSummary && (() => {
                const esVenta = propertyData.modalidad === "venta" || (!!propertyData.valorVenta && !propertyData.canon);
                const precio = esVenta ? propertyData.valorVenta : propertyData.canon;
                
                return (
                  <div className={`absolute bottom-0 left-0 right-0 p-4 pr-20 pb-12 z-10 flex flex-col ${textStyle.alignmentClass} ${textStyle.spacingClass}`}>
                    {visualLayers.showBadge && propertyData.subtitulos?.[currentPhotoIndex] && (
                      <div className="w-full flex justify-center mb-3">
                        <div className={`${currentTemplate.subtitleStyle.background} px-4 py-1.5 ${textStyle.badgeClass} shadow-lg max-w-[80%]`}>
                          <p 
                            className={`${currentTemplate.subtitleStyle.textColor} ${currentTemplate.subtitleStyle.textSize} font-semibold text-center leading-tight`}
                            style={{ fontSize: `calc(${currentTemplate.subtitleStyle.textSize.match(/\d+/)?.[0] || 12}px * ${textStyle.scale})` }}
                          >
                            {propertyData.subtitulos[currentPhotoIndex]}
                          </p>
                        </div>
                      </div>
                    )}

                    {visualLayers.showPrice && precio && (
                      <div 
                        className={`relative z-40 inline-flex flex-col gap-0.5 px-5 py-2.5 shadow-md mb-2 ${currentTemplate.priceStyle.className}`}
                        style={{ 
                          backgroundColor: aliadoConfig.colorPrimario,
                          opacity: 0.9,
                          border: '1px solid rgba(255,255,255,0.2)',
                          color: '#ffffff',
                          transform: `scale(${textStyle.scale})`
                        }}
                      >
                        <span className="text-[10px] font-semibold uppercase tracking-wider leading-none text-white/90">
                          {esVenta ? "Venta" : "Arriendo"}
                        </span>
                        <span className="text-2xl font-black leading-none text-white">
                          {formatPrecioColombia(precio)}
                        </span>
                      </div>
                    )}
                    
                    {visualLayers.showCTA && (
                      <>
                        <h3 
                          className="text-white text-2xl font-black mb-1.5" 
                          style={{ 
                            textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                            fontSize: `calc(2rem * ${textStyle.scale})`
                          }}
                        >
                          {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
                        </h3>
                        {propertyData.ubicacion && (
                          <p 
                            className="text-white text-lg font-bold mb-4" 
                            style={{ 
                              textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                              fontSize: `calc(1.125rem * ${textStyle.scale})`
                            }}
                          >
                            📍 {propertyData.ubicacion}
                          </p>
                        )}
                      </>
                    )}

                    {visualLayers.showIcons && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {propertyData.habitaciones && (
                          <div 
                            className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg"
                            style={{ transform: `scale(${textStyle.scale})` }}
                          >
                            <span className="text-base">🛏️</span>
                            <span className="text-sm font-bold text-gray-800">{propertyData.habitaciones}</span>
                          </div>
                        )}
                        {propertyData.banos && (
                          <div 
                            className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg"
                            style={{ transform: `scale(${textStyle.scale})` }}
                          >
                            <span className="text-base">🚿</span>
                            <span className="text-sm font-bold text-gray-800">{propertyData.banos}</span>
                          </div>
                        )}
                        {propertyData.parqueaderos && (
                          <div 
                            className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg"
                            style={{ transform: `scale(${textStyle.scale})` }}
                          >
                            <span className="text-base">🚗</span>
                            <span className="text-sm font-bold text-gray-800">{propertyData.parqueaderos}</span>
                          </div>
                        )}
                        {propertyData.area && (
                          <div 
                            className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg"
                            style={{ transform: `scale(${textStyle.scale})` }}
                          >
                            <span className="text-base">📐</span>
                            <span className="text-sm font-bold text-gray-800">{propertyData.area}m²</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="absolute bottom-12 right-4 z-40">
                      <img 
                        src={elGestorLogo} 
                        alt="El Gestor" 
                        data-eg-logo="true"
                        className="h-10 object-contain drop-shadow-2xl"
                      />
                    </div>
                  </div>
                );
              })()}

              {isChangingGradient && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-black/70 backdrop-blur-sm px-6 py-3 rounded-2xl animate-fade-in shadow-2xl border border-white/20">
                  <p className="text-white text-xl font-bold">
                    🌗 {gradientIntensity}%
                  </p>
                </div>
              )}

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
          </Card>

          {/* Caption Card - Móvil */}
          {caption !== undefined && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-primary">Caption Generado</h3>
              <div className="space-y-2 mb-4">
                <Textarea
                  value={caption}
                  onChange={(e) => onCaptionChange?.(e.target.value)}
                  className="min-h-[150px] font-mono text-sm"
                  placeholder="Tu caption aparecerá aquí..."
                />
                <p className="text-xs text-muted-foreground">
                  {caption.length} caracteres
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={onCopyCaption} variant="secondary" className="flex-1" disabled={!onCopyCaption}>
                  📋 Copiar Caption
                </Button>
                <Button 
                  onClick={onRegenerateCaption}
                  variant="outline"
                  disabled={!onRegenerateCaption}
                >
                  Regenerar
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};
