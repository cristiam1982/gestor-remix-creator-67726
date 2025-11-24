import { Dispatch, SetStateAction } from "react";
import { Download, RefreshCw, Video, Copy, ChevronLeft } from "lucide-react";
import { PropertyForm } from "@/components/PropertyForm";
import { MultiVideoManager } from "@/components/MultiVideoManager";
import { MultiVideoProcessingModal } from "@/components/MultiVideoProcessingModal";
import { MultiVideoControlsPanel } from "@/components/MultiVideoControlsPanel";
import { MultiVideoStaticPreview } from "@/components/MultiVideoStaticPreview";
import { generateMultiVideoReel } from "@/utils/multiVideoGenerator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AliadoConfig, PropertyData } from "@/types/property";
import { VideoInfo } from "@/hooks/useMultiVideoState";
import { generateCaption, regenerateCaption } from "@/utils/captionGenerator";
import { useToast } from "@/hooks/use-toast";

interface MultiVideoStepProps {
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  propertyState: any;
  multiVideoState: any;
  generatedCaption: string;
  setGeneratedCaption: Dispatch<SetStateAction<string>>;
  validationErrors: Record<string, string>;
  setValidationErrors: Dispatch<SetStateAction<Record<string, string>>>;
  aliadoConfig: AliadoConfig;
}

