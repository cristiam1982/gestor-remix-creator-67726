import { Dispatch, SetStateAction } from "react";
import { Download, RefreshCw, Smartphone, ImageIcon, Video } from "lucide-react";
import { ArrendadoForm } from "@/components/ArrendadoForm";
import { PhotoManager } from "@/components/PhotoManager";
import { ArrendadoPreview } from "@/components/ArrendadoPreview";
import { ArrendadoReelSlideshow } from "@/components/ArrendadoReelSlideshow";
import { VideoReelRecorder } from "@/components/VideoReelRecorder";
import { LoadingState } from "@/components/LoadingState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AliadoConfig, ContentType } from "@/types/property";
import { ArrendadoData, ArrendadoType } from "@/types/arrendado";
import { generateArrendadoCaption } from "@/utils/captionGenerator";
import { savePublicationMetric } from "@/utils/metricsManager";
import { useToast } from "@/hooks/use-toast";

interface ArrendadoStepProps {
  selectedContentType: ContentType;
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  arrendadoState: any;
  generatedCaption: string;
  setGeneratedCaption: Dispatch<SetStateAction<string>>;
  validationErrors: Record<string, string>;
  setValidationErrors: Dispatch<SetStateAction<Record<string, string>>>;
  aliadoConfig: AliadoConfig;
  contentExport: any;
}

export const ArrendadoStep = ({
  selectedContentType,
  currentStep,
  setCurrentStep,
  arrendadoState,
  generatedCaption,
  setGeneratedCaption,
  validationErrors,
  aliadoConfig,
  contentExport
}: ArrendadoStepProps) => {
  const { toast } = useToast();
  const { arrendadoData, setArrendadoData, arrendadoFormat, setArrendadoFormat } = arrendadoState;
  const { isDownloading, handleDownloadImage: exportImage } = contentExport;

  const handleDownloadImage = () => exportImage(selectedContentType, {}, arrendadoData, true);

  const handleGeneratePreview = () => {
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
  };

  if (currentStep === 3) {
    if (isDownloading) {
      return <LoadingState message="Generando tu publicación..." />;
    }

    if (arrendadoFormat === "historia") {
      return (
        <>
          {/* Layout móvil: vertical simple */}
          <div className="lg:hidden space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-primary">🎉 Vista Previa Celebratoria</h3>
              <ScrollArea className="max-h-[60vh]">
                <div className="flex justify-center">
                  <ArrendadoPreview
                    data={arrendadoData as ArrendadoData}
                    aliadoConfig={aliadoConfig}
                    tipo={selectedContentType as ArrendadoType}
                  />
                </div>
              </ScrollArea>
            </Card>

            <Card className="p-6">
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
                  <ArrendadoPreview
                    data={arrendadoData as ArrendadoData}
                    aliadoConfig={aliadoConfig}
                    tipo={selectedContentType as ArrendadoType}
                  />
                </div>

                {/* Botón: parte del mismo scroll */}
                <div className="pt-4 border-t">
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
                </div>
              </Card>
            </ScrollArea>
          </div>
        </>
      );
    }

    if (arrendadoFormat === "reel-fotos") {
      return (
        <ArrendadoReelSlideshow
          data={arrendadoData as ArrendadoData}
          aliadoConfig={aliadoConfig}
          tipo={selectedContentType as ArrendadoType}
          onDownload={handleDownloadImage}
        />
      );
    }

    if (arrendadoFormat === "reel-video" && arrendadoData.videoUrl) {
      return (
        <VideoReelRecorder
          videoUrl={arrendadoData.videoUrl}
          propertyData={arrendadoData as ArrendadoData}
          aliadoConfig={aliadoConfig}
          variant={selectedContentType as "arrendado" | "vendido"}
          onComplete={(blob, duration) => {
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
          }}
        />
      );
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 text-primary">
          🎉 Datos de la Propiedad {selectedContentType === "arrendado" ? "Arrendada" : "Vendida"}
        </h3>
        <ArrendadoForm
          data={arrendadoData}
          updateField={(field, value) => setArrendadoData({
            ...arrendadoData,
            [field]: value
          })}
          errors={validationErrors}
          tipo={selectedContentType as "arrendado" | "vendido"}
          format={arrendadoFormat}
        />
      </Card>

      {/* Selector de formato */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 text-primary">📱 Elige el formato de tu publicación</h3>
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
        photos={arrendadoFormat === "reel-video"
          ? arrendadoData.videoUrl ? [arrendadoData.videoUrl] : []
          : arrendadoData.fotos || []
        }
        onPhotosChange={photos => {
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
        }}
        contentType={arrendadoFormat === "reel-video" ? "reel-video" : arrendadoFormat === "reel-fotos" ? "reel-fotos" : "historia"}
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
          (arrendadoFormat === "reel-video"
            ? !arrendadoData.videoUrl
            : arrendadoData.fotos?.length === 0)
        }
      >
        Generar Publicación Celebratoria
      </Button>
    </div>
  );
};
