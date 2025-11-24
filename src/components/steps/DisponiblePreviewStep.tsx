import { Dispatch, SetStateAction, useState } from "react";
import { Download, RefreshCw, Images, Copy } from "lucide-react";
import { CanvasPreview } from "@/components/CanvasPreview";
import { ReelSlideshow } from "@/components/ReelSlideshow";
import { VideoReelRecorder } from "@/components/VideoReelRecorder";
import { LoadingState } from "@/components/LoadingState";
import { PostControlsPanel } from "@/components/PostControlsPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AliadoConfig, PropertyData, ContentType, LogoSettings, TextCompositionSettings, VisualLayers, FirstPhotoConfig } from "@/types/property";
import { useToast } from "@/hooks/use-toast";

interface DisponiblePreviewStepProps {
  selectedContentType: ContentType;
  propertyData: Partial<PropertyData>;
  aliadoConfig: AliadoConfig;
  generatedCaption: string;
  setGeneratedCaption: Dispatch<SetStateAction<string>>;
  onRegenerateCaption: () => void;
  contentExport: any;
  postLogoSettings: LogoSettings;
  setPostLogoSettings: Dispatch<SetStateAction<LogoSettings>>;
  postTextComposition: TextCompositionSettings;
  setPostTextComposition: Dispatch<SetStateAction<TextCompositionSettings>>;
  postVisualLayers: VisualLayers;
  setPostVisualLayers: Dispatch<SetStateAction<VisualLayers>>;
  postGradientDirection: "top" | "bottom" | "both" | "none";
  setPostGradientDirection: Dispatch<SetStateAction<"top" | "bottom" | "both" | "none">>;
  postGradientIntensity: number;
  setPostGradientIntensity: Dispatch<SetStateAction<number>>;
  postFirstPhotoConfig: FirstPhotoConfig;
  setPostFirstPhotoConfig: Dispatch<SetStateAction<FirstPhotoConfig>>;
}

