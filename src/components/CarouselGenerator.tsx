import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PropertyData, AliadoConfig } from "@/types/property";
import { captureCurrentSlide, exportCaption } from "@/utils/unifiedCarouselExporter";
import { useToast } from "@/hooks/use-toast";
import { CanvasPreview } from "@/components/CanvasPreview";

interface CarouselGeneratorProps {
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  caption: string;
}

export const CarouselGenerator = ({ propertyData, aliadoConfig, caption }: CarouselGeneratorProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLastSlide, setIsLastSlide] = useState(false);
  
  const totalSlides = propertyData.fotos.length + 1; // fotos + slide final CTA

  const handleGenerateCarousel = async () => {
    if (propertyData.fotos.length < 3 || propertyData.fotos.length > 10) {
      toast({
        title: "⚠️ Número de fotos incorrecto",
        description: "El carrusel requiere entre 3 y 10 fotos.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      toast({
        title: "🎨 Generando carrusel...",
        description: `Creando ${totalSlides} slides profesionales`,
      });

      // Generar cada slide secuencialmente
      for (let i = 0; i < totalSlides; i++) {
        const slideNumber = i + 1;
        const isFinalSlide = slideNumber === totalSlides;
        
        // Actualizar estado para que CanvasPreview renderice el slide correcto
        setCurrentSlide(i);
        setIsLastSlide(isFinalSlide);
        
        // Esperar a que React actualice el DOM
        await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Capturar el slide actual
        const filename = `slide-${String(slideNumber).padStart(2, '0')}.png`;
        await captureCurrentSlide(filename);
        
        // Actualizar progreso
        const percent = Math.round((slideNumber / totalSlides) * 100);
        setProgress(percent);
      }
      
      // Exportar caption
      exportCaption(caption);

      toast({
        title: "✅ Carrusel generado",
        description: `Se han descargado ${totalSlides} imágenes numeradas. Súbelas a Instagram en orden.`,
      });
    } catch (error) {
      console.error("Error generando carrusel:", error);
      toast({
        title: "❌ Error al generar carrusel",
        description: "Intenta nuevamente o reduce el número de fotos.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  return (
    <>
      {/* Preview oculto del slide actual para captura */}
      <div className="hidden">
        <CanvasPreview
          propertyData={propertyData}
          aliadoConfig={aliadoConfig}
          contentType="post"
          carouselMode={{
            isLastSlide: isLastSlide,
            slideNumber: currentSlide + 1,
            totalSlides: totalSlides
          }}
          currentPhotoIndexOverride={currentSlide}
        />
      </div>
      
      <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          📸 Carrusel de {totalSlides} Slides
        </h3>
        <p className="text-sm text-muted-foreground">
          Se generarán {propertyData.fotos.length} slides con las fotos + 1 slide final con llamado a la acción.
        </p>
      </div>

      {isGenerating && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">
            Generando slide {Math.ceil((progress / 100) * totalSlides)} de {totalSlides}...
          </p>
        </div>
      )}

      <Button
        onClick={handleGenerateCarousel}
        disabled={isGenerating}
        size="lg"
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generando carrusel...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Descargar {totalSlides} Slides del Carrusel
          </>
        )}
      </Button>

      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <p className="text-sm font-medium text-foreground">💡 Cómo usar el carrusel:</p>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Se descargarán {totalSlides} imágenes numeradas (01, 02, 03...)</li>
          <li>Súbelas a Instagram como carrusel en el orden numérico</li>
          <li>La última imagen contiene el CTA y datos de contacto</li>
          <li>Los carruseles tienen 1.4x más engagement que posts simples</li>
        </ol>
      </div>
    </Card>
    </>
  );
};
