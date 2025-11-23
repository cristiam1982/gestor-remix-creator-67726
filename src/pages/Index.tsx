import { useState, useEffect } from "react";
import { Square, Smartphone, Image as ImageIcon, Video, Film, Download, RefreshCw, CheckCircle, DollarSign, Images, ChevronLeft, Info, Copy } from "lucide-react";
import { ContentTypeCard } from "@/components/ContentTypeCard";
import { BrandedHeroSection } from "@/components/BrandedHeroSection";
import { PropertyForm } from "@/components/PropertyForm";
import { ArrendadoForm } from "@/components/ArrendadoForm";
import { PhotoManager } from "@/components/PhotoManager";
import { FooterCustomization } from "@/components/MultiVideoFooterControls";
import { CanvasPreview } from "@/components/CanvasPreview";
import { ArrendadoPreview } from "@/components/ArrendadoPreview";
import { ReelSlideshow } from "@/components/ReelSlideshow";
import { ArrendadoReelSlideshow } from "@/components/ArrendadoReelSlideshow";
import { VideoReelRecorder } from "@/components/VideoReelRecorder";
import { MultiVideoManager } from "@/components/MultiVideoManager";
import { MultiVideoProcessingModal } from "@/components/MultiVideoProcessingModal";
import { MultiVideoControlsPanel } from "@/components/MultiVideoControlsPanel";
import { MultiVideoStaticPreview } from "@/components/MultiVideoStaticPreview";
import { generateMultiVideoReel } from "@/utils/multiVideoGenerator";
import { MetricsPanel } from "@/components/MetricsPanel";
import { PostControlsPanel } from "@/components/PostControlsPanel";
import { LoadingState } from "@/components/LoadingState";
import { AliadoConfig, PropertyData, ContentType, LogoSettings, TextCompositionSettings, VisualLayers, FirstPhotoConfig } from "@/types/property";
import { ArrendadoData, ArrendadoType } from "@/types/arrendado";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateCaption, regenerateCaption, generateArrendadoCaption } from "@/utils/captionGenerator";
import { exportToImage, exportVideo } from "@/utils/imageExporter";
import { validatePropertyData, validateArrendadoData } from "@/utils/formValidation";
import { savePublicationMetric, clearMetrics } from "@/utils/metricsManager";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useToast } from "@/hooks/use-toast";
import { ALIADO_CONFIG } from "@/config/aliadoConfig";
import { exportAllPhotos } from "@/utils/postMultiExporter";
interface VideoInfo {
  id: string;
  url: string;
  file: File;
  duration: number;
  subtitle?: string;
}
const Index = () => {
  const {
    toast
  } = useToast();
  const [aliadoConfig, setAliadoConfig] = useState<AliadoConfig>(ALIADO_CONFIG);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [propertyData, setPropertyData] = useState<Partial<PropertyData>>({
    fotos: [],
    subtitulos: []
  });
  const [arrendadoData, setArrendadoData] = useState<Partial<ArrendadoData>>({
    fotos: [],
    precio: "",
    videoUrl: ""
  });
  const [arrendadoFormat, setArrendadoFormat] = useState<"historia" | "reel-fotos" | "reel-video">("historia");
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [multiVideos, setMultiVideos] = useState<VideoInfo[]>([]);
  const [isProcessingMultiVideo, setIsProcessingMultiVideo] = useState(false);
  const [multiVideoProgress, setMultiVideoProgress] = useState(0);
  const [multiVideoStage, setMultiVideoStage] = useState("");
  const [generatedMultiVideoBlob, setGeneratedMultiVideoBlob] = useState<Blob | null>(null);
  const [currentPhotoIndexOverride, setCurrentPhotoIndexOverride] = useState<number | undefined>(undefined);
  const [isExportingAllPhotos, setIsExportingAllPhotos] = useState(false);
  const [exportProgress, setExportProgress] = useState({
    current: 0,
    total: 0
  });

  // Estados para personalización del post cuadrado
  const [postLogoSettings, setPostLogoSettings] = useState<LogoSettings>({
    position: "top-right",
    size: "small",
    opacity: 90,
    background: "elevated",
    shape: "rounded"
  });
  const [postTextComposition, setPostTextComposition] = useState<TextCompositionSettings>({
    typographyScale: 1.0,
    badgeScale: 1.0,
    badgeStyle: "rounded",
    verticalSpacing: "normal"
  });
  const [postVisualLayers, setPostVisualLayers] = useState<VisualLayers>({
    showPhoto: true,
    showPrice: true,
    showBadge: true,
    showIcons: true,
    showAllyLogo: true,
    showCTA: true
  });
  const [postGradientDirection, setPostGradientDirection] = useState<"top" | "bottom" | "both" | "none">("both");
  const [postGradientIntensity, setPostGradientIntensity] = useState(60);
  const [postFirstPhotoConfig, setPostFirstPhotoConfig] = useState<FirstPhotoConfig>({
    showPrice: true,
    showTitle: true,
    showIcons: true,
    showCTA: true,
    textScaleOverride: 0,
    showAllyLogo: true
  });

  // Multi-video visual settings
  const [multiVideoLogoSettings, setMultiVideoLogoSettings] = useState<LogoSettings>({
    position: 'top-right',
    opacity: 100,
    background: 'elevated',
    size: 'medium',
    shape: 'rounded'
  });
  const [multiVideoTextComposition, setMultiVideoTextComposition] = useState<TextCompositionSettings>({
    typographyScale: 0,
    badgeScale: 0,
    badgeStyle: 'rounded',
    verticalSpacing: 'normal'
  });
  const [multiVideoVisualLayers, setMultiVideoVisualLayers] = useState<VisualLayers>({
    showPhoto: true,
    showPrice: true,
    showBadge: true,
    showIcons: true,
    showAllyLogo: true,
    showCTA: true
  });
  const [multiVideoGradientDirection, setMultiVideoGradientDirection] = useState<'none' | 'top' | 'bottom' | 'both'>('bottom');
  const [multiVideoGradientIntensity, setMultiVideoGradientIntensity] = useState(60);
  const [multiVideoFooterCustomization, setMultiVideoFooterCustomization] = useState<FooterCustomization>({
    showElGestorLogo: true,
    customPhone: '',
    customHashtag: '',
    customTypeText: '',
    customLocationText: ''
  });
  const {
    loadAutoSavedData,
    clearAutoSavedData
  } = useAutoSave(propertyData, currentStep === 2);
  const isArrendadoType = selectedContentType === "arrendado" || selectedContentType === "vendido";
  useEffect(() => {
    // Cargar datos autoguardados si existen
    try {
      const saved = localStorage.getItem("property-form-autosave");
      const autoSaved = saved ? JSON.parse(saved) : null;
      if (autoSaved && autoSaved.tipo) {
        toast({
          title: "📝 Borrador recuperado",
          description: "Se ha restaurado tu última sesión."
        });
        setPropertyData(autoSaved);
      }
    } catch (error) {
      console.error("Error loading auto-saved data:", error);
    }
  }, []);
  const handleContentTypeSelect = (type: ContentType) => {
    setSelectedContentType(type);
    setCurrentStep(2);
  };
  const handleBackToHub = () => {
    setSelectedContentType(null);
    setPropertyData({
      fotos: [],
      subtitulos: []
    });
    setArrendadoData({
      fotos: []
    });
    setMultiVideos([]);
    setGeneratedMultiVideoBlob(null);
    setCurrentStep(1);
    setGeneratedCaption("");
    setValidationErrors({});
    clearAutoSavedData();
  };
  const handleGeneratePreview = () => {
    // Flujo para multi-video
    if (selectedContentType === "reel-multi-video") {
      if (multiVideos.length < 2) {
        toast({
          title: "⚠️ Faltan videos",
          description: "Sube al menos 2 videos para generar un reel multi-video.",
          variant: "destructive"
        });
        return;
      }
      const totalDuration = multiVideos.reduce((sum, v) => sum + v.duration, 0);
      if (totalDuration > 100) {
        toast({
          title: "⚠️ Duración excedida",
          description: "La duración total no puede superar 100 segundos.",
          variant: "destructive"
        });
        return;
      }
      if (!propertyData.tipo) {
        toast({
          title: "⚠️ Completa el formulario",
          description: "Selecciona el tipo de inmueble antes de continuar.",
          variant: "destructive"
        });
        return;
      }

      // Generar caption automáticamente al avanzar al Step 3
      if (!generatedCaption && propertyData.tipo) {
        const caption = generateCaption(propertyData as PropertyData, aliadoConfig, "residencial", true);
        setGeneratedCaption(caption);
      }
      setCurrentStep(3);
      toast({
        title: "✅ Multi-video listo",
        description: "Ahora puedes personalizar y generar tu reel."
      });
      return;
    }

    // Flujo para Arrendado/Vendido
    if (isArrendadoType) {
      if (!arrendadoData.tipo || !arrendadoData.ubicacion || !arrendadoData.diasEnMercado) {
        toast({
          title: "⚠️ Completa el formulario",
          description: "Todos los campos son requeridos.",
          variant: "destructive"
        });
        return;
      }

      // Validación específica para reel-video
      if (arrendadoFormat === "reel-video" && !arrendadoData.videoUrl) {
        toast({
          title: "⚠️ Falta video",
          description: "Sube un video para generar el reel con video.",
          variant: "destructive"
        });
        return;
      }

      // Validación para reel-fotos
      if (arrendadoFormat === "reel-fotos" && (!arrendadoData.fotos || arrendadoData.fotos.length < 2)) {
        toast({
          title: "⚠️ Faltan fotos",
          description: "Sube al menos 2 fotos para generar el slideshow.",
          variant: "destructive"
        });
        return;
      }

      // Validación para historia (al menos 1 foto)
      if (arrendadoFormat === "historia" && (!arrendadoData.fotos || arrendadoData.fotos.length === 0)) {
        toast({
          title: "⚠️ Sube al menos una foto",
          description: "Se requiere al menos 1 imagen.",
          variant: "destructive"
        });
        return;
      }
      const caption = generateArrendadoCaption(arrendadoData as ArrendadoData, aliadoConfig, selectedContentType as ArrendadoType);
      setGeneratedCaption(caption);
      setCurrentStep(3);
      savePublicationMetric(arrendadoData.tipo!, selectedContentType!, "celebratorio");
      toast({
        title: "🎉 ¡Publicación celebratoria lista!",
        description: "Comparte tu éxito en redes sociales."
      });
      return;
    }

    // Flujo normal para propiedades disponibles
    if (!propertyData.tipo) {
      toast({
        title: "⚠️ Selecciona un tipo de inmueble",
        description: "Completa el formulario antes de continuar.",
        variant: "destructive"
      });
      return;
    }
    const validation = validatePropertyData(propertyData, propertyData.tipo);
    if (!validation.success) {
      setValidationErrors(validation.errors);
      toast({
        title: "❌ Errores en el formulario",
        description: "Por favor corrige los campos marcados en rojo.",
        variant: "destructive"
      });
      return;
    }
    setValidationErrors({});
    if (aliadoConfig && propertyData.tipo) {
      const caption = generateCaption(propertyData as PropertyData, aliadoConfig, "residencial", true);
      setGeneratedCaption(caption);
      setCurrentStep(3);
      savePublicationMetric(propertyData.tipo, selectedContentType!, "residencial");
      toast({
        title: "✨ Tu publicación está lista",
        description: "Revisa el caption y descarga tu imagen."
      });
    }
  };
  const handleCopyCaption = () => {
    navigator.clipboard.writeText(generatedCaption);
    toast({
      title: "📋 Caption copiado",
      description: "El texto está listo para pegar en tus redes sociales."
    });
  };
  const handleClearMetrics = () => {
    clearMetrics();
    toast({
      title: "🗑️ Estadísticas limpiadas",
      description: "Se han eliminado todas las métricas guardadas."
    });
  };
  const handleRegenerateCaption = () => {
    if (aliadoConfig && propertyData.tipo) {
      const newCaption = regenerateCaption(propertyData as PropertyData, aliadoConfig, "residencial");
      setGeneratedCaption(newCaption);
      toast({
        title: "✨ Caption regenerado",
        description: "Se ha creado una versión alternativa."
      });
    }
  };
  const handleDownloadImage = async () => {
    setIsDownloading(true);
    toast({
      title: "🎨 Generando imagen...",
      description: "Esto tomará unos segundos"
    });
    try {
      if (selectedContentType === "reel-video" && propertyData.fotos && propertyData.fotos[0]) {
        await exportVideo(propertyData.fotos[0], `reel-${propertyData.tipo}-${Date.now()}.mp4`);
        toast({
          title: "✅ Video descargado",
          description: "Edita el video con tu app favorita agregando los textos."
        });
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      const tipo = isArrendadoType ? arrendadoData.tipo : propertyData.tipo;
      const filename = `publicacion-${tipo}-${Date.now()}.png`;
      
      // Capturar desde el mismo elemento visible (patrón ArrendadoPreview)
      await exportToImage("canvas-preview", filename, {
        format: "png",
        quality: 0.95
      });
      toast({
        title: "✅ Descarga lista",
        description: "Tu publicación se ha guardado correctamente."
      });
    } catch (error) {
      console.error("Error al descargar:", error);
      toast({
        title: "❌ Error al descargar",
        description: "Intenta nuevamente o contacta soporte.",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };
  const handleExportAllPhotos = async () => {
    if (!propertyData.fotos || propertyData.fotos.length <= 1) {
      toast({
        title: "⚠️ No hay múltiples fotos",
        description: "Necesitas al menos 2 fotos para usar esta función.",
        variant: "destructive"
      });
      return;
    }
    setIsExportingAllPhotos(true);
    setExportProgress({
      current: 0,
      total: propertyData.fotos.length
    });
    toast({
      title: "📸 Exportando todas las fotos...",
      description: `Se exportarán ${propertyData.fotos.length} imágenes`
    });
    try {
      await exportAllPhotos(propertyData as PropertyData, aliadoConfig!, {
        format: "png",
        quality: 0.95
      }, selectedContentType!, setCurrentPhotoIndexOverride, (current, total) => setExportProgress({
        current,
        total
      }));
      toast({
        title: "✅ Exportación completada",
        description: `Se descargaron ${propertyData.fotos.length} fotos exitosamente`
      });
    } catch (error) {
      console.error("Error exportando fotos:", error);
      toast({
        title: "❌ Error en exportación",
        description: "Algunas fotos no se pudieron exportar. Revisa la consola.",
        variant: "destructive"
      });
    } finally {
      setIsExportingAllPhotos(false);
      setCurrentPhotoIndexOverride(undefined);
      setExportProgress({
        current: 0,
        total: 0
      });
    }
  };
  if (!selectedContentType) {
    return <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-6xl w-full animate-fade-in">
          <BrandedHeroSection aliadoConfig={aliadoConfig} />

          {/* Métricas */}
          <MetricsPanel onClearMetrics={handleClearMetrics} />

          {/* Sección 1: Promoción de Inmuebles */}
          <section className="mt-10">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">🎨 Promoción de Inmuebles</h2>
              <p className="text-muted-foreground text-lg">
                Crea contenido profesional para arriendo o venta de propiedades
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ContentTypeCard icon={Square} title="Post" description="1:1 para feed de Instagram y Facebook" primaryColor={aliadoConfig.colorPrimario} secondaryColor={aliadoConfig.colorSecundario} onClick={() => handleContentTypeSelect("post")} />
              <ContentTypeCard icon={Smartphone} title="Historia" description="9:16 para Stories de Instagram" primaryColor={aliadoConfig.colorPrimario} secondaryColor={aliadoConfig.colorSecundario} onClick={() => handleContentTypeSelect("historia")} />
              <ContentTypeCard icon={ImageIcon} title="Reel con Fotos" description="Slideshow automático con música" primaryColor={aliadoConfig.colorPrimario} secondaryColor={aliadoConfig.colorSecundario} onClick={() => handleContentTypeSelect("reel-fotos")} />
              <ContentTypeCard icon={Video} title="Reel con Video" description="Hasta 100 segundos de video" primaryColor={aliadoConfig.colorPrimario} secondaryColor={aliadoConfig.colorSecundario} onClick={() => handleContentTypeSelect("reel-video")} />
              <ContentTypeCard icon={Film} title="Reel Multi-Video" description="Concatena 2-10 videos en un solo reel profesional" primaryColor={aliadoConfig.colorPrimario} secondaryColor={aliadoConfig.colorSecundario} onClick={() => handleContentTypeSelect("reel-multi-video")} />
            </div>
          </section>

          {/* Sección 2: Generación de Confianza */}
          <section className="mt-12">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">💼 Generación de Confianza</h2>
              <p className="text-muted-foreground text-lg">
                Comparte tus éxitos para atraer nuevos propietarios y generar confianza
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ContentTypeCard icon={CheckCircle} title="Inmueble Arrendado" description="Celebra arriendos exitosos" primaryColor={aliadoConfig.colorPrimario} secondaryColor={aliadoConfig.colorSecundario} onClick={() => handleContentTypeSelect("arrendado")} />
              <ContentTypeCard icon={DollarSign} title="Inmueble Vendido" description="Celebra ventas exitosas" primaryColor={aliadoConfig.colorPrimario} secondaryColor={aliadoConfig.colorSecundario} onClick={() => handleContentTypeSelect("vendido")} />
            </div>
          </section>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-background py-4 md:py-6 px-2 md:px-4">
      {isDownloading && <LoadingState message="Generando tu publicación..." />}
      <MultiVideoProcessingModal isOpen={isProcessingMultiVideo} progress={multiVideoProgress} stage={multiVideoStage} isComplete={generatedMultiVideoBlob !== null} />

      <div className="w-full max-w-[1600px] 2xl:max-w-[1920px] mx-auto px-2 lg:px-4">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={handleBackToHub}>
            ← Volver al inicio
          </Button>
          <div className="flex gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 2 && <div className="space-y-6 animate-fade-in">
            {isArrendadoType ? <>
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-primary">
                    🎉 Datos de la Propiedad {selectedContentType === "arrendado" ? "Arrendada" : "Vendida"}
                  </h3>
                  <ArrendadoForm data={arrendadoData} updateField={(field, value) => setArrendadoData({
              ...arrendadoData,
              [field]: value
            })} errors={validationErrors} tipo={selectedContentType as "arrendado" | "vendido"} format={arrendadoFormat} />
                </Card>

                {/* Selector de formato */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 text-primary">📱 Elige el formato de tu publicación</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant={arrendadoFormat === "historia" ? "default" : "outline"} onClick={() => setArrendadoFormat("historia")} className="h-auto py-6 flex flex-col gap-3 hover:scale-105 transition-transform">
                      <Smartphone className="w-10 h-10" />
                      <div className="text-center">
                        <div className="font-bold text-base">Historia Estática</div>
                        <div className="text-xs opacity-70 mt-1">Imagen 9:16 para stories</div>
                      </div>
                    </Button>

                    <Button variant={arrendadoFormat === "reel-fotos" ? "default" : "outline"} onClick={() => setArrendadoFormat("reel-fotos")} className="h-auto py-6 flex flex-col gap-3 hover:scale-105 transition-transform">
                      <ImageIcon className="w-10 h-10" />
                      <div className="text-center">
                        <div className="font-bold text-base">Reel con Fotos</div>
                        <div className="text-xs opacity-70 mt-1">Slideshow GIF animado</div>
                      </div>
                    </Button>

                    <Button variant={arrendadoFormat === "reel-video" ? "default" : "outline"} onClick={() => setArrendadoFormat("reel-video")} className="h-auto py-6 flex flex-col gap-3 hover:scale-105 transition-transform">
                      <Video className="w-10 h-10" />
                      <div className="text-center">
                        <div className="font-bold text-base">Reel con Video</div>
                        <div className="text-xs opacity-70 mt-1">Video con overlays</div>
                      </div>
                    </Button>
                  </div>

                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {arrendadoFormat === "historia" && "📸 Generarás una imagen estática optimizada para historias de Instagram."}
                      {arrendadoFormat === "reel-fotos" && "🎬 Generarás un GIF animado con todas las fotos que subiste."}
                      {arrendadoFormat === "reel-video" && "🎥 Generarás un video con overlays celebratorios sobre tu video subido."}
                    </p>
                  </div>
                </Card>

                <PhotoManager photos={arrendadoFormat === "reel-video" ? arrendadoData.videoUrl ? [arrendadoData.videoUrl] : [] : arrendadoData.fotos || []} onPhotosChange={photos => {
            if (arrendadoFormat === "reel-video") {
              // Para reel-video, guardar en videoUrl
              setArrendadoData({
                ...arrendadoData,
                videoUrl: photos[0] || ""
              });
            } else {
              // Para historia/reel-fotos, guardar en fotos
              setArrendadoData({
                ...arrendadoData,
                fotos: photos
              });
            }
          }} contentType={arrendadoFormat === "reel-video" ? "reel-video" : arrendadoFormat === "reel-fotos" ? "reel-fotos" : "historia"} context="arrendado" />

                <Button onClick={handleGeneratePreview} className="w-full" variant="hero" size="lg" disabled={!arrendadoData.tipo || !arrendadoData.ubicacion || !arrendadoData.diasEnMercado || !arrendadoData.precio || (arrendadoFormat === "reel-video" ? !arrendadoData.videoUrl : arrendadoData.fotos?.length === 0)}>
                  Generar Publicación Celebratoria
                </Button>
              </> : selectedContentType === "reel-multi-video" ? <>
                <PropertyForm data={propertyData} onDataChange={setPropertyData} errors={validationErrors} />

                <MultiVideoManager videos={multiVideos} onVideosChange={setMultiVideos} maxVideos={10} maxTotalDuration={100} />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleGeneratePreview} className="w-full" variant="hero" size="lg" disabled={!propertyData.tipo || multiVideos.length < 2}>
                        Continuar a Vista Previa
                      </Button>
                    </TooltipTrigger>
                    {(!propertyData.tipo || multiVideos.length < 2) && <TooltipContent>
                        <p>Completa el formulario y sube al menos 2 videos</p>
                      </TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              </> : <>
                <PropertyForm data={propertyData} onDataChange={setPropertyData} errors={validationErrors} />

                <PhotoManager photos={propertyData.fotos || []} onPhotosChange={photos => setPropertyData({
            ...propertyData,
            fotos: photos
          })} contentType={selectedContentType!} subtitulos={propertyData.subtitulos || []} onSubtitulosChange={subtitulos => setPropertyData({
            ...propertyData,
            subtitulos
          })} />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleGeneratePreview} className="w-full" variant="hero" size="lg" disabled={!propertyData.tipo || propertyData.fotos?.length === 0}>
                        Generar Vista Previa
                      </Button>
                    </TooltipTrigger>
                    {(!propertyData.tipo || propertyData.fotos?.length === 0) && <TooltipContent>
                        <p>Completa el formulario y sube al menos una foto</p>
                      </TooltipContent>}
                  </Tooltip>
                </TooltipProvider>
              </>}
          </div>}

        {currentStep === 3 && <div className="space-y-6 animate-fade-in">
            {/* Vista previa según tipo de contenido */}
            {isArrendadoType && aliadoConfig ?
        // Vista previa para Arrendado/Vendido según formato
        <>
                {arrendadoFormat === "historia" && <>
                  {/* Layout móvil: vertical simple */}
                  <div className="lg:hidden space-y-6">
                    <Card className="p-6">
                      <h3 className="text-xl font-semibold mb-4 text-primary">🎉 Vista Previa Celebratoria</h3>
                      <ScrollArea className="max-h-[60vh]">
                        <div className="flex justify-center">
                          <ArrendadoPreview data={arrendadoData as ArrendadoData} aliadoConfig={aliadoConfig} tipo={selectedContentType as ArrendadoType} />
                        </div>
                      </ScrollArea>
                    </Card>

                    <Card className="p-6">
                      <Button onClick={handleDownloadImage} variant="hero" size="lg" className="w-full" disabled={isDownloading}>
                        {isDownloading ? <>
                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            Descargando...
                          </> : <>
                            <Download className="w-5 h-5 mr-2" />
                            Descargar Imagen
                          </>}
                      </Button>
                    </Card>
                  </div>

                  {/* Layout desktop: Grid con 3 scrolls independientes */}
                  <div className="hidden lg:grid lg:grid-cols-[1fr_540px] gap-6 h-[calc(100vh-180px)]">
                    {/* COLUMNA IZQUIERDA: Información/controles con scroll */}
                    <ScrollArea className="h-full pr-4">
                      <Card className="p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-primary">ℹ️ Información del Contenido</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <span className="text-muted-foreground">Tipo:</span>
                            <span className="font-semibold">{selectedContentType === "arrendado" ? "Arrendado" : "Vendido"}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <span className="text-muted-foreground">Formato:</span>
                            <span className="font-semibold">Historia (9:16)</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <span className="text-muted-foreground">Días en mercado:</span>
                            <span className="font-semibold">{arrendadoData.diasEnMercado} días</span>
                          </div>
                        </div>
                      </Card>
                    </ScrollArea>

                  {/* COLUMNA DERECHA: Preview section completa con scroll */}
                  <ScrollArea className="h-full min-h-0">
                    <Card className="p-6 flex flex-col">
                        <h3 className="text-xl font-semibold mb-4 text-primary">🎉 Vista Previa</h3>
                        
                        {/* Preview sin ScrollArea interno */}
                        <div className="flex justify-center mb-6">
                          <ArrendadoPreview data={arrendadoData as ArrendadoData} aliadoConfig={aliadoConfig} tipo={selectedContentType as ArrendadoType} />
                        </div>

                        {/* Botón: parte del mismo scroll */}
                        <div className="pt-4 border-t">
                          <Button onClick={handleDownloadImage} variant="hero" size="lg" className="w-full" disabled={isDownloading}>
                            {isDownloading ? <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                Descargando...
                              </> : <>
                                <Download className="w-5 h-5 mr-2" />
                                Descargar Imagen
                              </>}
                          </Button>
                        </div>
                      </Card>
                    </ScrollArea>
                  </div>
                </>}

                {arrendadoFormat === "reel-fotos" && <ArrendadoReelSlideshow data={arrendadoData as ArrendadoData} aliadoConfig={aliadoConfig} tipo={selectedContentType as ArrendadoType} onDownload={handleDownloadImage} />}

                {arrendadoFormat === "reel-video" && arrendadoData.videoUrl && <VideoReelRecorder videoUrl={arrendadoData.videoUrl} propertyData={arrendadoData as ArrendadoData} aliadoConfig={aliadoConfig} variant={selectedContentType as "arrendado" | "vendido"} onComplete={(blob, duration) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const ubicacion = arrendadoData.ubicacion?.toLowerCase().replace(/\s+/g, "-") || "inmueble";
            const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("webm") ? "webm" : "mp4";
            a.download = `reel-${selectedContentType}-${ubicacion}-${Date.now()}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast({
              title: "🎉 Video generado exitosamente",
              description: `Tu reel celebratorio se ha descargado correctamente. ${(blob.size / (1024 * 1024)).toFixed(1)} MB en ${Math.round(duration)}s`
            });
          }} />}
              </> : selectedContentType === "reel-multi-video" && aliadoConfig ?
        // Multi-video Reel - Paso 3: Preview y Generación
        <>
                {/* Layout móvil: vertical simple */}
                <div className="lg:hidden space-y-4">
                  {/* Info resumida de videos */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Video className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-sm">
                          {multiVideos.length} video{multiVideos.length !== 1 ? 's' : ''} • {Math.round(multiVideos.reduce((acc, v) => acc + v.duration, 0))}s total
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)} className="text-xs">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </Card>
                  
                  {/* Panel de personalización móvil */}
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-3 text-primary">🎨 Personalización</h3>
                    <MultiVideoControlsPanel gradientDirection={multiVideoGradientDirection} onGradientDirectionChange={setMultiVideoGradientDirection} gradientIntensity={multiVideoGradientIntensity} onGradientIntensityChange={setMultiVideoGradientIntensity} logoSettings={multiVideoLogoSettings} onLogoSettingsChange={setMultiVideoLogoSettings} textComposition={multiVideoTextComposition} onTextCompositionChange={setMultiVideoTextComposition} visualLayers={multiVideoVisualLayers} onVisualLayersChange={setMultiVideoVisualLayers} footerCustomization={multiVideoFooterCustomization} onFooterCustomizationChange={setMultiVideoFooterCustomization} />
                  </Card>
                  
                   {/* Preview/generación móvil */}
                  <Card className="p-4">
                    <h3 className="text-lg font-semibold mb-3 text-primary">🎬 Reel Multi-Video</h3>
                    <div className="space-y-3">
                      {multiVideos.length > 0 && propertyData && !generatedMultiVideoBlob && <MultiVideoStaticPreview key={`preview-mobile-${JSON.stringify({
                  pos: multiVideoLogoSettings.position,
                  size: multiVideoLogoSettings.size,
                  grad: multiVideoGradientDirection,
                  scale: multiVideoTextComposition.typographyScale
                })}`} videoFile={multiVideos[0].file!} propertyData={propertyData as PropertyData} aliadoConfig={aliadoConfig} visualSettings={{
                  logoSettings: multiVideoLogoSettings,
                  textComposition: multiVideoTextComposition,
                  visualLayers: multiVideoVisualLayers,
                  gradientDirection: multiVideoGradientDirection,
                  gradientIntensity: multiVideoGradientIntensity,
                  footerCustomization: multiVideoFooterCustomization
                }} subtitle={multiVideos[0].subtitle} />}

                      {isProcessingMultiVideo && <MultiVideoProcessingModal isOpen={isProcessingMultiVideo} progress={multiVideoProgress} stage={multiVideoStage} isComplete={false} />}

                      {!generatedMultiVideoBlob ? <>
                          {/* Caption generado - visible antes de generar video */}
                          {generatedCaption && <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="font-semibold text-xs">📝 Caption para tu publicación</Label>
                                <div className="flex gap-2">
                                  <Button onClick={handleCopyCaption} variant="outline" size="sm" disabled={!generatedCaption} className="text-xs h-8">
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copiar
                                  </Button>
                                  <Button onClick={handleRegenerateCaption} variant="outline" size="sm" disabled={!propertyData.tipo} className="text-xs h-8">
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Regenerar
                                  </Button>
                                </div>
                              </div>
                              <Textarea value={generatedCaption} onChange={e => setGeneratedCaption(e.target.value)} className="min-h-[160px] font-sans text-xs" placeholder="El caption se generará automáticamente cuando completes los datos de la propiedad..." />
                              <p className="text-[10px] text-muted-foreground">
                                ℹ️ Caption optimizado para redes sociales con hashtags locales
                              </p>
                            </div>}
                          
                          <Button onClick={async () => {
                    setIsProcessingMultiVideo(true);
                    setMultiVideoProgress(0);
                    setMultiVideoStage("Iniciando...");
                    try {
                      const videoBlobs = await Promise.all(multiVideos.map(v => fetch(v.url).then(r => r.blob())));
                      const subtitles = multiVideos.map(v => v.subtitle || "");
                      const resultBlob = await generateMultiVideoReel({
                        videoBlobs,
                        subtitles,
                        propertyData: propertyData as PropertyData,
                        aliadoConfig,
                        visualSettings: {
                          logoSettings: multiVideoLogoSettings,
                          textComposition: multiVideoTextComposition,
                          visualLayers: multiVideoVisualLayers,
                          gradientDirection: multiVideoGradientDirection,
                          gradientIntensity: multiVideoGradientIntensity
                        },
                        onProgress: (progress, stage) => {
                          setMultiVideoProgress(progress);
                          setMultiVideoStage(stage);
                        }
                      });
                      setGeneratedMultiVideoBlob(resultBlob);
                      setIsProcessingMultiVideo(false);
                      toast({
                        title: "✅ Reel multi-video generado",
                        description: `Tu video está listo. Tamaño: ${(resultBlob.size / (1024 * 1024)).toFixed(1)} MB`
                      });
                    } catch (error) {
                      console.error("Error generando multi-video:", error);
                      setIsProcessingMultiVideo(false);
                      toast({
                        title: "❌ Error al generar video",
                        description: "Intenta nuevamente o reduce la cantidad/duración de videos.",
                        variant: "destructive"
                      });
                    }
                  }} variant="hero" size="lg" className="w-full" disabled={isProcessingMultiVideo}>
                            {isProcessingMultiVideo ? <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                Procesando...
                              </> : <>
                                <Video className="w-5 h-5 mr-2" />
                                Generar Reel Multi-Video
                              </>}
                          </Button>
                        </> : <div className="space-y-3">
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-800 font-medium text-xs">✨ Tu reel multi-video está listo para descargar</p>
                          </div>
                          
                          {generatedMultiVideoBlob && <video src={URL.createObjectURL(generatedMultiVideoBlob)} controls className="w-full rounded-lg" />}
                          
                          <Button onClick={() => {
                    const url = URL.createObjectURL(generatedMultiVideoBlob);
                    const a = document.createElement("a");
                    a.href = url;
                    const tipo = propertyData.tipo || "inmueble";

                    // Detectar formato del blob y usar extensión correcta
                    const ext = generatedMultiVideoBlob.type.includes("webm") ? "webm" : "mp4";
                    a.download = `reel-multi-video-${tipo}-${Date.now()}.${ext}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    const formatNote = ext === "webm" ? " (Formato WebM, compatible con Chrome/Android)" : "";
                    toast({
                      title: "✅ Descarga completada",
                      description: `Tu reel multi-video se ha descargado correctamente.${formatNote}`
                    });
                  }} variant="hero" size="lg" className="w-full">
                            <Download className="w-5 h-5 mr-2" />
                            Descargar Video
                          </Button>

                          {/* Caption generado */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="font-semibold text-xs">📝 Caption para tu publicación</Label>
                              <div className="flex gap-2">
                                <Button onClick={handleCopyCaption} variant="outline" size="sm" disabled={!generatedCaption} className="text-xs h-8">
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copiar
                                </Button>
                                <Button onClick={handleRegenerateCaption} variant="outline" size="sm" disabled={!propertyData.tipo} className="text-xs h-8">
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  Regenerar
                                </Button>
                              </div>
                            </div>
                            <Textarea value={generatedCaption} onChange={e => setGeneratedCaption(e.target.value)} className="min-h-[160px] font-sans text-xs" placeholder="El caption se generará automáticamente cuando completes los datos de la propiedad..." />
                            <p className="text-[10px] text-muted-foreground">
                              ℹ️ Caption optimizado para redes sociales con hashtags locales
                            </p>
                          </div>
                        </div>}
                    </div>
                  </Card>
                </div>

          {/* Layout desktop: grid 2 columnas */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_540px] gap-6 h-[calc(100vh-180px)]">
            {/* COLUMNA IZQUIERDA: Controles con scroll independiente */}
            <ScrollArea className="h-full pr-4">
                    <div className="space-y-4 pb-6">
                      {/* Info resumida de videos */}
                      <Card className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Video className="w-5 h-5 text-primary" />
                            <span className="font-semibold">
                              {multiVideos.length} video{multiVideos.length !== 1 ? 's' : ''} • {Math.round(multiVideos.reduce((acc, v) => acc + v.duration, 0))}s total
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Editar videos
                          </Button>
                        </div>
                      </Card>
                      
                      <Card className="p-4">
                        <h3 className="text-lg font-semibold mb-3 text-primary">🎨 Personalización</h3>
                        <MultiVideoControlsPanel gradientDirection={multiVideoGradientDirection} onGradientDirectionChange={setMultiVideoGradientDirection} gradientIntensity={multiVideoGradientIntensity} onGradientIntensityChange={setMultiVideoGradientIntensity} logoSettings={multiVideoLogoSettings} onLogoSettingsChange={setMultiVideoLogoSettings} textComposition={multiVideoTextComposition} onTextCompositionChange={setMultiVideoTextComposition} visualLayers={multiVideoVisualLayers} onVisualLayersChange={setMultiVideoVisualLayers} footerCustomization={multiVideoFooterCustomization} onFooterCustomizationChange={setMultiVideoFooterCustomization} />
                      </Card>

                      {/* Caption */}
                      {generatedCaption && (
                        <Card className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold text-foreground">📝 Caption</Label>
                              <div className="flex gap-2">
                                <Button onClick={handleCopyCaption} variant="outline" size="sm">
                                  <Copy className="h-3 w-3" />
                                  Copiar
                                </Button>
                                <Button onClick={handleRegenerateCaption} variant="outline" size="sm">
                                  <RefreshCw className="h-3 w-3" />
                                  Regenerar
                                </Button>
                              </div>
                            </div>
                            <Textarea
                              value={generatedCaption}
                              onChange={(e) => setGeneratedCaption(e.target.value)}
                              className="min-h-[120px] text-sm resize-none"
                              placeholder="El caption se generará automáticamente..."
                            />
                          </div>
                        </Card>
                      )}

                      {/* Botón de generación/descarga */}
                      <Card className="p-4">
                        {!generatedMultiVideoBlob ? (
                          <Button
                            onClick={async () => {
                              setIsProcessingMultiVideo(true);
                              setMultiVideoProgress(0);
                              setMultiVideoStage("Iniciando...");
                              try {
                                const videoBlobs = await Promise.all(
                                  multiVideos.map((v) => fetch(v.url).then((r) => r.blob())),
                                );
                                const subtitles = multiVideos.map((v) => v.subtitle || "");
                                const resultBlob = await generateMultiVideoReel({
                                  videoBlobs,
                                  subtitles,
                                  propertyData: propertyData as PropertyData,
                                  aliadoConfig,
                                  visualSettings: {
                                    logoSettings: multiVideoLogoSettings,
                                    textComposition: multiVideoTextComposition,
                                    visualLayers: multiVideoVisualLayers,
                                    gradientDirection: multiVideoGradientDirection,
                                    gradientIntensity: multiVideoGradientIntensity,
                                    footerCustomization: multiVideoFooterCustomization,
                                  },
                                  onProgress: (progress, stage) => {
                                    setMultiVideoProgress(progress);
                                    setMultiVideoStage(stage);
                                  },
                                });
                                setGeneratedMultiVideoBlob(resultBlob);
                                setIsProcessingMultiVideo(false);
                                toast({
                                  title: "✅ Reel multi-video generado",
                                  description: `Tu video está listo. Tamaño: ${(resultBlob.size / (1024 * 1024)).toFixed(1)} MB`,
                                });
                              } catch (error) {
                                console.error("Error generando multi-video:", error);
                                setIsProcessingMultiVideo(false);
                                toast({
                                  title: "❌ Error al generar video",
                                  description:
                                    "Intenta nuevamente o reduce la cantidad/duración de videos.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            variant="hero"
                            size="lg"
                            className="w-full"
                            disabled={isProcessingMultiVideo || multiVideos.length === 0 || !propertyData}
                          >
                            {isProcessingMultiVideo ? (
                              <>
                                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                Procesando...
                              </>
                            ) : (
                              <>
                                <Video className="h-5 w-5 mr-2" />
                                Generar Reel Multi-Video
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => {
                              const url = URL.createObjectURL(generatedMultiVideoBlob);
                              const a = document.createElement("a");
                              a.href = url;
                              const tipo = propertyData.tipo || "inmueble";

                              const ext = generatedMultiVideoBlob.type.includes("webm") ? "webm" : "mp4";
                              a.download = `reel-multi-video-${tipo}-${Date.now()}.${ext}`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              const formatNote =
                                ext === "webm" ? " (Formato WebM, compatible con Chrome/Android)" : "";
                              toast({
                                title: "✅ Descarga completada",
                                description: `Tu reel multi-video se ha descargado correctamente.${formatNote}`,
                              });
                            }}
                            variant="hero"
                            size="lg"
                            className="w-full"
                          >
                            <Download className="h-5 w-5 mr-2" />
                            Descargar Video
                          </Button>
                        )}
                      </Card>
                    </div>
                  </ScrollArea>

              {/* COLUMNA DERECHA: Preview fijo */}
              {(() => {
                const totalDuration = multiVideos.reduce((sum, v) => sum + v.duration, 0);
                return (
                  <div className="h-full flex flex-col">
                    <Card className="p-6 flex-1 flex flex-col overflow-hidden">
                      {/* TÍTULO */}
                      <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <div>
                          <h3 className="text-xl font-semibold text-primary">
                            🎬 Reel Multi-Video
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {multiVideos.length} videos · {totalDuration}s total
                          </p>
                        </div>
                      </div>

                      {/* PREVIEW centrado sin scroll interno */}
                      <div className="flex-1 flex items-center justify-center min-h-0">
                        {multiVideos.length > 0 && propertyData && !generatedMultiVideoBlob && (
                          <MultiVideoStaticPreview
                            key={`preview-desktop-${JSON.stringify({
                              pos: multiVideoLogoSettings.position,
                              size: multiVideoLogoSettings.size,
                              grad: multiVideoGradientDirection,
                              scale: multiVideoTextComposition.typographyScale,
                            })}`}
                            videoFile={multiVideos[0].file!}
                            propertyData={propertyData as PropertyData}
                            aliadoConfig={aliadoConfig}
                            visualSettings={{
                              logoSettings: multiVideoLogoSettings,
                              textComposition: multiVideoTextComposition,
                              visualLayers: multiVideoVisualLayers,
                              gradientDirection: multiVideoGradientDirection,
                              gradientIntensity: multiVideoGradientIntensity,
                              footerCustomization: multiVideoFooterCustomization,
                            }}
                            subtitle={multiVideos[0].subtitle}
                          />
                        )}

                        {isProcessingMultiVideo && (
                          <MultiVideoProcessingModal
                            isOpen={isProcessingMultiVideo}
                            progress={multiVideoProgress}
                            stage={multiVideoStage}
                            isComplete={false}
                          />
                        )}

                        {generatedMultiVideoBlob && (
                          <video
                            src={URL.createObjectURL(generatedMultiVideoBlob)}
                            controls
                            className="w-full max-w-[360px] rounded-lg shadow-lg"
                            style={{ aspectRatio: "9/16" }}
                          />
                        )}
                      </div>
                    </Card>
                  </div>
                );
              })()}
                </div>
              </> : selectedContentType === "reel-fotos" && aliadoConfig ? <ReelSlideshow propertyData={propertyData as PropertyData} aliadoConfig={aliadoConfig} caption={generatedCaption} onCaptionChange={v => setGeneratedCaption(v)} onCopyCaption={handleCopyCaption} onRegenerateCaption={handleRegenerateCaption} /> : selectedContentType === "reel-video" && aliadoConfig && propertyData.fotos?.[0] ? <VideoReelRecorder videoUrl={propertyData.fotos[0]} propertyData={propertyData as PropertyData} aliadoConfig={aliadoConfig} onComplete={(blob, duration) => {
          toast({
            title: "✨ Video procesado en tiempo real",
            description: `${(blob.size / (1024 * 1024)).toFixed(1)} MB - Procesado en ${Math.round(duration)}s`
          });
        }} /> :
        // Post/Historia: Layout responsive con preview fijo
        <>
                {/* MÓVIL: Layout simple vertical */}
                <div className="lg:hidden space-y-6">
                  <Card className="p-6 space-y-6">
                    <h3 className="text-xl font-semibold mb-4 text-primary">Vista Previa</h3>
                    <div className="flex justify-center mb-6">
                      {aliadoConfig && <CanvasPreview propertyData={propertyData as PropertyData} aliadoConfig={aliadoConfig} contentType={selectedContentType!} template="residencial" currentPhotoIndexOverride={currentPhotoIndexOverride} logoSettings={postLogoSettings} textComposition={postTextComposition} visualLayers={postVisualLayers} gradientDirection={postGradientDirection} gradientIntensity={postGradientIntensity} firstPhotoConfig={postFirstPhotoConfig} />}
                    </div>
                    <div className="space-y-3">
                      <Button onClick={handleDownloadImage} variant="hero" size="lg" className="w-full" disabled={isDownloading || isExportingAllPhotos}>
                        {isDownloading ? <>
                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            Descargando...
                          </> : <>
                            <Download className="w-5 h-5 mr-2" />
                            Descargar Foto Actual
                          </>}
                      </Button>

                      {propertyData.fotos && propertyData.fotos.length > 1 && <Button onClick={handleExportAllPhotos} variant="outline" size="lg" className="w-full" disabled={isDownloading || isExportingAllPhotos}>
                          {isExportingAllPhotos ? <>
                              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                              Exportando {exportProgress.current}/{exportProgress.total}
                            </> : <>
                              <Images className="w-5 h-5 mr-2" />
                              Exportar Todas las Fotos ({propertyData.fotos.length})
                            </>}
                        </Button>}
                    </div>
                  </Card>

                  <PostControlsPanel logoSettings={postLogoSettings} onLogoSettingsChange={setPostLogoSettings} textComposition={postTextComposition} onTextCompositionChange={setPostTextComposition} visualLayers={postVisualLayers} onVisualLayersChange={setPostVisualLayers} gradientDirection={postGradientDirection} onGradientDirectionChange={setPostGradientDirection} gradientIntensity={postGradientIntensity} onGradientIntensityChange={setPostGradientIntensity} firstPhotoConfig={postFirstPhotoConfig} onFirstPhotoConfigChange={setPostFirstPhotoConfig} />
                </div>

                {/* DESKTOP: Grid con ScrollArea en controles + preview fijo */}
                <div className="hidden lg:grid lg:grid-cols-[1fr_540px] gap-6 h-[calc(100vh-180px)]">
                  {/* COLUMNA IZQUIERDA: Controles con scroll independiente */}
                  <ScrollArea className="h-full pr-4">
                    <div className="space-y-4 pb-6">
                      <PostControlsPanel logoSettings={postLogoSettings} onLogoSettingsChange={setPostLogoSettings} textComposition={postTextComposition} onTextCompositionChange={setPostTextComposition} visualLayers={postVisualLayers} onVisualLayersChange={setPostVisualLayers} gradientDirection={postGradientDirection} onGradientDirectionChange={setPostGradientDirection} gradientIntensity={postGradientIntensity} onGradientIntensityChange={setPostGradientIntensity} firstPhotoConfig={postFirstPhotoConfig} onFirstPhotoConfigChange={setPostFirstPhotoConfig} />
                    </div>
                  </ScrollArea>

                  {/* COLUMNA DERECHA: Preview FIJO (sin scroll, siempre visible) */}
                  <div className="h-full flex flex-col">
                    <Card className="p-6 flex-1 flex flex-col overflow-hidden">
                      <h3 className="text-xl font-semibold mb-4 text-primary flex-shrink-0">Vista Previa</h3>

                      <div className="flex-1 flex items-center justify-center mb-6 min-h-0">
                        {aliadoConfig && (
                          <div
                            id="canvas-preview"
                            className="relative overflow-hidden rounded-2xl"
                            style={{
                              width: "100%",
                              aspectRatio: selectedContentType === "post" ? "1 / 1" : "9 / 16",
                              maxWidth: "600px",
                              margin: "0 auto"
                            }}
                          >
                            <CanvasPreview 
                              propertyData={propertyData as PropertyData} 
                              aliadoConfig={aliadoConfig} 
                              contentType={selectedContentType!} 
                              template="residencial" 
                              currentPhotoIndexOverride={currentPhotoIndexOverride} 
                              logoSettings={postLogoSettings} 
                              textComposition={postTextComposition} 
                              visualLayers={postVisualLayers} 
                              gradientDirection={postGradientDirection} 
                              gradientIntensity={postGradientIntensity} 
                              firstPhotoConfig={postFirstPhotoConfig} 
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 flex-shrink-0">
                        <Button onClick={handleDownloadImage} variant="hero" size="lg" className="w-full" disabled={isDownloading || isExportingAllPhotos}>
                          {isDownloading ? <>
                              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                              Descargando...
                            </> : <>
                              <Download className="w-5 h-5 mr-2" />
                              Descargar Foto Actual
                            </>}
                        </Button>

                        {propertyData.fotos && propertyData.fotos.length > 1 && <Button onClick={handleExportAllPhotos} variant="outline" size="lg" className="w-full" disabled={isDownloading || isExportingAllPhotos}>
                            {isExportingAllPhotos ? <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                Exportando {exportProgress.current}/{exportProgress.total}
                              </> : <>
                                <Images className="w-5 h-5 mr-2" />
                                Exportar Todas las Fotos ({propertyData.fotos.length})
                              </>}
                           </Button>}
               </div>
            </Card>
          </div>
        </div>

        </>}
          </div>}
      </div>
    </div>;
};
export default Index;