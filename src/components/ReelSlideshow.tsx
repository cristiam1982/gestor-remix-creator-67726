import { useState, useEffect } from "react";
import { PropertyData, AliadoConfig, ReelTemplate } from "@/types/property";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Download, GripVertical } from "lucide-react";
import elGestorLogo from "@/assets/el-gestor-logo.png";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";
import { generateReelVideo, downloadBlob, VideoGenerationProgress } from "@/utils/videoGenerator";
import { VideoGenerationProgressModal } from "./VideoGenerationProgress";
import { TemplateSelector } from "./TemplateSelector";
import { ReelControlsPanel } from "./ReelControlsPanel";
import { ReelSummarySlide } from "./ReelSummarySlide";
import { formatPrecioColombia } from "@/utils/formatters";
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
      <button
        onClick={onClick}
        className="w-full h-full"
      >
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

export const ReelSlideshow = ({ propertyData, aliadoConfig, onDownload }: ReelSlideshowProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [previousPhotoIndex, setPreviousPhotoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationProgress, setGenerationProgress] = useState<VideoGenerationProgress | null>(null);
  const [photos, setPhotos] = useState<string[]>(propertyData.fotos || []);
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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSummarySlide, setShowSummarySlide] = useState(false);
  const { toast } = useToast();
  
  const slideDuration = 1300; // 1.3 segundos por foto (mejor legibilidad)
  const summaryDuration = 2500; // 2.5 segundos para slide de resumen
  const currentTemplate = REEL_TEMPLATES[selectedTemplate];
  const baseGradient = currentTemplate.gradient[gradientDirection];
  const finalGradient = applyGradientIntensity(baseGradient, gradientIntensity);

  // Helper: Obtener máximo 4 tags principales (habitaciones, baños, parqueaderos, área)
  const getTopTags = () => {
    const tags: { icon: string; text: string; priority: number }[] = [];
    
    // Prioridad: habitaciones > baños > parqueaderos > área
    if (propertyData.habitaciones) tags.push({ icon: "🛏️", text: `${propertyData.habitaciones}`, priority: 1 });
    if (propertyData.banos) tags.push({ icon: "🚿", text: `${propertyData.banos}`, priority: 2 });
    if (propertyData.parqueaderos) tags.push({ icon: "🚗", text: `${propertyData.parqueaderos}`, priority: 3 });
    if (propertyData.area) tags.push({ icon: "📐", text: `${propertyData.area}m²`, priority: 4 });
    
    return tags.sort((a, b) => a.priority - b.priority).slice(0, 4);
  };

  // Sensors para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sincronizar fotos cuando cambia propertyData
  useEffect(() => {
    setPhotos(propertyData.fotos || []);
  }, [propertyData.fotos]);

  useEffect(() => {
    if (!isPlaying || photos.length === 0) return;

    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => {
        const next = (prev + 1) % (photos.length + 1); // +1 para incluir slide de resumen
        if (next === photos.length) {
          // Mostrar slide de resumen
          setShowSummarySlide(true);
          setProgress(0);
          return prev; // Mantener el índice en la última foto
        } else if (next === 0) {
          // Llegó al final, detener
          setShowSummarySlide(false);
          setIsPlaying(false);
          setProgress(0);
        } else {
          setShowSummarySlide(false);
        }
        return next;
      });
      setProgress(0);
    }, showSummarySlide ? summaryDuration : slideDuration);

    return () => clearInterval(interval);
  }, [isPlaying, photos.length, slideDuration, summaryDuration, showSummarySlide]);

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
    setCurrentPhotoIndex(index);
    setShowSummarySlide(false);
    setProgress(0);
    setIsPlaying(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPhotos((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);

        // Si la foto actual fue movida, actualizar el índice
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
        description: "Arrastra las miniaturas para cambiar el orden del slideshow.",
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
        if (index >= photos.length) {
          // Mostrar slide de resumen
          setShowSummarySlide(true);
          setCurrentPhotoIndex(photos.length - 1);
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
        photos,
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

  if (photos.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          Sube fotos para ver el slideshow animado
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {generationProgress && <VideoGenerationProgressModal progress={generationProgress} />}
      
      {/* Template Selector arriba */}
      <TemplateSelector 
        selected={selectedTemplate}
        onChange={setSelectedTemplate}
      />

      {/* Layout principal: 2 columnas en desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        
        {/* Columna 1: Preview del Reel */}
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-primary">Reel Slideshow</h3>
                <p className="text-sm text-muted-foreground">
                  {photos.length} fotos + slide final · {((photos.length * 1.3) + 2.5).toFixed(1)}s total · {currentTemplate.name}
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
            <div className="relative aspect-[9/16] max-w-[400px] mx-auto bg-black rounded-xl overflow-hidden shadow-2xl mb-4">
          {/* Barras de progreso - incluye slide de resumen */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
            {[...photos, 'summary'].map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-100"
                  style={{
                    width: idx < currentPhotoIndex ? "100%" : 
                           (idx === currentPhotoIndex && !showSummarySlide) ? `${progress}%` :
                           (idx === photos.length && showSummarySlide) ? `${progress}%` : "0%"
                  }}
                />
              </div>
            ))}
          </div>

          {/* Slide de resumen */}
          {showSummarySlide && (
            <ReelSummarySlide 
              propertyData={propertyData}
              aliadoConfig={aliadoConfig}
              isVisible={true}
              photos={photos}
              backgroundStyle={summaryBackground}
            />
          )}

          {/* Foto actual con overlay y crossfade - Solo mostrar si NO es slide de resumen */}
          {!showSummarySlide && (
            <div className="absolute inset-0">
              {/* Foto anterior (fade out) */}
              <img
                src={photos[previousPhotoIndex]}
                alt={`Foto ${previousPhotoIndex + 1}`}
                className={`absolute inset-0 w-full h-full object-cover photo-crossfade ${
                  isTransitioning ? 'photo-crossfade-enter' : 'photo-crossfade-active'
                }`}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
              
              {/* Foto actual (fade in) */}
              <img
                src={photos[currentPhotoIndex]}
                alt={`Foto ${currentPhotoIndex + 1}`}
                className={`absolute inset-0 w-full h-full object-cover photo-crossfade ${
                  isTransitioning ? 'photo-crossfade-active' : 'opacity-0'
                }`}
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
              />
              
              {/* Gradient overlay dinámico según template e intensidad */}
              {finalGradient && (
                <div className={`absolute inset-0 bg-gradient-to-b ${finalGradient}`} />
              )}
            </div>
          )}

          {/* Subtítulo si existe - Fase 3: mejorado + Template Fase 4 */}
          {!showSummarySlide && propertyData.subtitulos && propertyData.subtitulos[currentPhotoIndex] && (
            <div className="absolute top-14 left-0 right-0 z-20 flex justify-center px-4 animate-slide-up-bounce">
              <div className={`${currentTemplate.subtitleStyle.background} px-5 py-2 rounded-full shadow-2xl`}>
                <p className={`text-white ${currentTemplate.subtitleStyle.textSize} font-bold text-center leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
                  {propertyData.subtitulos[currentPhotoIndex]}
                </p>
              </div>
            </div>
          )}

          {/* Logo del aliado */}
          {!showSummarySlide && (
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


          {!showSummarySlide && (() => {
            const esVenta = propertyData.modalidad === "venta" || (!!propertyData.valorVenta && !propertyData.canon);
            const precio = esVenta ? propertyData.valorVenta : propertyData.canon;
            
            return (
              <div className="absolute bottom-0 left-0 right-0 p-6 pr-24 pb-12 z-10">
                {/* Precio arriba del tipo - NUEVO */}
                {precio && (
                  <div 
                    className="inline-block px-6 py-3 rounded-2xl shadow-2xl mb-3"
                    style={{ 
                      background: `linear-gradient(135deg, ${aliadoConfig.colorPrimario}E5, ${aliadoConfig.colorSecundario}E5)`,
                    }}
                  >
                    <p className="text-2xl font-black text-white flex items-center gap-2 drop-shadow-2xl">
                      <span>💰</span>
                      <span>{formatPrecioColombia(precio)}</span>
                      {!esVenta && <span className="text-xl">/mes</span>}
                    </p>
                  </div>
                )}
                
                <h3 className="text-white text-2xl font-bold mb-2" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9)' }}>
                  {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
                </h3>
              {propertyData.ubicacion && (
                <p className="text-white text-sm mb-3" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9)' }}>📍 {propertyData.ubicacion}</p>
              )}
              
               {/* Máximo 4 características principales */}
               <div className="flex flex-wrap gap-2 text-sm">
                 {getTopTags().map((tag, idx) => (
                   <span 
                     key={`tag-preview-${idx}-${tag.icon}`}
                     className="px-3 py-2 rounded-xl shadow-lg text-white font-semibold"
                     style={{ 
                       backgroundColor: aliadoConfig.colorSecundario,
                       border: '1px solid rgba(255, 255, 255, 0.2)',
                       textShadow: '1px 1px 3px rgba(0,0,0,0.6)'
                     }}
                   >
                     {tag.icon} {tag.text}
                   </span>
                 ))}
               </div>

                {/* Logo El Gestor - inferior derecha */}
                <div className="absolute bottom-8 right-4 z-40">
                  <img 
                    src={elGestorLogo} 
                    alt="El Gestor" 
                    data-eg-logo="true"
                    className="h-8 object-contain drop-shadow-lg"
                  />
                </div>
              </div>
            );
          })()}

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
              photos={photos}
              backgroundStyle={summaryBackground}
            />
          )}

          {/* Foto actual con overlay - CÓDIGO IDÉNTICO AL PREVIEW + Template */}
          {!showSummarySlide && (
            <>
              <div className="absolute inset-0">
                <img
                  src={photos[currentPhotoIndex]}
                  alt={`Foto ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                />
                {/* Gradient overlay dinámico según template e intensidad */}
                {finalGradient && (
                  <div className={`absolute inset-0 bg-gradient-to-b ${finalGradient}`} />
                )}
              </div>

              {/* Subtítulo si existe - Template Fase 4 */}
              {propertyData.subtitulos && propertyData.subtitulos[currentPhotoIndex] && (
                <div className="absolute top-14 left-0 right-0 z-20 flex justify-center px-4">
                  <div className={`${currentTemplate.subtitleStyle.background} px-5 py-2 rounded-full shadow-2xl`}>
                    <p className={`text-white ${currentTemplate.subtitleStyle.textSize} font-bold text-center leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}>
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
                  <div className="absolute bottom-0 left-0 right-0 p-6 pr-24 pb-12 z-10">
                    {/* Precio arriba del tipo */}
                    {precio && (
                      <div 
                        className="inline-block px-6 py-3 rounded-2xl shadow-2xl mb-3"
                        style={{ 
                          background: `linear-gradient(135deg, ${aliadoConfig.colorPrimario}E5, ${aliadoConfig.colorSecundario}E5)`,
                        }}
                      >
                        <p className="text-2xl font-black text-white flex items-center gap-2 drop-shadow-2xl">
                          <span>💰</span>
                          <span>{formatPrecioColombia(precio)}</span>
                          {!esVenta && <span className="text-xl">/mes</span>}
                        </p>
                      </div>
                    )}
                    
                    <h3 className="text-white text-2xl font-bold mb-2" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9)' }}>
                      {propertyData.tipo.charAt(0).toUpperCase() + propertyData.tipo.slice(1)}
                    </h3>
                    {propertyData.ubicacion && (
                      <p className="text-white text-sm mb-3" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9)' }}>📍 {propertyData.ubicacion}</p>
                    )}
                    
                    {/* Máximo 4 características principales */}
                    <div className="flex flex-wrap gap-2 text-sm">
                      {getTopTags().map((tag, idx) => (
                        <span 
                          key={`tag-canvas-${idx}-${tag.icon}`}
                          className="px-3 py-2 rounded-xl shadow-lg text-white font-semibold"
                          style={{ 
                            backgroundColor: aliadoConfig.colorSecundario,
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            textShadow: '1px 1px 3px rgba(0,0,0,0.6)'
                          }}
                        >
                          {tag.icon} {tag.text}
                        </span>
                      ))}
                    </div>

                    {/* Logo El Gestor - inferior derecha */}
                    <div className="absolute bottom-8 right-4 z-40">
                      <img 
                        src={elGestorLogo} 
                        alt="El Gestor" 
                        data-eg-logo="true"
                        className="h-8 object-contain drop-shadow-lg"
                      />
                    </div>
                  </div>
                );
              })()}
            </>
          )}
         </div>

            {/* Miniaturas con drag & drop - Solo desktop */}
            <div className="hidden lg:block">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">
                  📸 Arrastra las fotos para cambiar el orden
                </p>
              </div>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={photos} strategy={horizontalListSortingStrategy}>
                  <div className="grid grid-cols-5 gap-2">
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
              </DndContext>
            </div>

            {/* Instrucciones - Solo desktop */}
            <div className="hidden lg:block mt-4 p-3 bg-accent/50 rounded-lg space-y-1">
              <p className="text-sm text-muted-foreground text-center">
                💡 <strong>Play:</strong> Ver slideshow automático (1.3s por foto + slide final)
              </p>
              <p className="text-sm text-muted-foreground text-center">
                🔄 <strong>Reordenar:</strong> Arrastra el ícono de las miniaturas
              </p>
              <p className="text-sm text-muted-foreground text-center">
                📥 <strong>Descargar:</strong> Genera video MP4 de alta calidad (15-30s)
              </p>
            </div>
          </Card>
        </div>

        {/* Columna 2: Panel de Controles (sticky en desktop) */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span>⚙️</span> Personalización Visual
            </h3>
            
            {/* Controles en desktop: siempre visibles */}
            <div className="hidden lg:block space-y-6">
              {/* Efectos de sombreado */}
              <div className="space-y-3">
                <label className="text-sm font-semibold">🎨 Efectos de Sombreado</label>
                <div className="space-y-4">
                  <div className="text-xs text-muted-foreground">
                    Ajusta la dirección e intensidad del sombreado para mejorar la legibilidad del texto sobre las fotos.
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['none', 'top', 'bottom', 'both'] as const).map((dir) => {
                      const labels = {
                        none: { icon: '🔆', text: 'Sin' },
                        top: { icon: '🔝', text: 'Arriba' },
                        bottom: { icon: '🔻', text: 'Abajo' },
                        both: { icon: '⬍', text: 'Ambos' }
                      };
                      return (
                        <Button
                          key={dir}
                          variant={gradientDirection === dir ? "default" : "outline"}
                          size="sm"
                          onClick={() => setGradientDirection(dir)}
                          className="flex flex-col h-auto py-2"
                        >
                          <span className="text-lg">{labels[dir].icon}</span>
                          <span className="text-xs">{labels[dir].text}</span>
                        </Button>
                      );
                    })}
                  </div>
                  {gradientDirection !== 'none' && (
                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium">Intensidad</span>
                        <span className="text-xs font-bold bg-secondary/10 px-2 py-0.5 rounded-full">
                          {gradientIntensity}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={gradientIntensity}
                        onChange={(e) => setGradientIntensity(Number(e.target.value))}
                        className="w-full h-2 bg-secondary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4" />

              {/* Fondo del slide final */}
              <div className="space-y-3">
                <label className="text-sm font-semibold">🎬 Fondo del Slide Final</label>
                <div className="text-xs text-muted-foreground mb-2">
                  Elige el estilo de fondo para el último slide con tu información de contacto.
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['solid', 'blur', 'mosaic'] as const).map((bg) => {
                    const labels = {
                      solid: { icon: '🎨', text: 'Color' },
                      blur: { icon: '🌫️', text: 'Difuminado' },
                      mosaic: { icon: '🖼️', text: 'Mosaico' }
                    };
                    return (
                      <Button
                        key={bg}
                        variant={summaryBackground === bg ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSummaryBackground(bg)}
                        className="flex flex-col h-auto py-2"
                      >
                        <span className="text-lg">{labels[bg].icon}</span>
                        <span className="text-xs">{labels[bg].text}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Controles en mobile: Accordion colapsable */}
            <div className="lg:hidden">
              <ReelControlsPanel
                gradientDirection={gradientDirection}
                onGradientDirectionChange={setGradientDirection}
                gradientIntensity={gradientIntensity}
                onGradientIntensityChange={setGradientIntensity}
                summaryBackground={summaryBackground}
                onSummaryBackgroundChange={setSummaryBackground}
              />
            </div>
          </Card>

          {/* Botones de descarga (sticky) */}
          <div className="mt-4 space-y-2">
            <Button onClick={handleDownloadVideo} className="w-full" size="lg">
              <Download className="mr-2" /> Descargar Video MP4
            </Button>
          </div>
        </div>
      </div>

      {/* Miniaturas en mobile (abajo) */}
      <div className="lg:hidden">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">
              📸 Arrastra las fotos para cambiar el orden
            </p>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={photos} strategy={horizontalListSortingStrategy}>
              <div className="grid grid-cols-4 gap-2">
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
          </DndContext>
        </Card>
      </div>
    </div>
  );
};
