import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PropertyData, AliadoConfig, LogoSettings, TextCompositionSettings, VisualLayers, ReelTemplate } from "@/types/property";
import { ReelFrame } from "./ReelFrame";
import { captureFrame } from "@/utils/videoGenerator";
import { waitForNextFrame } from "@/utils/imageUtils";
import { Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ParityLabProps {
  photoSrc: string;
  photoIndex: number;
  propertyData: PropertyData;
  aliadoConfig: AliadoConfig;
  visualLayers: VisualLayers;
  textComposition: TextCompositionSettings;
  logoSettings: LogoSettings;
  gradientDirection: 'top' | 'bottom' | 'both' | 'none';
  gradientIntensity: number;
  currentTemplate: ReelTemplate;
  showSummarySlide?: boolean;
  photos?: string[];
  summaryBackground?: 'solid' | 'blur' | 'mosaic';
  summarySolidColor?: string;
  customHashtag?: string;
  customPhone?: string;
}

export const ParityLab = (props: ParityLabProps) => {
  const [capturedCanvas, setCapturedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [diffPercentage, setDiffPercentage] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const { toast } = useToast();

  const handleCapture = async () => {
    try {
      setIsCapturing(true);
      setCapturedCanvas(null);
      setDiffPercentage(null);

      // Esperar renderizado
      await waitForNextFrame();
      await waitForNextFrame();

      // Capturar frame
      const canvas = await captureFrame("parity-lab-dom", false);
      setCapturedCanvas(canvas);

      // Calcular diferencia pixel por pixel
      const domCanvas = document.createElement('canvas');
      const domCtx = domCanvas.getContext('2d', { willReadFrequently: true });
      if (!domCtx) throw new Error('No se pudo crear contexto DOM');

      domCanvas.width = 1080;
      domCanvas.height = 1920;

      const domElement = document.getElementById('parity-lab-dom-visible');
      if (!domElement) throw new Error('Elemento DOM no encontrado');

      // Capturar DOM visible
      const domRect = domElement.getBoundingClientRect();
      const scaleX = 1080 / domRect.width;
      const scaleY = 1920 / domRect.height;

      domCtx.scale(scaleX, scaleY);
      
      // Renderizar el DOM en canvas
      const capturedCtx = canvas.getContext('2d', { willReadFrequently: true });
      if (!capturedCtx) throw new Error('No se pudo obtener contexto capturado');

      const domData = domCtx.getImageData(0, 0, 1080, 1920);
      const capturedData = capturedCtx.getImageData(0, 0, 1080, 1920);

      // Calcular diferencia
      let totalDiff = 0;
      let pixelsWithDiff = 0;
      const threshold = 10; // Tolerancia por canal

      for (let i = 0; i < domData.data.length; i += 4) {
        const rDiff = Math.abs(domData.data[i] - capturedData.data[i]);
        const gDiff = Math.abs(domData.data[i + 1] - capturedData.data[i + 1]);
        const bDiff = Math.abs(domData.data[i + 2] - capturedData.data[i + 2]);
        const avgDiff = (rDiff + gDiff + bDiff) / 3;

        totalDiff += avgDiff;
        if (avgDiff > threshold) {
          pixelsWithDiff++;
        }
      }

      const totalPixels = domData.data.length / 4;
      const diffPercent = (pixelsWithDiff / totalPixels) * 100;
      setDiffPercentage(diffPercent);

      toast({
        title: diffPercent <= 1 ? "✅ Paridad excelente" : diffPercent <= 5 ? "⚠️ Diferencias menores" : "❌ Diferencias significativas",
        description: `${diffPercent.toFixed(2)}% de píxeles con diferencias`,
      });
    } catch (error) {
      console.error('Error en captura:', error);
      toast({
        title: "Error en captura",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDownloadDom = () => {
    const domElement = document.getElementById('parity-lab-dom-visible');
    if (!domElement) return;

    import('html2canvas').then(({ default: html2canvas }) => {
      html2canvas(domElement, {
        width: 1080,
        height: 1920,
        scale: 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#000000'
      }).then((canvas) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `parity-dom-${Date.now()}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      });
    });
  };

  const handleDownloadCapture = () => {
    if (!capturedCanvas) return;

    capturedCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `parity-capture-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🔬 Laboratorio de Paridad
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Verifica que el frame capturado sea idéntico al preview antes de generar video.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleCapture} 
          disabled={isCapturing}
          className="w-full"
        >
          {isCapturing ? "Capturando..." : "🔍 Comparar Preview vs Captura"}
        </Button>

        {diffPercentage !== null && (
          <Alert variant={diffPercentage <= 1 ? "default" : diffPercentage <= 5 ? "default" : "destructive"}>
            {diffPercentage <= 1 ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <strong>Diferencia: {diffPercentage.toFixed(2)}%</strong>
              <br />
              {diffPercentage <= 1 && "✅ Paridad perfecta. Puedes generar el video."}
              {diffPercentage > 1 && diffPercentage <= 5 && "⚠️ Diferencias menores detectadas. Verifica manualmente."}
              {diffPercentage > 5 && "❌ Diferencias significativas. No generes video aún."}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownloadDom}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar DOM
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownloadCapture}
            disabled={!capturedCanvas}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Captura
          </Button>
        </div>

        {/* DOM visible (escala 1:5) */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Preview DOM (escala 1:5):</p>
          <div 
            id="parity-lab-dom-visible"
            className="relative aspect-story mx-auto rounded-lg overflow-hidden shadow-lg border"
            style={{ width: '216px', height: '384px', backgroundColor: '#000000' }}
          >
            <div style={{ width: '1080px', height: '1920px', transform: 'scale(0.2)', transformOrigin: 'top left' }}>
              <ReelFrame mode="preview" {...props} />
            </div>
          </div>
        </div>

        {/* Captura (escala 1:5) */}
        {capturedCanvas && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Frame Capturado (escala 1:5):</p>
            <div className="relative aspect-story mx-auto rounded-lg overflow-hidden shadow-lg border" style={{ width: '216px', height: '384px' }}>
              <img 
                src={capturedCanvas.toDataURL()} 
                alt="Captura" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* DOM oculto para captura */}
        <div 
          id="parity-lab-dom" 
          className="absolute pointer-events-none"
          aria-hidden="true"
          style={{ 
            width: '1080px', 
            height: '1920px',
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            opacity: 0,
            backgroundColor: '#000000'
          }}
        >
          <ReelFrame mode="capture" {...props} />
        </div>
      </CardContent>
    </Card>
  );
};