export const MultiVideoStep = ({
  currentStep,
  setCurrentStep,
  propertyState,
  multiVideoState,
  generatedCaption,
  setGeneratedCaption,
  validationErrors,
  aliadoConfig
}: MultiVideoStepProps) => {
  const { toast } = useToast();
  const { propertyData, setPropertyData } = propertyState;
  const {
    multiVideos,
    setMultiVideos,
    isProcessingMultiVideo,
    setIsProcessingMultiVideo,
    multiVideoProgress,
    setMultiVideoProgress,
    multiVideoStage,
    setMultiVideoStage,
    generatedMultiVideoBlob,
    setGeneratedMultiVideoBlob,
    multiVideoLogoSettings,
    setMultiVideoLogoSettings,
    multiVideoTextComposition,
    setMultiVideoTextComposition,
    multiVideoVisualLayers,
    setMultiVideoVisualLayers,
    multiVideoGradientDirection,
    setMultiVideoGradientDirection,
    multiVideoGradientIntensity,
    setMultiVideoGradientIntensity,
    multiVideoFooterCustomization,
    setMultiVideoFooterCustomization
  } = multiVideoState;

  const handleGeneratePreview = () => {
    if (multiVideos.length < 2) {
      toast({
        title: "⚠️ Faltan videos",
        description: "Sube al menos 2 videos para generar un reel multi-video.",
        variant: "destructive"
      });
      return;
    }

    const totalDuration = multiVideos.reduce((sum: number, v: VideoInfo) => sum + v.duration, 0);
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
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(generatedCaption);
    toast({
      title: "📋 Caption copiado",
      description: "El texto está listo para pegar en tus redes sociales."
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

  const handleGenerateVideo = async () => {
    setIsProcessingMultiVideo(true);
    setMultiVideoProgress(0);
    setMultiVideoStage("Iniciando...");

    try {
      const videoBlobs = await Promise.all(
        multiVideos.map((v: VideoInfo) => fetch(v.url).then(r => r.blob()))
      );
      const subtitles = multiVideos.map((v: VideoInfo) => v.subtitle || "");

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
        onProgress: (progress: number, stage: string) => {
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
  };

  const handleDownloadVideo = () => {
    if (!generatedMultiVideoBlob) return;

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

    const formatNote = ext === "webm" ? " (Formato WebM, compatible con Chrome/Android)" : "";
    toast({
      title: "✅ Descarga completada",
      description: `Tu reel multi-video se ha descargado correctamente.${formatNote}`
    });
  };

  if (currentStep === 3) {
    return (
      <>
        <MultiVideoProcessingModal
          isOpen={isProcessingMultiVideo}
          progress={multiVideoProgress}
          stage={multiVideoStage}
          isComplete={false}
        />

        {/* Layout móvil: vertical simple */}
        <div className="lg:hidden space-y-4">
          {/* Info resumida de videos */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                <span className="font-semibold text-sm">
                  {multiVideos.length} video{multiVideos.length !== 1 ? 's' : ''} • {Math.round(multiVideos.reduce((acc: number, v: VideoInfo) => acc + v.duration, 0))}s total
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
            <MultiVideoControlsPanel
              gradientDirection={multiVideoGradientDirection}
              onGradientDirectionChange={setMultiVideoGradientDirection}
              gradientIntensity={multiVideoGradientIntensity}
              onGradientIntensityChange={setMultiVideoGradientIntensity}
              logoSettings={multiVideoLogoSettings}
              onLogoSettingsChange={setMultiVideoLogoSettings}
              textComposition={multiVideoTextComposition}
              onTextCompositionChange={setMultiVideoTextComposition}
              visualLayers={multiVideoVisualLayers}
              onVisualLayersChange={setMultiVideoVisualLayers}
              footerCustomization={multiVideoFooterCustomization}
              onFooterCustomizationChange={setMultiVideoFooterCustomization}
            />
          </Card>
          
          {/* Preview/generación móvil */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3 text-primary">🎬 Reel Multi-Video</h3>
            <div className="space-y-3">
              {multiVideos.length > 0 && propertyData && !generatedMultiVideoBlob && (
                <MultiVideoStaticPreview
                  key={`preview-mobile-${JSON.stringify({
                    pos: multiVideoLogoSettings.position,
                    size: multiVideoLogoSettings.size,
                    grad: multiVideoGradientDirection,
                    scale: multiVideoTextComposition.typographyScale
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
                    footerCustomization: multiVideoFooterCustomization
                  }}
                  subtitle={multiVideos[0].subtitle}
                />
              )}

              {!generatedMultiVideoBlob ? (
                <>
                  {/* Caption generado */}
                  {generatedCaption && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold text-xs">📝 Caption para tu publicación</Label>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCopyCaption}
                            variant="outline"
                            size="sm"
                            disabled={!generatedCaption}
                            className="text-xs h-8"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copiar
                          </Button>
                          <Button
                            onClick={handleRegenerateCaption}
                            variant="outline"
                            size="sm"
                            disabled={!propertyData.tipo}
                            className="text-xs h-8"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Regenerar
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={generatedCaption}
                        onChange={e => setGeneratedCaption(e.target.value)}
                        className="min-h-[160px] font-sans text-xs"
                        placeholder="El caption se generará automáticamente..."
                      />
                      <p className="text-[10px] text-muted-foreground">
                        ℹ️ Caption optimizado para redes sociales con hashtags locales
                      </p>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleGenerateVideo}
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
                </>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium text-xs">
                      ✨ Tu reel multi-video está listo para descargar
                    </p>
                  </div>
                  
                  {generatedMultiVideoBlob && (
                    <video
                      src={URL.createObjectURL(generatedMultiVideoBlob)}
                      controls
                      className="w-full rounded-lg"
                    />
                  )}
                  
                  <Button
                    onClick={handleDownloadVideo}
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
        </div>

        {/* Layout desktop: Grid con 3 scrolls independientes */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_540px] gap-6 h-[calc(100vh-180px)]">
          {/* COLUMNA IZQUIERDA: Controles con scroll */}
          <ScrollArea className="h-full pr-4">
            <Card className="p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-primary">🎬 Videos Cargados</h3>
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Volver a editar videos
                </Button>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  <span className="font-semibold">
                    {multiVideos.length} video{multiVideos.length !== 1 ? 's' : ''} cargados • {Math.round(multiVideos.reduce((acc: number, v: VideoInfo) => acc + v.duration, 0))}s total
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-primary">🎨 Personalización</h3>
              <MultiVideoControlsPanel
                gradientDirection={multiVideoGradientDirection}
                onGradientDirectionChange={setMultiVideoGradientDirection}
                gradientIntensity={multiVideoGradientIntensity}
                onGradientIntensityChange={setMultiVideoGradientIntensity}
                logoSettings={multiVideoLogoSettings}
                onLogoSettingsChange={setMultiVideoLogoSettings}
                textComposition={multiVideoTextComposition}
                onTextCompositionChange={setMultiVideoTextComposition}
                visualLayers={multiVideoVisualLayers}
                onVisualLayersChange={setMultiVideoVisualLayers}
                footerCustomization={multiVideoFooterCustomization}
                onFooterCustomizationChange={setMultiVideoFooterCustomization}
              />
            </Card>
          </ScrollArea>

          {/* COLUMNA DERECHA: Preview section completa con scroll */}
          <ScrollArea className="h-full min-h-0">
            <Card className="p-6 flex flex-col">
              <h3 className="text-xl font-semibold mb-4 text-primary">🎬 Preview Reel Multi-Video</h3>
              
              {multiVideos.length > 0 && propertyData && !generatedMultiVideoBlob && (
                <div className="mb-6">
                  <MultiVideoStaticPreview
                    key={`preview-desktop-${JSON.stringify({
                      pos: multiVideoLogoSettings.position,
                      size: multiVideoLogoSettings.size,
                      grad: multiVideoGradientDirection,
                      scale: multiVideoTextComposition.typographyScale
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
                      footerCustomization: multiVideoFooterCustomization
                    }}
                    subtitle={multiVideos[0].subtitle}
                  />
                </div>
              )}

              {!generatedMultiVideoBlob ? (
                <div className="space-y-4">
                  {generatedCaption && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-semibold">📝 Caption</Label>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCopyCaption}
                            variant="outline"
                            size="sm"
                            disabled={!generatedCaption}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copiar
                          </Button>
                          <Button
                            onClick={handleRegenerateCaption}
                            variant="outline"
                            size="sm"
                            disabled={!propertyData.tipo}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Regenerar
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={generatedCaption}
                        onChange={e => setGeneratedCaption(e.target.value)}
                        className="min-h-[120px] font-sans"
                        placeholder="El caption se generará automáticamente..."
                      />
                    </div>
                  )}

                  <Button
                    onClick={handleGenerateVideo}
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
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">
                      ✨ Tu reel multi-video está listo para descargar
                    </p>
                  </div>
                  
                  {generatedMultiVideoBlob && (
                    <video
                      src={URL.createObjectURL(generatedMultiVideoBlob)}
                      controls
                      className="w-full rounded-lg"
                    />
                  )}
                  
                  <Button
                    onClick={handleDownloadVideo}
                    variant="hero"
                    size="lg"
                    className="w-full"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Descargar Video
                  </Button>
                </div>
              )}
            </Card>
          </ScrollArea>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
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
    </div>
  );
};
