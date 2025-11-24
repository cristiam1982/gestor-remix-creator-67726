import { LogoSettings } from "@/types/property";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface GalleryLogoControlsProps {
  settings: LogoSettings;
  onChange: (settings: LogoSettings) => void;
}

export const GalleryLogoControls = ({ settings, onChange }: GalleryLogoControlsProps) => {
  const sizes: Array<{ value: LogoSettings['size']; px: number; label: string }> = [
    { value: 'small', px: 60, label: 'Pequeño' },
    { value: 'medium', px: 70, label: 'Mediano' },
    { value: 'large', px: 80, label: 'Grande' },
    { value: 'xlarge', px: 90, label: 'Extra Grande' },
  ];

  const shapes: Array<{ value: NonNullable<LogoSettings['shape']>; icon: string; label: string }> = [
    { value: 'square', icon: '⬛', label: 'Cuadrado' },
    { value: 'rounded', icon: '⬜', label: 'Redondeado' },
    { value: 'circle', icon: '⚫', label: 'Círculo' },
    { value: 'squircle', icon: '🔘', label: 'Squircle' },
  ];

  return (
    <div className="space-y-4">
      {/* Opacidad */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-semibold">Opacidad del Logo</Label>
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
          <span>Sutil (30%)</span>
          <span>Opaco (100%)</span>
        </div>
      </div>

      {/* Tamaño */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Tamaño del Logo</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {sizes.map((size) => (
            <Button
              key={size.value}
              variant={settings.size === size.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ ...settings, size: size.value })}
              className="flex flex-col h-14 gap-0.5 px-1"
            >
              <span className="text-lg font-bold">{size.px}px</span>
              <span className="text-[11px] font-medium">{size.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Forma del Logo */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Forma del Logo</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {shapes.map((shape) => (
            <Button
              key={shape.value}
              variant={(settings.shape || 'rounded') === shape.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ ...settings, shape: shape.value })}
              className="flex flex-col h-14 gap-0.5 px-1"
            >
              <span className="text-xl">{shape.icon}</span>
              <span className="text-[11px] font-medium leading-tight">{shape.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Nota informativa */}
      <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
        ℹ️ En Gallery, el logo siempre aparece en la esquina superior izquierda con fondo blanco sólido.
      </div>
    </div>
  );
};
