import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
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

      {/* Elementos Visibles en Primera Foto */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Elementos Visibles</Label>
        
        <div className="space-y-1.5">
          {/* Precio */}
          <div className="flex items-center gap-2.5 py-1.5">
            <Checkbox
              id="first-photo-price"
              checked={settings.showPrice}
              onCheckedChange={(checked) => 
                onChange({ ...settings, showPrice: checked as boolean })
              }
            />
            <Label 
              htmlFor="first-photo-price" 
              className="text-sm font-medium cursor-pointer flex items-center gap-2 flex-1"
            >
              <span className="text-base">💰</span>
              <span>Precio</span>
            </Label>
          </div>

          {/* Título/Ubicación */}
          <div className="flex items-center gap-2.5 py-1.5">
            <Checkbox
              id="first-photo-title"
              checked={settings.showTitle}
              onCheckedChange={(checked) => 
                onChange({ ...settings, showTitle: checked as boolean })
              }
            />
            <Label 
              htmlFor="first-photo-title" 
              className="text-sm font-medium cursor-pointer flex items-center gap-2 flex-1"
            >
              <span className="text-base">📍</span>
              <span>Título / Ubicación</span>
            </Label>
          </div>

    {/* Iconos */}
    <div className="flex items-center gap-2.5 py-1.5">
      <Checkbox
        id="first-photo-icons"
        checked={settings.showIcons}
        onCheckedChange={(checked) => 
          onChange({ ...settings, showIcons: checked as boolean })
        }
      />
      <Label 
        htmlFor="first-photo-icons" 
        className="text-sm font-medium cursor-pointer flex items-center gap-2 flex-1"
      >
        <span className="text-base">🛏️</span>
        <span>Iconos de Características</span>
      </Label>
    </div>

  </div>

        <div className="bg-accent/30 p-2 rounded-lg border border-border/50">
          <p className="text-[10px] text-muted-foreground">
            💡 Personaliza qué elementos mostrar en la portada
          </p>
        </div>
      </div>

      {/* Escala de Texto Override */}
      {(settings.showPrice || settings.showTitle || settings.showIcons) && (
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
