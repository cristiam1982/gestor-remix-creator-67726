import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FirstPhotoConfig } from "@/types/property";

interface FirstPhotoControlsProps {
  settings: FirstPhotoConfig;
  onChange: (settings: FirstPhotoConfig) => void;
  showDuration?: boolean; // Solo para Reel
}

export const FirstPhotoControls = ({ settings, onChange, showDuration = false }: FirstPhotoControlsProps) => {
  return (
    <div className="space-y-6">
      {/* Duración (solo Reel) */}
      {showDuration && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Duración de Portada</Label>
            <span className="text-xs text-muted-foreground">
              {settings.duration ? `${(settings.duration / 1000).toFixed(1)}s` : 'Auto'}
            </span>
          </div>
          <Slider
            value={[settings.duration || 1300]}
            onValueChange={(value) => onChange({ ...settings, duration: value[0] })}
            min={1000}
            max={5000}
            step={100}
            className="py-2"
          />
          <p className="text-xs text-muted-foreground">
            Controla cuánto tiempo se muestra la primera foto (portada)
          </p>
        </div>
      )}

      {/* Estilo de Overlay */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Estilo de Información</Label>
        <Select
          value={settings.overlayStyle}
          onValueChange={(value: 'full' | 'simple' | 'clean') =>
            onChange({ ...settings, overlayStyle: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">
              <div className="flex flex-col items-start">
                <span className="font-medium">Completo</span>
                <span className="text-xs text-muted-foreground">Precio + Título + Iconos</span>
              </div>
            </SelectItem>
            <SelectItem value="simple">
              <div className="flex flex-col items-start">
                <span className="font-medium">Simplificado</span>
                <span className="text-xs text-muted-foreground">Solo Precio + Título</span>
              </div>
            </SelectItem>
            <SelectItem value="clean">
              <div className="flex flex-col items-start">
                <span className="font-medium">Limpio</span>
                <span className="text-xs text-muted-foreground">Sin información (solo foto)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Personaliza qué información mostrar en la primera foto
        </p>
      </div>

      {/* Escala de Texto Override */}
      {settings.overlayStyle !== 'clean' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Tamaño de Texto</Label>
            <span className="text-xs text-muted-foreground">
              {settings.textScaleOverride !== undefined
                ? `${settings.textScaleOverride > 0 ? '+' : ''}${settings.textScaleOverride}%`
                : 'Por defecto'}
            </span>
          </div>
          <Slider
            value={[settings.textScaleOverride || 0]}
            onValueChange={(value) => onChange({ ...settings, textScaleOverride: value[0] })}
            min={-50}
            max={60}
            step={10}
            className="py-2"
          />
          <p className="text-xs text-muted-foreground">
            Ajusta el tamaño del texto solo para la primera foto
          </p>
        </div>
      )}

      {/* Control de Logo del Aliado */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">Mostrar Logo del Aliado</Label>
            <span className="text-xs text-muted-foreground">
              Controla si el logo aparece en la portada
            </span>
          </div>
          <Switch
            checked={settings.showAllyLogo !== false}
            onCheckedChange={(checked) => 
              onChange({ ...settings, showAllyLogo: checked })
            }
          />
        </div>
      </div>
    </div>
  );
};
