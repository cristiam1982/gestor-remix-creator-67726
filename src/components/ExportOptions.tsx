import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ExportOptions as ExportOptionsType } from "@/utils/imageExporter";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportOptionsProps {
  onOptionsChange: (options: ExportOptionsType) => void;
  aliadoNombre?: string;
  onTestFrame?: () => Promise<void>;
  onExportFrames?: () => Promise<void>;
}

export const ExportOptions = ({ onOptionsChange, aliadoNombre, onTestFrame, onExportFrames }: ExportOptionsProps) => {
  const [format, setFormat] = useState<"png" | "jpg">("png");
  const [quality, setQuality] = useState([95]);
  const [addWatermark, setAddWatermark] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleChange = () => {
    onOptionsChange({
      format,
      quality: quality[0] / 100,
      addWatermark,
      watermarkText: addWatermark ? `© ${aliadoNombre || "El Gestor"}` : undefined,
      watermarkColor: "rgba(0, 0, 0, 0.3)",
    });
  };

  const handleFormatChange = (value: string) => {
    setFormat(value as "png" | "jpg");
    setTimeout(handleChange, 0);
  };

  const handleQualityChange = (value: number[]) => {
    setQuality(value);
    setTimeout(handleChange, 0);
  };

  const handleWatermarkChange = (checked: boolean) => {
    setAddWatermark(checked);
    setTimeout(handleChange, 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">⚙️ Opciones de Exportación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Formato</Label>
          <RadioGroup value={format} onValueChange={handleFormatChange}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="png" id="png" />
              <Label htmlFor="png" className="font-normal cursor-pointer">
                PNG (Mayor calidad, archivo más pesado)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="jpg" id="jpg" />
              <Label htmlFor="jpg" className="font-normal cursor-pointer">
                JPG (Menor tamaño, ideal para redes)
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <Label>Calidad</Label>
            <span className="text-sm text-muted-foreground">{quality[0]}%</span>
          </div>
          <Slider
            value={quality}
            onValueChange={handleQualityChange}
            min={50}
            max={100}
            step={5}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Marca de agua</Label>
            <p className="text-sm text-muted-foreground">
              Agregar tu marca en la esquina
            </p>
          </div>
          <Switch checked={addWatermark} onCheckedChange={handleWatermarkChange} />
        </div>

        {/* Botones de prueba sin generar video */}
        <div className="space-y-3 pt-4 border-t">
          <Label className="text-sm font-medium">🧪 Pruebas de Exportación (sin video)</Label>
          
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={async () => {
              if (!onTestFrame) return;
              setIsExporting(true);
              try {
                await onTestFrame();
              } catch (error) {
                toast({
                  title: "Error al probar frame",
                  description: error instanceof Error ? error.message : "Error desconocido",
                  variant: "destructive",
                });
              } finally {
                setIsExporting(false);
              }
            }}
            disabled={isExporting || !onTestFrame}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exportando..." : "Probar 1 frame (PNG)"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={async () => {
              if (!onExportFrames) return;
              setIsExporting(true);
              try {
                await onExportFrames();
              } catch (error) {
                toast({
                  title: "Error al exportar frames",
                  description: error instanceof Error ? error.message : "Error desconocido",
                  variant: "destructive",
                });
              } finally {
                setIsExporting(false);
              }
            }}
            disabled={isExporting || !onExportFrames}
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? "Exportando..." : "Solo frames (ZIP)"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Estos botones te permiten validar la calidad visual antes de gastar créditos en generar el video completo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
