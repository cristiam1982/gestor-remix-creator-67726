import { useState, useEffect } from "react";
import { Square, Smartphone, Image as ImageIcon, Video, Download, RefreshCw } from "lucide-react";
import { ContentTypeCard } from "@/components/ContentTypeCard";
import { AliadoConfigForm } from "@/components/AliadoConfigForm";
import { PropertyForm } from "@/components/PropertyForm";
import { PhotoManager } from "@/components/PhotoManager";
import { CanvasPreview } from "@/components/CanvasPreview";
import { SocialMockup } from "@/components/SocialMockup";
import { ReelSlideshow } from "@/components/ReelSlideshow";
import { VideoPreview } from "@/components/VideoPreview";
import { TemplateSelector } from "@/components/TemplateSelector";
import { MetricsPanel } from "@/components/MetricsPanel";
import { ExportOptions } from "@/components/ExportOptions";
import { LoadingState } from "@/components/LoadingState";
import { AliadoConfig, PropertyData, ContentType } from "@/types/property";
import { TemplateTheme } from "@/types/templates";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { generateCaption, regenerateCaption } from "@/utils/captionGenerator";
import { exportToImage, exportVideo, ExportOptions as ExportOptionsType } from "@/utils/imageExporter";
import { validatePropertyData } from "@/utils/formValidation";
import { savePublicationMetric, clearMetrics } from "@/utils/metricsManager";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useRemixConfig } from "@/hooks/useRemixConfig";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { toast } = useToast();
  const { remixConfig, isRemixLocked, lockRemix } = useRemixConfig();
  const [aliadoConfig, setAliadoConfig] = useState<AliadoConfig | null>(null);
  const [showConfig, setShowConfig] = useState(true);
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null);
  const [propertyData, setPropertyData] = useState<Partial<PropertyData>>({ fotos: [] });
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedCaption, setGeneratedCaption] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateTheme>("residencial");
  const [exportOptions, setExportOptions] = useState<ExportOptionsType>({ 
    format: "png", 
    quality: 0.95 
  });
  const [isDownloading, setIsDownloading] = useState(false);
  
  const { loadAutoSavedData, clearAutoSavedData } = useAutoSave(propertyData, currentStep === 2);

  useEffect(() => {
    // Check for remix config first
    if (remixConfig && !isRemixLocked) {
      setAliadoConfig(remixConfig);
      setShowConfig(false);
      toast({
        title: "🎨 Configuración de Remix cargada",
        description: `Bienvenido, ${remixConfig.nombre}`,
      });
      return;
    }

    const savedConfig = localStorage.getItem("aliado-config");
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setAliadoConfig(config);
      setShowConfig(false);
    }

    // Cargar datos autoguardados si existen (solo una vez al montar)
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
  }, [remixConfig, isRemixLocked]);

  const handleConfigSave = (config: AliadoConfig) => {
    setAliadoConfig(config);
    setShowConfig(false);
    
    // Lock remix after first save
    if (remixConfig) {
      lockRemix();
    }
    
    toast({
      title: "✨ Identidad guardada",
      description: "Tu configuración se aplicará automáticamente a todas tus publicaciones.",
    });
  };

  const handleContentTypeSelect = (type: ContentType) => {
    setSelectedContentType(type);
    setCurrentStep(2);
  };

  const handleBackToHub = () => {
    setSelectedContentType(null);
    setPropertyData({ fotos: [] });
    setCurrentStep(1);
    setGeneratedCaption("");
    clearAutoSavedData();
  };

  const handleGeneratePreview = () => {
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
        selectedTemplate,
        true
      );
      setGeneratedCaption(caption);
      setCurrentStep(3);
      
      // Guardar métrica
      savePublicationMetric(propertyData.tipo, selectedContentType!, selectedTemplate);
      
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
        selectedTemplate
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
    try {
      // Para reels con video, descargar el video original
      if (selectedContentType === "reel-video" && propertyData.fotos && propertyData.fotos[0]) {
        await exportVideo(propertyData.fotos[0], `reel-${propertyData.tipo}-${Date.now()}.mp4`);
        toast({
          title: "✅ Video descargado",
          description: "Edita el video con tu app favorita agregando los textos.",
        });
        return;
      }

      const filename = `publicacion-${propertyData.tipo}-${Date.now()}.${exportOptions.format}`;
      await exportToImage("canvas-preview", filename, exportOptions);
      toast({
        title: "✅ Imagen descargada",
        description: "Tu publicación se guardó correctamente.",
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

  if (showConfig || !aliadoConfig) {
    return (
      <AliadoConfigForm 
        onSave={handleConfigSave} 
        initialConfig={aliadoConfig || remixConfig || undefined}
        isLocked={isRemixLocked}
      />
    );
  }

  if (!selectedContentType) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <AliadoConfigForm 
          onSave={handleConfigSave} 
          initialConfig={aliadoConfig}
          isLocked={isRemixLocked}
        />
        
        <div className="max-w-6xl w-full animate-fade-in">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-4">
              🎨 Creador Inmobiliario de El Gestor
            </h1>
            <p className="text-xl text-white/90">
              Crea tu publicación profesional en minutos
            </p>
            <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl inline-block">
              <p className="text-white font-medium">
                🏢 {aliadoConfig.nombre} | 📍 {aliadoConfig.ciudad}
              </p>
            </div>
          </div>

          {/* Métricas */}
          <MetricsPanel onClearMetrics={handleClearMetrics} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <ContentTypeCard
              icon={Square}
              title="Post Cuadrado"
              description="1:1 para feed de Instagram y Facebook"
              gradient="gradient-primary"
              onClick={() => handleContentTypeSelect("post")}
            />
            <ContentTypeCard
              icon={Smartphone}
              title="Historia"
              description="9:16 para Stories de Instagram"
              gradient="gradient-secondary"
              onClick={() => handleContentTypeSelect("historia")}
            />
            <ContentTypeCard
              icon={ImageIcon}
              title="Reel con Fotos"
              description="Slideshow automático con música"
              gradient="gradient-accent"
              onClick={() => handleContentTypeSelect("reel-fotos")}
            />
            <ContentTypeCard
              icon={Video}
              title="Reel con Video"
              description="Hasta 20 segundos de video"
              gradient="gradient-primary"
              onClick={() => handleContentTypeSelect("reel-video")}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {isDownloading && <LoadingState message="Generando tu publicación..." />}
      
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
            <TemplateSelector
              selectedTheme={selectedTemplate}
              onThemeChange={setSelectedTemplate}
            />
            
            <PropertyForm 
              data={propertyData} 
              onDataChange={setPropertyData}
            />

            <PhotoManager
              photos={propertyData.fotos || []}
              onPhotosChange={(photos) => setPropertyData({ ...propertyData, fotos: photos })}
              contentType={selectedContentType!}
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
            {selectedContentType === "reel-fotos" && aliadoConfig ? (
              // Reel animado: ReelSlideshow con botón de descarga integrado
              <ReelSlideshow
                propertyData={propertyData as PropertyData}
                aliadoConfig={aliadoConfig}
              />
            ) : selectedContentType === "reel-video" && aliadoConfig ? (
              <VideoPreview
                propertyData={propertyData as PropertyData}
                aliadoConfig={aliadoConfig}
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
                      template={selectedTemplate}
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

            {/* Vista previa en redes sociales */}
            {aliadoConfig && (selectedContentType === "post" || selectedContentType === "historia") && (
              <SocialMockup
                propertyData={propertyData as PropertyData}
                aliadoConfig={aliadoConfig}
                contentType={selectedContentType!}
                caption={generatedCaption}
              />
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