export const DisponiblePreviewStep = ({
  selectedContentType,
  propertyData,
  aliadoConfig,
  generatedCaption,
  setGeneratedCaption,
  onRegenerateCaption,
  contentExport,
  postLogoSettings,
  setPostLogoSettings,
  postTextComposition,
  setPostTextComposition,
  postVisualLayers,
  setPostVisualLayers,
  postGradientDirection,
  setPostGradientDirection,
  postGradientIntensity,
  setPostGradientIntensity,
  postFirstPhotoConfig,
  setPostFirstPhotoConfig
}: DisponiblePreviewStepProps) => {
  const { toast } = useToast();
  const {
    isDownloading,
    isExportingAllPhotos,
    exportProgress,
    currentPhotoIndexOverride,
    handleDownloadImage: exportImage,
    handleExportAllPhotos: exportAllPhotosFn
  } = contentExport;

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const handleDownloadImage = () => exportImage(selectedContentType, propertyData, {}, false);
  const handleExportAllPhotos = () => exportAllPhotosFn(propertyData, aliadoConfig, selectedContentType!);

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(generatedCaption);
    toast({
      title: "📋 Caption copiado",
      description: "El texto está listo para pegar en tus redes sociales."
    });
  };

  const isPost = selectedContentType === "post";
  const isStory = selectedContentType === "historia";
  const isReelFotos = selectedContentType === "reel-fotos";
  const isReelVideo = selectedContentType === "reel-video";

  // Determinar qué índice mostrar
  const effectivePhotoIndex = currentPhotoIndexOverride ?? currentPhotoIndex;

  if (isDownloading) {
    return <LoadingState message="Generando tu publicación..." />;
  }

  if (isReelFotos) {
    return (
      <ReelSlideshow
        propertyData={propertyData as PropertyData}
        aliadoConfig={aliadoConfig}
        caption={generatedCaption}
        onCaptionChange={setGeneratedCaption}
        onDownload={handleDownloadImage}
        onRegenerateCaption={onRegenerateCaption}
      />
    );
  }

  if (isReelVideo && propertyData.fotos && propertyData.fotos[0]) {
    return (
      <VideoReelRecorder
        videoUrl={propertyData.fotos[0]}
        propertyData={propertyData as PropertyData}
        aliadoConfig={aliadoConfig}
        onComplete={(blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const tipo = propertyData.tipo || "inmueble";
          const ext = blob.type.includes("mp4") ? "mp4" : blob.type.includes("webm") ? "webm" : "mp4";
          a.download = `reel-video-${tipo}-${Date.now()}.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast({
            title: "✅ Video generado exitosamente",
            description: `Tu reel se ha descargado correctamente.`
          });
        }}
      />
    );
  }

  // Render para Post o Historia
  return (
    <>
      {/* Layout móvil: vertical simple */}
      <div className="lg:hidden space-y-6">
        {isPost && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-3 text-primary">🎨 Personalización</h3>
            <PostControlsPanel
              logoSettings={postLogoSettings}
              onLogoSettingsChange={setPostLogoSettings}
              textComposition={postTextComposition}
              onTextCompositionChange={setPostTextComposition}
              visualLayers={postVisualLayers}
              onVisualLayersChange={setPostVisualLayers}
              gradientDirection={postGradientDirection}
              onGradientDirectionChange={setPostGradientDirection}
              gradientIntensity={postGradientIntensity}
              onGradientIntensityChange={setPostGradientIntensity}
              firstPhotoConfig={postFirstPhotoConfig}
              onFirstPhotoConfigChange={setPostFirstPhotoConfig}
            />
          </Card>
        )}

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-primary">
            {isPost ? "🟩 Post Cuadrado" : "🟦 Historia"}
          </h3>
          <div className="flex justify-center">
            <CanvasPreview
              propertyData={propertyData as PropertyData}
              aliadoConfig={aliadoConfig}
              contentType={selectedContentType as ContentType}
              currentPhotoIndexOverride={effectivePhotoIndex}
              logoSettings={isPost ? postLogoSettings : undefined}
              textComposition={isPost ? postTextComposition : undefined}
              visualLayers={isPost ? postVisualLayers : undefined}
              gradientDirection={isPost ? postGradientDirection : undefined}
              gradientIntensity={isPost ? postGradientIntensity : undefined}
              firstPhotoConfig={isPost ? postFirstPhotoConfig : undefined}
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          {isPost && propertyData.fotos && propertyData.fotos.length > 1 && (
            <>
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
                    Descargar Foto Actual
                  </>
                )}
              </Button>
              <Button
                onClick={handleExportAllPhotos}
                variant="outline"
                size="lg"
                className="w-full"
                disabled={isExportingAllPhotos}
              >
                {isExportingAllPhotos ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Exportando {exportProgress}%
                  </>
                ) : (
                  <>
                    <Images className="w-5 h-5 mr-2" />
                    Exportar Todas las Fotos ({propertyData.fotos.length})
                  </>
                )}
              </Button>
            </>
          )}
          {(!isPost || !propertyData.fotos || propertyData.fotos.length === 1) && (
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
                  Descargar Imagen
                </>
              )}
            </Button>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">📝 Caption para tu publicación</Label>
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
                  onClick={onRegenerateCaption}
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
              className="min-h-[200px] font-sans"
              placeholder="El caption se generará automáticamente..."
            />
          </div>
        </Card>
      </div>

      {/* Layout desktop: Grid con 3 scrolls independientes */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_540px] gap-6 h-[calc(100vh-180px)]">
        {/* COLUMNA IZQUIERDA: Controles con scroll */}
        <ScrollArea className="h-full pr-4">
          {isPost && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-primary">🎨 Personalización</h3>
              <PostControlsPanel
                logoSettings={postLogoSettings}
                onLogoSettingsChange={setPostLogoSettings}
                textComposition={postTextComposition}
                onTextCompositionChange={setPostTextComposition}
                visualLayers={postVisualLayers}
                onVisualLayersChange={setPostVisualLayers}
                gradientDirection={postGradientDirection}
                onGradientDirectionChange={setPostGradientDirection}
                gradientIntensity={postGradientIntensity}
                onGradientIntensityChange={setPostGradientIntensity}
                firstPhotoConfig={postFirstPhotoConfig}
                onFirstPhotoConfigChange={setPostFirstPhotoConfig}
              />
            </Card>
          )}
        </ScrollArea>

        {/* COLUMNA DERECHA: Preview fijo sin scroll interno */}
        <div className="h-full min-h-0 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden p-6">
            <h3 className="text-xl font-semibold mb-4 text-primary flex-shrink-0">
              {isPost ? "🟩 Post Cuadrado" : "🟦 Historia"}
            </h3>
            
            <ScrollArea className="flex-1 min-h-0 mb-4">
              <div className="flex justify-center mb-6">
                <CanvasPreview
                  propertyData={propertyData as PropertyData}
                  aliadoConfig={aliadoConfig}
                  contentType={selectedContentType as ContentType}
                  currentPhotoIndexOverride={effectivePhotoIndex}
                  logoSettings={isPost ? postLogoSettings : undefined}
                  textComposition={isPost ? postTextComposition : undefined}
                  visualLayers={isPost ? postVisualLayers : undefined}
                  gradientDirection={isPost ? postGradientDirection : undefined}
                  gradientIntensity={isPost ? postGradientIntensity : undefined}
                  firstPhotoConfig={isPost ? postFirstPhotoConfig : undefined}
                />
              </div>
            </ScrollArea>

            <div className="flex-shrink-0 space-y-3">
              {isPost && propertyData.fotos && propertyData.fotos.length > 1 && (
                <>
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
                        Descargar Foto Actual
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleExportAllPhotos}
                    variant="outline"
                    size="lg"
                    className="w-full"
                    disabled={isExportingAllPhotos}
                  >
                    {isExportingAllPhotos ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Exportando {exportProgress}%
                      </>
                    ) : (
                      <>
                        <Images className="w-5 h-5 mr-2" />
                        Exportar Todas las Fotos ({propertyData.fotos.length})
                      </>
                    )}
                  </Button>
                </>
              )}
              {(!isPost || !propertyData.fotos || propertyData.fotos.length === 1) && (
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
                      Descargar Imagen
                    </>
                  )}
                </Button>
              )}

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
                      onClick={onRegenerateCaption}
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
                  className="min-h-[160px] font-sans"
                  placeholder="El caption se generará automáticamente..."
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Canvas offscreen para exportación */}
      <div
        id="canvas-export"
        className="fixed opacity-0 pointer-events-none"
        style={{ top: '-9999px', left: '-9999px' }}
      >
        <CanvasPreview
          propertyData={propertyData as PropertyData}
          aliadoConfig={aliadoConfig}
          contentType={selectedContentType as ContentType}
          currentPhotoIndexOverride={effectivePhotoIndex}
          exportMode={true}
          logoSettings={isPost ? postLogoSettings : undefined}
          textComposition={isPost ? postTextComposition : undefined}
          visualLayers={isPost ? postVisualLayers : undefined}
          gradientDirection={isPost ? postGradientDirection : undefined}
          gradientIntensity={isPost ? postGradientIntensity : undefined}
          firstPhotoConfig={isPost ? postFirstPhotoConfig : undefined}
        />
      </div>
    </>
  );
};
