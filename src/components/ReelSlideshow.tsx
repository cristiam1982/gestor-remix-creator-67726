import { useState, useEffect, useMemo, useCallback } from "react";
import { PropertyData, AliadoConfig, ReelTemplate, LogoSettings, TextCompositionSettings, VisualLayers } from "@/types/property";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download, GripVertical } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";
import { generateReelVideo, downloadBlob, VideoGenerationProgress } from "@/utils/videoGenerator";
import { VideoGenerationProgressModal } from "./VideoGenerationProgress";
import { TemplateSelector } from "./TemplateSelector";
import { ReelControlsPanel } from "./ReelControlsPanel";
import { ReelSummarySlide } from "./ReelSummarySlide";
import { ReelDurationControl } from "./ReelDurationControl";
import { formatPrecioColombia } from "@/utils/formatters";
import { hexToRgba } from "@/utils/colorUtils";
import { useToast } from "@/hooks/use-toast";
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

export const ReelSlideshow = ({ propertyData, aliadoConfig, onDownload }: ReelSlideshowProps) => {
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
      size: 'medium'
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

  const { toast } = useToast();

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
    
    let backgroundClass = 'bg-white/90';
    if (logoSettings.background === 'blur') backgroundClass = 'backdrop-blur-sm bg-white/60';
    if (logoSettings.background === 'shadow') backgroundClass = 'bg-transparent shadow-2xl';
    if (logoSettings.background === 'none') backgroundClass = 'bg-transparent';

    const positionClasses = {
      'top-left': 'top-6 left-6',
      'top-right': 'top-6 right-6',
      'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2'
    };

    return {
      size: `${size}px`,
      opacity: logoSettings.opacity / 100,
      backgroundClass,
      positionClass: positionClasses[logoSettings.position]
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
      compact: 'gap-1',
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
        description: "Esto tomará 10-25 segundos. No cierres esta pestaña.",
      });

      // Función para cambiar foto durante la captura
      const changePhoto = async (index: number): Promise<void> => {
        if (index >= photosList.length) {
          // Mostrar slide de resumen
          setShowSummarySlide(true);
          setCurrentPhotoIndex(photosList.length - 1);
        } else {
          setShowSummarySlide(false);
          setCurrentPhotoIndex(index);
        }
        
        // Doble requestAnimationFrame para asegurar renderizado completo
        return new Promise((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
      };

      // Usar nueva función MP4 (Fase 2 - mejor calidad, menor peso)
      const { generateReelVideoMP4 } = await import("../utils/videoGenerator");
      
      const videoBlob = await generateReelVideoMP4(
        photosList.map(p => p.src),
        "reel-capture-canvas",
        setGenerationProgress,
        changePhoto,
        true, // includeSummary
        slideDuration // duración dinámica por foto
      );

      downloadBlob(
        videoBlob,
        `reel-${aliadoConfig.nombre.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.mp4`
      );

      toast({
        title: "🎉 ¡Reel generado!",
        description: "Tu video MP4 de alta calidad se ha descargado correctamente.",
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
    <div className="space-y-4 max-w-full mx-auto">
      {generationProgress && <VideoGenerationProgressModal progress={generationProgress} />}

      {/* Header con título y botón de descarga */}
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">🎬 Editor de Reel</h2>
          <p className="text-sm text-muted-foreground">
            {photosList.length} fotos · {((photosList.length * slideDuration / 1000) + 2.5).toFixed(1)}s · {currentTemplate.name}
          </p>
        </div>
        <Button onClick={handleDownloadVideo} size="lg" className="gap-2">
          <Download className="w-5 h-5" /> Descargar MP4
        </Button>
      </div>

      {/* Layout redimensionable para desktop */}
      <ResizablePanelGroup 
        direction="horizontal" 
        className="hidden lg:flex h-[calc(100vh-160px)] overflow-hidden"
      >
        {/* PANEL DE CONTROLES - Izquierda (redimensionable) */}
        <ResizablePanel 
          defaultSize={35} 
          minSize={25} 
          maxSize={50}
          className="pr-2"
        >
          <aside className="h-full overflow-y-auto">
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
                    <Accordion type="multiple" defaultValue={["tema"]} className="w-full">
                      {/* Tema del Inmueble */}
                      <AccordionItem value="tema">
                        <AccordionTrigger className="text-base font-semibold">
                          🏠 Tema del Inmueble
                        </AccordionTrigger>
                        <AccordionContent>
                          <TemplateSelector 
                            selected={selectedTemplate}
                            onChange={setSelectedTemplate}
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
        </ResizablePanel>

        {/* Handle arrastrable con icono visual */}
        <ResizableHandle withHandle />

        {/* PANEL DEL PREVIEW - Derecha (redimensionable) */}
        <ResizablePanel defaultSize={65} minSize={50}>
          <main className="h-screen overflow-y-auto pl-2 pr-2">
            <div className="sticky top-4 flex items-center justify-center py-4">
              <Card className="p-3 w-full max-w-lg">
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

            {/* Vista previa principal - FLOTANTE con altura completa */}
            <div 
              className="relative w-auto h-[85vh] mx-auto rounded-xl overflow-hidden shadow-2xl mb-4"
              style={{ 
                aspectRatio: '9/16',
                backgroundColor: shouldShowSummary && summaryBackground === 'solid' 
                  ? (summarySolidColor || hexToRgba(brand, 0.12)) 
                  : '#000000' 
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
                className={`rounded-xl border-2 border-white/80 object-contain p-1 ${logoStyle.backgroundClass}`}
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

              {/* Logo El Gestor - inferior derecha - SIEMPRE visible */}
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

        {/* Canvas de captura OCULTO - SIEMPRE 1080x1920 para exportación */}
      <div 
        id="reel-capture-canvas" 
        className="absolute pointer-events-none"
        style={{ 
          width: '1080px', 
          height: '1920px',
          left: '-9999px',
          top: '-9999px',
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
                    className={`rounded-xl border-2 border-white/80 object-contain p-1 ${logoStyle.backgroundClass}`}
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

              </Card>
            </div>
            {/* Espacio para generar scroll */}
            <div className="h-[200px]"></div>
          </main>
      </ResizablePanel>
    </ResizablePanelGroup>

      {/* Layout móvil vertical */}
      <div className="lg:hidden space-y-4">
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
                  <Accordion type="multiple" defaultValue={["tema"]} className="w-full">
                    {/* Tema del Inmueble */}
                    <AccordionItem value="tema">
                      <AccordionTrigger className="text-base font-semibold">
                        🏠 Tema del Inmueble
                      </AccordionTrigger>
                      <AccordionContent>
                        <TemplateSelector 
                          selected={selectedTemplate}
                          onChange={setSelectedTemplate}
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
        <main className="space-y-4">
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
              className="relative aspect-[9/16] max-w-[480px] mx-auto rounded-xl overflow-hidden shadow-2xl mb-4"
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
                    className={`rounded-xl border-2 border-white/80 object-contain p-1 ${logoStyle.backgroundClass}`}
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
        </main>
      </div>
    </div>
  );
};
