import { useState, useEffect } from "react";
import { Square, Smartphone, Image as ImageIcon, Video, Film, Download, RefreshCw, CheckCircle, DollarSign } from "lucide-react";
import { ContentTypeCard } from "@/components/ContentTypeCard";
import { BrandedHeroSection } from "@/components/BrandedHeroSection";
import { PropertyForm } from "@/components/PropertyForm";
import { ArrendadoForm } from "@/components/ArrendadoForm";
import { PhotoManager } from "@/components/PhotoManager";
import { CanvasPreview } from "@/components/CanvasPreview";
import { ArrendadoPreview } from "@/components/ArrendadoPreview";
import { ReelSlideshow } from "@/components/ReelSlideshow";
import { ArrendadoReelSlideshow } from "@/components/ArrendadoReelSlideshow";
import { VideoReelRecorder } from "@/components/VideoReelRecorder";
import { MultiVideoManager } from "@/components/MultiVideoManager";
import { MultiVideoProcessingModal } from "@/components/MultiVideoProcessingModal";
import { MetricsPanel } from "@/components/MetricsPanel";
import { ExportOptions } from "@/components/ExportOptions";
import { LoadingState } from "@/components/LoadingState";
import { AliadoConfig, PropertyData, ContentType } from "@/types/property";
import { ArrendadoData, ArrendadoType } from "@/types/arrendado";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateCaption, regenerateCaption, generateArrendadoCaption } from "@/utils/captionGenerator";
import { exportToImage, exportVideo, ExportOptions as ExportOptionsType } from "@/utils/imageExporter";
import { validatePropertyData, validateArrendadoData } from "@/utils/formValidation";
import { savePublicationMetric, clearMetrics } from "@/utils/metricsManager";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useToast } from "@/hooks/use-toast";
import { ALIADO_CONFIG } from "@/config/aliadoConfig";
import { generateMultiVideoReel } from "@/utils/multiVideoGenerator";

interface VideoInfo {
  id: string;
  url: string;
  file: File;
  duration: number;
  subtitle?: string;
}

