import { useState, useEffect, useMemo, useCallback } from "react";
import { PropertyData, AliadoConfig, ReelTemplate } from "@/types/property";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Download, GripVertical } from "lucide-react";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";
import { generateReelVideo, downloadBlob, VideoGenerationProgress } from "@/utils/videoGenerator";
import { VideoGenerationProgressModal } from "./VideoGenerationProgress";
import { TemplateSelector } from "./TemplateSelector";
import { ReelControlsPanel } from "./ReelControlsPanel";
import { ReelSummarySlide } from "./ReelSummarySlide";
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
  const [activeTab, setActiveTab] = useState<'visual' | 'sombreado' | 'final'>('visual');
  const [customHashtag, setCustomHashtag] = useState<string>('');
  const { toast } = useToast();

  // Color de marca del aliado
  const brand = aliadoConfig.colorPrimario || '#00A5BD';
  
  const slideDuration = 1300; // 1.3 segundos por foto (mejor legibilidad)
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
      // Crear mapa de src existentes a sus ids
      const existingMap = new Map(prevList.map(p => [p.src, p.id]));
      
      return newFotos.map((src, idx) => {
        // Reutilizar id si ya existe, sino crear uno nuevo
        const existingId = existingMap.get(src);
        return {
          id: existingId || `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
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
        true // includeSummary
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
  
  // PARTE 4: Determinar si mostrar slide de resumen (reproducción o editando pestaña final)
  const shouldShowSummary = showSummarySlide || activeTab === 'final';

  return (
    <div className="space-y-6">
      {generationProgress && <VideoGenerationProgressModal progress={generationProgress} />}

      {/* PARTE 3: Layout reestructurado - Preview arriba, controles abajo */}
      <div className="space-y-6">
        
        {/* Preview del Reel - Centrado */}
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-primary">Reel Slideshow</h3>
                <p className="text-sm text-muted-foreground">
                  {photosList.length} fotos + slide final · {((photosList.length * 1.3) + 2.5).toFixed(1)}s total · {currentTemplate.name}
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

            {/* Vista previa principal - RESPONSIVE */}
            <div 
              className="relative aspect-[9/16] max-w-[340px] mx-auto rounded-xl overflow-hidden shadow-2xl mb-4"
              style={{ 
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
                <div className="absolute inset-0 pointer-events-none" style={gradientOverlayStyle} />
              )}
            </div>
          )}

          {/* Subtítulo centrado sobre el precio */}
          {!shouldShowSummary && propertyData.subtitulos && propertyData.subtitulos[currentPhotoIndex] && (
            <div className="absolute bottom-[160px] left-0 right-0 z-20 flex justify-center px-4 animate-slide-up-bounce">
              <div className={`${currentTemplate.subtitleStyle.background} px-4 py-1.5 rounded-full shadow-xl max-w-[80%]`}>
                <p className="text-white text-base font-bold text-center leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {propertyData.subtitulos[currentPhotoIndex]}
                </p>
              </div>
            </div>
          )}

          {/* Logo del aliado */}
          {!shouldShowSummary && (
            <div className="absolute top-6 left-6 z-20">
              <img
                src={logoRubyMorales}
                alt={aliadoConfig.nombre}
                className="w-20 h-20 rounded-xl border-2 border-white/80 object-contain bg-white/90 p-1"
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
              <div className="absolute bottom-6 left-0 right-0 p-6 pr-24 pb-14 z-10">
                {/* Precio con máxima visibilidad */}
                {precio && (
                  <div 
                    className="inline-block px-5 py-2.5 rounded-xl shadow-2xl mb-3 max-w-[85%] z-40"
                    style={{ 
                      backgroundColor: '#FF8C42',
                      opacity: 0.95,
                      border: '2px solid rgba(255,255,255,0.25)'
                    }}
                  >
                    <p 
                      className="text-2xl font-black text-white flex items-center gap-2" 
                      style={{ textShadow: '0 3px 10px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,1)' }}
                    >
                      <span>💰</span>
                      <span>{formatPrecioColombia(precio)}</span>
                      {!esVenta && <span className="text-lg">/mes</span>}
                    </p>
                  </div>
                )}
                
                <h3 className="text-white text-3xl font-black mb-2" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9)' }}>
                  {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
                </h3>
              {propertyData.ubicacion && (
                <p className="text-white text-lg font-bold mb-3" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9)' }}>📍 {propertyData.ubicacion}</p>
              )}

                {/* Logo El Gestor - inferior derecha */}
                <div className="absolute bottom-6 right-4 z-40">
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

        {/* Canvas de captura OCULTO - Escalado 2.5x para generar 1080x1920 */}
      <div 
        id="reel-capture-canvas" 
        className="absolute pointer-events-none"
        style={{ 
          width: '432px', 
          height: '768px',
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
                  <div className="absolute inset-0 pointer-events-none" style={gradientOverlayStyle} />
                )}
              </div>

              {/* Subtítulo centrado sobre el precio - Canvas */}
              {propertyData.subtitulos && propertyData.subtitulos[currentPhotoIndex] && (
                <div className="absolute bottom-[160px] left-0 right-0 z-20 flex justify-center px-4">
                  <div className={`${currentTemplate.subtitleStyle.background} px-4 py-1.5 rounded-full shadow-xl max-w-[80%]`}>
                    <p className="text-white text-base font-bold text-center leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {propertyData.subtitulos[currentPhotoIndex]}
                    </p>
                  </div>
                </div>
              )}

              {/* Logo del aliado */}
              <div className="absolute top-6 left-6 z-20">
                <img
                  src={logoRubyMorales}
                  alt={aliadoConfig.nombre}
                  className="w-20 h-20 rounded-xl border-2 border-white/80 object-contain bg-white/90 p-1"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  data-ally-logo="true"
                />
              </div>

              {/* Precio movido al área inferior - MISMO ESTILO QUE PREVIEW */}
              {(() => {
                const esVenta = propertyData.modalidad === "venta" || (!!propertyData.valorVenta && !propertyData.canon);
                const precio = esVenta ? propertyData.valorVenta : propertyData.canon;
                
                return (
                  <div className="absolute bottom-6 left-0 right-0 p-6 pr-24 pb-14 z-10">
                    {/* Precio con máxima visibilidad - Canvas */}
                    {precio && (
                      <div 
                        className="inline-block px-5 py-2.5 rounded-xl shadow-2xl mb-3 max-w-[85%] z-40"
                        style={{ 
                          backgroundColor: '#FF8C42',
                          opacity: 0.95,
                          border: '2px solid rgba(255,255,255,0.25)'
                        }}
                      >
                        <p 
                          className="text-2xl font-black text-white flex items-center gap-2" 
                          style={{ textShadow: '0 3px 10px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,1)' }}
                        >
                          <span>💰</span>
                          <span>{formatPrecioColombia(precio)}</span>
                          {!esVenta && <span className="text-lg">/mes</span>}
                        </p>
                      </div>
                    )}
                    
                    <h3 className="text-white text-3xl font-black mb-2" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9)' }}>
                      {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
                    </h3>
                    {propertyData.ubicacion && (
                      <p className="text-white text-lg font-bold mb-3" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9)' }}>📍 {propertyData.ubicacion}</p>
                    )}

                    {/* Logo El Gestor - inferior derecha */}
                    <div className="absolute bottom-6 right-4 z-40">
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
            </>
          )}
         </div>

          </Card>
        </div>

        {/* PARTE 4: Panel de Controles Unificado con 3 Tabs */}
        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="visual" className="text-sm font-semibold">
                🎨 Estilo Visual
              </TabsTrigger>
              <TabsTrigger value="sombreado" className="text-sm font-semibold">
                🌗 Sombreado
              </TabsTrigger>
              <TabsTrigger value="final" className="text-sm font-semibold">
                🎬 Slide Final
              </TabsTrigger>
            </TabsList>
            
            {/* Tab 1: Estilo Visual (Template Selector) */}
            <TabsContent value="visual" className="space-y-4 mt-0">
              <TemplateSelector 
                selected={selectedTemplate}
                onChange={setSelectedTemplate}
              />
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 <strong>Tip:</strong> Cada template tiene su propia paleta de colores y estilo. 
                  Elige el que mejor represente tu inmueble: Residencial para hogares, Comercial para negocios, o Premium para propiedades exclusivas.
                </p>
              </div>
            </TabsContent>
            
            {/* Tab 2: Efectos de Sombreado */}
            <TabsContent value="sombreado" className="space-y-5 mt-0">
              <div className="grid grid-cols-4 gap-3">
                {(['none', 'top', 'bottom', 'both'] as const).map((dir) => {
                  const labels = {
                    none: { icon: '🔆', text: 'Sin Sombreado' },
                    top: { icon: '🔝', text: 'Superior' },
                    bottom: { icon: '🔻', text: 'Inferior' },
                    both: { icon: '⬍', text: 'Ambos Lados' }
                  };
                  return (
                    <Button
                      key={dir}
                      variant={gradientDirection === dir ? "default" : "outline"}
                      size="lg"
                      onClick={() => setGradientDirection(dir)}
                      className="flex flex-col h-auto py-4 gap-2"
                    >
                      <span className="text-3xl">{labels[dir].icon}</span>
                      <span className="text-xs font-medium leading-tight text-center">{labels[dir].text}</span>
                    </Button>
                  );
                })}
              </div>
              
              {gradientDirection !== 'none' && (
                <div className="pt-4 border-t space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold">🌗 Intensidad del sombreado</span>
                    <span className="text-sm font-bold bg-primary/10 px-4 py-1.5 rounded-full">
                      {gradientIntensity}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={gradientIntensity}
                    onChange={(e) => handleGradientIntensityChange(Number(e.target.value))}
                    className="w-full h-3 bg-secondary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>🔆 Ligero</span>
                    <span>🌑 Intenso</span>
                  </div>
                </div>
              )}
              
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 <strong>Tip:</strong> El sombreado mejora la legibilidad del texto sobre las fotos. 
                  Ajusta la intensidad según el brillo de tus imágenes para obtener el mejor contraste.
                </p>
              </div>
            </TabsContent>
            
            {/* Tab 3: Fondo del Slide Final (con color picker para solid) */}
            <TabsContent value="final" className="space-y-5 mt-0">
              <div className="grid grid-cols-3 gap-4">
                {(['solid', 'blur', 'mosaic'] as const).map((bg) => {
                  const options = {
                    solid: { 
                      icon: '🎨', 
                      text: 'Color Sólido',
                      desc: 'Fondo limpio con color personalizado'
                    },
                    blur: { 
                      icon: '🌫️', 
                      text: 'Foto Difuminada',
                      desc: 'Última foto con efecto blur'
                    },
                    mosaic: { 
                      icon: '🖼️', 
                      text: 'Mosaico',
                      desc: 'Grid con tus fotos'
                    }
                  };
                  return (
                    <Button
                      key={bg}
                      variant={summaryBackground === bg ? "default" : "outline"}
                      size="lg"
                      onClick={() => setSummaryBackground(bg)}
                      className="flex flex-col h-auto py-4 px-3 text-center gap-2"
                    >
                      <span className="text-3xl">{options[bg].icon}</span>
                      <span className="text-xs font-medium leading-tight">{options[bg].text}</span>
                    </Button>
                  );
                })}
              </div>
              
              {/* Color picker para fondo sólido */}
              {summaryBackground === 'solid' && (
                <div className="pt-4 border-t space-y-3">
                  <label className="text-sm font-semibold">🎨 Color del Fondo Sólido</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={summarySolidColor}
                      onChange={(e) => setSummarySolidColor(e.target.value)}
                      className="w-16 h-12 rounded-lg cursor-pointer border-2 border-border"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{summarySolidColor.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground">
                        Elige un color que represente tu marca
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Hashtag personalizado */}
              <div className="pt-4 border-t space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  #️⃣ Hashtag Personalizado
                </label>
                <input
                  type="text"
                  value={customHashtag}
                  onChange={(e) => setCustomHashtag(e.target.value.slice(0, 50))}
                  placeholder="#TuHashtagAquí"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-input bg-background text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Máximo 50 caracteres. Ejemplo: #ArriendosCali #PropiedadesExclusivas
                </p>
              </div>
              
              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 <strong>Vista previa:</strong> El slide final se muestra arriba en tiempo real. 
                  {summaryBackground === 'solid' && ' Personaliza el color para que coincida con tu identidad de marca.'}
                  {summaryBackground === 'blur' && ' El fondo difuminado crea una transición elegante desde las fotos.'}
                  {summaryBackground === 'mosaic' && ' El mosaico muestra un resumen visual de todas tus fotos.'}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Miniaturas reordenables - Grid horizontal con scroll */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">
              📸 Orden de las fotos en el reel
            </p>
            <p className="text-xs text-muted-foreground">
              Arrastra para reordenar
            </p>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={photosList.map(p => p.id)} strategy={horizontalListSortingStrategy}>
              <div className="grid grid-cols-5 lg:grid-cols-8 gap-3">
                {photosList.map((photo, idx) => (
                  <SortablePhoto
                    key={photo.id}
                    id={photo.id}
                    src={photo.src}
                    index={idx}
                    isActive={idx === currentPhotoIndex && activeTab !== 'final'}
                    onClick={() => handlePhotoClick(idx)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </Card>

        {/* Botón de descarga prominente */}
        <div className="flex justify-center">
          <Button onClick={handleDownloadVideo} size="lg" className="w-full max-w-md h-14 text-base">
            <Download className="mr-2 w-5 h-5" /> Descargar Video MP4
          </Button>
        </div>

        {/* Instrucciones finales */}
        <div className="p-4 bg-accent/30 rounded-lg border border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground text-center">
            <p>
              💡 <strong className="text-foreground">Play:</strong> Ver slideshow automático
            </p>
            <p>
              🔄 <strong className="text-foreground">Reordenar:</strong> Arrastra las miniaturas
            </p>
            <p>
              📥 <strong className="text-foreground">Descargar:</strong> Video MP4 de alta calidad
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
