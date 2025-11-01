import { LogoSettings } from "@/types/property";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface ReelLogoControlsProps {
  settings: LogoSettings;
  onChange: (settings: LogoSettings) => void;
}

export const ReelLogoControls = ({ settings, onChange }: ReelLogoControlsProps) => {
  const positions: Array<{ value: LogoSettings['position']; icon: string; label: string }> = [
    { value: 'top-left', icon: '↖️', label: 'Superior Izq.' },
    { value: 'top-right', icon: '↗️', label: 'Superior Der.' },
    { value: 'bottom-center', icon: '⬇️', label: 'Inferior Centro' },
  ];

  const backgrounds: Array<{ value: LogoSettings['background']; icon: string; label: string }> = [
    { value: 'none', icon: '🚫', label: 'Sin Fondo' },
    { value: 'blur', icon: '💨', label: 'Blur Sutil' },
    { value: 'shadow', icon: '🌑', label: 'Sombra' },
    { value: 'box', icon: '⬜', label: 'Recuadro' },
  ];

  const sizes: Array<{ value: LogoSettings['size']; px: number; label: string }> = [
    { value: 'small', px: 60, label: 'Pequeño' },
    { value: 'medium', px: 90, label: 'Mediano' },
    { value: 'large', px: 100, label: 'Grande' },
  ];

  return (
    <div className="space-y-6">
      {/* Posición */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Posición del Logo</Label>
        <div className="grid grid-cols-3 gap-2">
          {positions.map((pos) => (
            <Button
              key={pos.value}
              variant={settings.position === pos.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ ...settings, position: pos.value })}
              className="flex flex-col h-20 gap-2"
            >
              <span className="text-2xl">{pos.icon}</span>
              <span className="text-xs leading-tight">{pos.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Opacidad */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-semibold">Opacidad</Label>
          <span className="text-sm font-bold bg-accent px-3 py-1 rounded-full">
            {settings.opacity}%
          </span>
        </div>
        <Slider
          value={[settings.opacity]}
          onValueChange={(value) => onChange({ ...settings, opacity: value[0] })}
          min={30}
          max={100}
          step={10}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Sutil</span>
          <span>Opaco</span>
        </div>
      </div>

      {/* Efecto de Fondo */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Efecto de Fondo</Label>
        <div className="grid grid-cols-2 gap-2">
          {backgrounds.map((bg) => (
            <Button
              key={bg.value}
              variant={settings.background === bg.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ ...settings, background: bg.value })}
              className="flex flex-col h-16 gap-1"
            >
              <span className="text-xl">{bg.icon}</span>
              <span className="text-xs">{bg.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Tamaño */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Tamaño del Logo</Label>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((size) => (
            <Button
              key={size.value}
              variant={settings.size === size.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ ...settings, size: size.value })}
              className="flex flex-col h-16 gap-1"
            >
              <span className="text-lg font-bold">{size.px}px</span>
              <span className="text-xs">{size.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