const Index = () => {
  const { toast } = useToast();
  const [aliadoConfig, setAliadoConfig] = useState<AliadoConfig>(ALIADO_CONFIG);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [propertyData, setPropertyData] = useState<Partial<PropertyData>>({ fotos: [], subtitulos: [] });
  const [arrendadoData, setArrendadoData] = useState<Partial<ArrendadoData>>({
    fotos: [],
    precio: "",
    videoUrl: "",
  });
  const [arrendadoFormat, setArrendadoFormat] = useState<"historia" | "reel-fotos" | "reel-video">("historia");
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [exportOptions, setExportOptions] = useState<ExportOptionsType>({ 
    format: "png", 
    quality: 0.95 
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [multiVideos, setMultiVideos] = useState<VideoInfo[]>([]);
  const [isProcessingMultiVideo, setIsProcessingMultiVideo] = useState(false);
  const [multiVideoProgress, setMultiVideoProgress] = useState(0);
  const [multiVideoStage, setMultiVideoStage] = useState("");
  const [generatedMultiVideoBlob, setGeneratedMultiVideoBlob] = useState<Blob | null>(null);
  
  const { loadAutoSavedData, clearAutoSavedData } = useAutoSave(propertyData, currentStep === 2);

  const isArrendadoType = selectedContentType === "arrendado" || selectedContentType === "vendido";

  useEffect(() => {
    // Cargar datos autoguardados si existen
    try {
      const saved = localStorage.getItem("property-form-autosave");
      const autoSaved = saved ? JSON.parse(saved) : null;
      if (autoSaved && autoSaved.tipo) {
        toast({
          title: "📝 Borrador recuperado",
          description: "Se ha restaurado tu última sesión.",
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
    setPropertyData({ fotos: [], subtitulos: [] });
    setArrendadoData({ fotos: [] });
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
          variant: "destructive",
        });
        return;
      }

      const totalDuration = multiVideos.reduce((sum, v) => sum + v.duration, 0);
      if (totalDuration > 100) {
        toast({
          title: "⚠️ Duración excedida",
          description: "La duración total no puede superar 100 segundos.",
          variant: "destructive",
        });
        return;
      }

      if (!propertyData.tipo) {
        toast({
          title: "⚠️ Completa el formulario",
          description: "Selecciona el tipo de inmueble antes de continuar.",
          variant: "destructive",
        });
        return;
      }

      setCurrentStep(3);
      toast({
        title: "✅ Multi-video listo",
        description: "Ahora puedes generar y descargar tu reel.",
      });
      return;
    }

    // Flujo para Arrendado/Vendido
    if (isArrendadoType) {
      if (!arrendadoData.tipo || !arrendadoData.ubicacion || !arrendadoData.diasEnMercado) {
        toast({
          title: "⚠️ Completa el formulario",
          description: "Todos los campos son requeridos.",
          variant: "destructive",
        });
        return;
      }

      // Validación específica para reel-video
      if (arrendadoFormat === "reel-video" && !arrendadoData.videoUrl) {
        toast({
          title: "⚠️ Falta video",
          description: "Sube un video para generar el reel con video.",
          variant: "destructive",
        });
        return;
      }

      // Validación para reel-fotos
      if (arrendadoFormat === "reel-fotos" && (!arrendadoData.fotos || arrendadoData.fotos.length < 2)) {
        toast({
          title: "⚠️ Faltan fotos",
          description: "Sube al menos 2 fotos para generar el slideshow.",
          variant: "destructive",
        });
        return;
      }

      // Validación para historia (al menos 1 foto)
      if (arrendadoFormat === "historia" && (!arrendadoData.fotos || arrendadoData.fotos.length === 0)) {
        toast({
          title: "⚠️ Sube al menos una foto",
          description: "Se requiere al menos 1 imagen.",
          variant: "destructive",
        });
        return;
      }

      const caption = generateArrendadoCaption(
        arrendadoData as ArrendadoData,
        aliadoConfig,
        selectedContentType as ArrendadoType
      );
      setGeneratedCaption(caption);
      setCurrentStep(3);
      
      savePublicationMetric(arrendadoData.tipo!, selectedContentType!, "celebratorio");
      
      toast({
        title: "🎉 ¡Publicación celebratoria lista!",
        description: "Comparte tu éxito en redes sociales.",
      });
      return;
    }

    // Flujo normal para propiedades disponibles
    if (!propertyData.tipo) {
      toast({
        title: "⚠️ Selecciona un tipo de inmueble",
        description: "Completa el formulario antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    const validation = validatePropertyData(propertyData, propertyData.tipo);
    
    if (!validation.success) {
      setValidationErrors(validation.errors);
      toast({
        title: "❌ Errores en el formulario",
        description: "Por favor corrige los campos marcados en rojo.",
        variant: "destructive",
      });
      return;
    }
    
    setValidationErrors({});
    
    if (aliadoConfig && propertyData.tipo) {
      const caption = generateCaption(
        propertyData as PropertyData, 
        aliadoConfig, 
        "residencial",
        true
      );
      setGeneratedCaption(caption);
      setCurrentStep(3);
      
      savePublicationMetric(propertyData.tipo, selectedContentType!, "residencial");
      
      toast({
        title: "✨ Tu publicación está lista",
        description: "Revisa el caption y descarga tu imagen.",
      });
    }
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(generatedCaption);
    toast({
      title: "📋 Caption copiado",
      description: "El texto está listo para pegar en tus redes sociales.",
    });
  };

  const handleClearMetrics = () => {
    clearMetrics();
    toast({
      title: "🗑️ Estadísticas limpiadas",
      description: "Se han eliminado todas las métricas guardadas.",
    });
  };

  const handleRegenerateCaption = () => {
    if (aliadoConfig && propertyData.tipo) {
      const newCaption = regenerateCaption(
        propertyData as PropertyData,
        aliadoConfig,
        "residencial"
      );
      setGeneratedCaption(newCaption);
      toast({
        title: "✨ Caption regenerado",
        description: "Se ha creado una versión alternativa.",
      });
    }
  };

  const handleDownloadImage = async () => {
    setIsDownloading(true);
    
    toast({
      title: "🎨 Generando imagen...",
      description: "Esto tomará unos segundos",
    });
    
    try {
      if (selectedContentType === "reel-video" && propertyData.fotos && propertyData.fotos[0]) {
        await exportVideo(propertyData.fotos[0], `reel-${propertyData.tipo}-${Date.now()}.mp4`);
        toast({
          title: "✅ Video descargado",
          description: "Edita el video con tu app favorita agregando los textos.",
        });
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const tipo = isArrendadoType ? arrendadoData.tipo : propertyData.tipo;
      const filename = `publicacion-${tipo}-${Date.now()}.${exportOptions.format}`;
      await exportToImage("canvas-preview", filename, exportOptions);
      toast({
        title: "✅ Descarga lista",
        description: "Tu publicación se ha guardado correctamente.",
      });
    } catch (error) {
      console.error("Error al descargar:", error);
      toast({
        title: "❌ Error al descargar",
        description: "Intenta nuevamente o contacta soporte.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (!selectedContentType) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="max-w-6xl w-full animate-fade-in">
          <BrandedHeroSection aliadoConfig={aliadoConfig} />

          {/* Métricas */}
          <MetricsPanel onClearMetrics={handleClearMetrics} />

          {/* Sección 1: Promoción de inmuebles disponibles */}
          <section className="mt-10">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">📱 Promociona Inmuebles Disponibles</h2>
              <p className="text-muted-foreground text-lg">
                Crea contenido profesional para arriendo o venta de propiedades
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ContentTypeCard
                icon={Square}
                title="Post Cuadrado"
                description="1:1 para feed de Instagram y Facebook"
                primaryColor={aliadoConfig.colorPrimario}
                secondaryColor={aliadoConfig.colorSecundario}
                onClick={() => handleContentTypeSelect("post")}
              />
              <ContentTypeCard
                icon={Smartphone}
                title="Historia"
                description="9:16 para Stories de Instagram"
                primaryColor={aliadoConfig.colorPrimario}
                secondaryColor={aliadoConfig.colorSecundario}
                onClick={() => handleContentTypeSelect("historia")}
              />
              <ContentTypeCard
                icon={ImageIcon}
                title="Reel con Fotos"
                description="Slideshow automático con música"
                primaryColor={aliadoConfig.colorPrimario}
                secondaryColor={aliadoConfig.colorSecundario}
                onClick={() => handleContentTypeSelect("reel-fotos")}
              />
              <ContentTypeCard
                icon={Video}
                title="Reel con Video"
                description="Hasta 100 segundos de video"
                primaryColor={aliadoConfig.colorPrimario}
                secondaryColor={aliadoConfig.colorSecundario}
                onClick={() => handleContentTypeSelect("reel-video")}
              />
              <ContentTypeCard
                icon={Film}
                title="Reel Multi-Video"
                description="Concatena 2-10 videos en un solo reel profesional"
                primaryColor={aliadoConfig.colorPrimario}
                secondaryColor={aliadoConfig.colorSecundario}
                onClick={() => handleContentTypeSelect("reel-multi-video")}
              />
            </div>
          </section>

          {/* Sección 2: Publicaciones de éxito */}
          <section className="mt-12">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">🎉 Celebra Arriendos y Ventas</h2>
              <p className="text-muted-foreground text-lg">
                Comparte tus éxitos para atraer nuevos propietarios y generar confianza
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ContentTypeCard
                icon={CheckCircle}
                title="Inmueble Arrendado"
                description="Celebra arriendos exitosos"
                primaryColor="#10B981"
                secondaryColor="#059669"
                onClick={() => handleContentTypeSelect("arrendado")}
              />
              <ContentTypeCard
                icon={DollarSign}
                title="Inmueble Vendido"
                description="Celebra ventas exitosas"
                primaryColor="#3B82F6"
                secondaryColor="#2563EB"
                onClick={() => handleContentTypeSelect("vendido")}
              />
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {isDownloading && <LoadingState message="Generando tu publicación..." />}
      <MultiVideoProcessingModal
        isOpen={isProcessingMultiVideo}
        progress={multiVideoProgress}
        stage={multiVideoStage}
        isComplete={generatedMultiVideoBlob !== null}
      />
      
      <div className="max-w-4xl mx-auto">
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

        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            {isArrendadoType ? (
              <>
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-primary">
                    🎉 Datos de la Propiedad {selectedContentType === "arrendado" ? "Arrendada" : "Vendida"}
                  </h3>
                  <ArrendadoForm
                    data={arrendadoData}
                    updateField={(field, value) => setArrendadoData({ ...arrendadoData, [field]: value })}
                    errors={validationErrors}
                    tipo={selectedContentType as "arrendado" | "vendido"}
                    format={arrendadoFormat}
                  />
                </Card>

                {/* Selector de formato */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 text-primary">
                    📱 Elige el formato de tu publicación
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      variant={arrendadoFormat === "historia" ? "default" : "outline"}
                      onClick={() => setArrendadoFormat("historia")}
                      className="h-auto py-6 flex flex-col gap-3 hover:scale-105 transition-transform"
                    >
                      <Smartphone className="w-10 h-10" />
                      <div className="text-center">
                        <div className="font-bold text-base">Historia Estática</div>
                        <div className="text-xs opacity-70 mt-1">Imagen 9:16 para stories</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant={arrendadoFormat === "reel-fotos" ? "default" : "outline"}
                      onClick={() => setArrendadoFormat("reel-fotos")}
                      className="h-auto py-6 flex flex-col gap-3 hover:scale-105 transition-transform"
                    >
                      <ImageIcon className="w-10 h-10" />
                      <div className="text-center">
                        <div className="font-bold text-base">Reel con Fotos</div>
                        <div className="text-xs opacity-70 mt-1">Slideshow GIF animado</div>
                      </div>
                    </Button>
                    
                    <Button
                      variant={arrendadoFormat === "reel-video" ? "default" : "outline"}
                      onClick={() => setArrendadoFormat("reel-video")}
                      className="h-auto py-6 flex flex-col gap-3 hover:scale-105 transition-transform"
                    >
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

                <PhotoManager
                  photos={
                    arrendadoFormat === "reel-video" 
                      ? (arrendadoData.videoUrl ? [arrendadoData.videoUrl] : [])
                      : (arrendadoData.fotos || [])
                  }
                  onPhotosChange={(photos) => {
                    if (arrendadoFormat === "reel-video") {
                      // Para reel-video, guardar en videoUrl
                      setArrendadoData({ ...arrendadoData, videoUrl: photos[0] || "" });
                    } else {
                      // Para historia/reel-fotos, guardar en fotos
                      setArrendadoData({ ...arrendadoData, fotos: photos });
                    }
                  }}
                  contentType={
                    arrendadoFormat === "reel-video" ? "reel-video" :
                    arrendadoFormat === "reel-fotos" ? "reel-fotos" : "historia"
                  }
                  context="arrendado"
                />

                <Button
                  onClick={handleGeneratePreview}
                  className="w-full"
                  variant="hero"
                  size="lg"
                  disabled={
                    !arrendadoData.tipo || 
                    !arrendadoData.ubicacion || 
                    !arrendadoData.diasEnMercado ||
                    !arrendadoData.precio ||
                    (arrendadoFormat === "reel-video" ? !arrendadoData.videoUrl : arrendadoData.fotos?.length === 0)
                  }
                >
                  Generar Publicación Celebratoria
                </Button>
              </>
            ) : selectedContentType === "reel-multi-video" ? (
              <>
                <PropertyForm 
                  data={propertyData} 
                  onDataChange={setPropertyData}
                  errors={validationErrors}
                />

                <MultiVideoManager
                  videos={multiVideos}
                  onVideosChange={setMultiVideos}
                  maxVideos={10}
                  maxTotalDuration={100}
                />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleGeneratePreview}
                        className="w-full"
                        variant="hero"
                        size="lg"
                        disabled={!propertyData.tipo || multiVideos.length < 2}
                      >
                        Continuar a Vista Previa
                      </Button>
                    </TooltipTrigger>
                    {(!propertyData.tipo || multiVideos.length < 2) && (
                      <TooltipContent>
                        <p>Completa el formulario y sube al menos 2 videos</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </>
            ) : (
              <>
                <PropertyForm 
                  data={propertyData} 
                  onDataChange={setPropertyData}
                  errors={validationErrors}
                />

                <PhotoManager
                  photos={propertyData.fotos || []}
                  onPhotosChange={(photos) => setPropertyData({ ...propertyData, fotos: photos })}
                  contentType={selectedContentType!}
                  subtitulos={propertyData.subtitulos || []}
                  onSubtitulosChange={(subtitulos) => setPropertyData({ ...propertyData, subtitulos })}
                />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleGeneratePreview}
                        className="w-full"
                        variant="hero"
                        size="lg"
                        disabled={!propertyData.tipo || propertyData.fotos?.length === 0}
                      >
                        Generar Vista Previa
                      </Button>
                    </TooltipTrigger>
                    {(!propertyData.tipo || propertyData.fotos?.length === 0) && (
                      <TooltipContent>
                        <p>Completa el formulario y sube al menos una foto</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            {/* Export Options - Solo para imágenes estáticas */}
            {(selectedContentType === "post" || selectedContentType === "historia") && aliadoConfig && (
              <ExportOptions
                onOptionsChange={setExportOptions}
                aliadoNombre={aliadoConfig.nombre}
              />
            )}

            {/* Vista previa según tipo de contenido */}
            {isArrendadoType && aliadoConfig ? (
              // Vista previa para Arrendado/Vendido según formato
              <>
                {arrendadoFormat === "historia" && (
                  <Card className="p-6">
                    <h3 className="text-xl font-semibold mb-4 text-primary">
                      🎉 Vista Previa Celebratoria
                    </h3>
                    <div className="flex justify-center mb-6">
                      <ArrendadoPreview
                        data={arrendadoData as ArrendadoData}
                        aliadoConfig={aliadoConfig}
                        tipo={selectedContentType as ArrendadoType}
                      />
                    </div>
                    <Button 
                      onClick={handleDownloadImage} 
                      variant="hero" 
                      size="lg"
                      className="w-full"
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Descargando...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5 mr-2" />
                          Descargar Imagen ({exportOptions.format.toUpperCase()})
                        </>
                      )}
                    </Button>
                  </Card>
                )}

                {arrendadoFormat === "reel-fotos" && (
                  <ArrendadoReelSlideshow
                    data={arrendadoData as ArrendadoData}
                    aliadoConfig={aliadoConfig}
                    tipo={selectedContentType as ArrendadoType}
                    onDownload={handleDownloadImage}
                  />
                )}

                {arrendadoFormat === "reel-video" && arrendadoData.videoUrl && (
                  <VideoReelRecorder
                    videoUrl={arrendadoData.videoUrl}
                    propertyData={arrendadoData as ArrendadoData}
                    aliadoConfig={aliadoConfig}
                    variant={selectedContentType as "arrendado" | "vendido"}
                    onComplete={(blob, duration) => {
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      const ubicacion = arrendadoData.ubicacion?.toLowerCase().replace(/\s+/g, '-') || 'inmueble';
                      a.download = `reel-${selectedContentType}-${ubicacion}-${Date.now()}.webm`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      toast({
                        title: "🎉 Video generado exitosamente",
                        description: `Tu reel celebratorio se ha descargado correctamente. ${(blob.size / (1024 * 1024)).toFixed(1)} MB en ${Math.round(duration)}s`,
                      });
                    }}
                  />
                )}
              </>
            ) : selectedContentType === "reel-multi-video" && aliadoConfig ? (
              // Multi-video Reel
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-primary">
                  🎬 Reel Multi-Video
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-accent rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>{multiVideos.length} videos</strong> listos para concatenar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Duración total: {Math.round(multiVideos.reduce((sum, v) => sum + v.duration, 0))} segundos
                    </p>
                  </div>

                  {!generatedMultiVideoBlob ? (
                    <Button
                      onClick={async () => {
                        setIsProcessingMultiVideo(true);
                        setMultiVideoProgress(0);
                        setMultiVideoStage("Iniciando...");

                        try {
                          const videoBlobs = await Promise.all(
                            multiVideos.map(v => fetch(v.url).then(r => r.blob()))
                          );

                          const subtitles = multiVideos.map(v => v.subtitle || "");

                          const resultBlob = await generateMultiVideoReel({
                            videoBlobs,
                            subtitles,
                            propertyData: propertyData as PropertyData,
                            aliadoConfig,
                            onProgress: (progress, stage) => {
                              setMultiVideoProgress(progress);
                              setMultiVideoStage(stage);
                            },
                          });

                          setGeneratedMultiVideoBlob(resultBlob);
                          setIsProcessingMultiVideo(false);

                          // Generar caption automáticamente
                          if (!generatedCaption) {
                            const caption = generateCaption(
                              propertyData as PropertyData, 
                              aliadoConfig, 
                              "residencial",
                              true
                            );
                            setGeneratedCaption(caption);
                          }

                          toast({
                            title: "✅ Reel multi-video generado",
                            description: `Tu video está listo. Tamaño: ${(resultBlob.size / (1024 * 1024)).toFixed(1)} MB`,
                          });
                        } catch (error) {
                          console.error("Error generando multi-video:", error);
                          setIsProcessingMultiVideo(false);
                          toast({
                            title: "❌ Error al generar video",
                            description: "Intenta nuevamente o reduce la cantidad/duración de videos.",
                            variant: "destructive",
                          });
                        }
                      }}
                      variant="hero"
                      size="lg"
                      className="w-full"
                      disabled={isProcessingMultiVideo}
                    >
                      {isProcessingMultiVideo ? (
                        <>
                          <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Video className="w-5 h-5 mr-2" />
                          Generar Reel Multi-Video
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-medium">
                          ✨ Tu reel multi-video está listo para descargar
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          const url = URL.createObjectURL(generatedMultiVideoBlob);
                          const a = document.createElement("a");
                          a.href = url;
                          const tipo = propertyData.tipo || 'inmueble';
                          
                          // Detectar formato del blob y usar extensión correcta
                          const ext = generatedMultiVideoBlob.type.includes('webm') ? 'webm' : 'mp4';
                          a.download = `reel-multi-video-${tipo}-${Date.now()}.${ext}`;
                          
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);

                          const formatNote = ext === 'webm' ? ' (Formato WebM, compatible con Chrome/Android)' : '';
                          toast({
                            title: "✅ Descarga completada",
                            description: `Tu reel multi-video se ha descargado correctamente.${formatNote}`,
                          });
                        }}
                        variant="hero"
                        size="lg"
                        className="w-full"
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Descargar Video
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ) : selectedContentType === "reel-fotos" && aliadoConfig ? (
              // Reel animado: ReelSlideshow con botón de descarga integrado
              <ReelSlideshow
                propertyData={propertyData as PropertyData}
                aliadoConfig={aliadoConfig}
              />
            ) : selectedContentType === "reel-video" && aliadoConfig && propertyData.fotos?.[0] ? (
              <VideoReelRecorder
                videoUrl={propertyData.fotos[0]}
                propertyData={propertyData as PropertyData}
                aliadoConfig={aliadoConfig}
                onComplete={(blob, duration) => {
                  toast({
                    title: "✨ Video procesado en tiempo real",
                    description: `${(blob.size / (1024 * 1024)).toFixed(1)} MB - Procesado en ${Math.round(duration)}s`,
                  });
                }}
              />
            ) : (
              // Post/Historia: imagen estática con opciones de exportación
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 text-primary">Vista Previa</h3>
                <div className="flex justify-center mb-6">
                  {aliadoConfig && (
                    <CanvasPreview
                      propertyData={propertyData as PropertyData}
                      aliadoConfig={aliadoConfig}
                      contentType={selectedContentType!}
                      template="residencial"
                    />
                  )}
                </div>
                <Button 
                  onClick={handleDownloadImage} 
                  variant="hero" 
                  size="lg"
                  className="w-full"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Descargando...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Descargar Imagen ({exportOptions.format.toUpperCase()})
                    </>
                  )}
                </Button>
              </Card>
            )}

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-primary">Caption Generado</h3>
              <div className="space-y-2 mb-4">
                <Textarea
                  value={generatedCaption}
                  onChange={(e) => setGeneratedCaption(e.target.value)}
                  className="min-h-[150px] font-mono text-sm"
                  placeholder="Tu caption aparecerá aquí..."
                />
                <p className="text-xs text-muted-foreground">
                  {generatedCaption.length} caracteres
                </p>
              </div>
              <div className="flex gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button onClick={handleCopyCaption} variant="secondary" className="flex-1">
                        📋 Copiar Caption
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copia el texto para pegar en Instagram o Facebook</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={handleRegenerateCaption}
                        variant="outline"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Genera una versión alternativa del caption</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Button 
                  onClick={handleBackToHub}
                  variant="outline"
                  className="flex-1"
                >
                  🎉 Crear Otra
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
