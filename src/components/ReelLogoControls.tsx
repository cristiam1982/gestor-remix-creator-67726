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
  ];

  const backgrounds: Array<{ value: LogoSettings['background']; icon: string; label: string }> = [
    { value: 'elevated', icon: '☁️', label: 'Elevado Pro' },
    { value: 'frosted', icon: '💎', label: 'Glass Pro' },
    { value: 'glow', icon: '⚡', label: 'Glow Neon' },
    { value: 'none', icon: '✨', label: 'Flotante' },
  ];

  const sizes: Array<{ value: LogoSettings['size']; px: number; label: string }> = [
    { value: 'small', px: 60, label: 'Pequeño' },
    { value: 'medium', px: 70, label: 'Mediano' },
    { value: 'large', px: 80, label: 'Grande' },
    { value: 'xlarge', px: 90, label: 'Extra Grande' },
  ];

  const shapes: Array<{ value: NonNullable<LogoSettings['shape']>; icon: string; label: string }> = [
    { value: 'square', icon: '⬜', label: 'Cuadrado' },
    { value: 'rounded', icon: '▢', label: 'Redondeado' },
    { value: 'circle', icon: '⚪', label: 'Círculo' },
    { value: 'squircle', icon: '◉', label: 'Squircle' },
  ];

  return (
    <div className="space-y-4">
      {/* Posición */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Posición del Logo</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {positions.map((pos) => (
            <Button
              key={pos.value}
              variant={settings.position === pos.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ ...settings, position: pos.value })}
              className="flex flex-col h-14 gap-0.5"
            >
              <span className="text-xl">{pos.icon}</span>
              <span className="text-[11px] leading-tight font-medium">{pos.label}</span>
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
        {settings.shape === 'circle' && (
          <p className="text-xs text-muted-foreground">
            ℹ️ Deshabilitado con forma circular
          </p>
        )}
        <div className="grid grid-cols-4 gap-1.5">
          {backgrounds.map((bg) => (
            <Button
              key={bg.value}
              variant={settings.background === bg.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ ...settings, background: bg.value })}
              disabled={settings.shape === 'circle'}
              className="flex flex-col h-14 gap-0.5 px-1"
            >
              <span className="text-xl">{bg.icon}</span>
              <span className="text-[11px] leading-tight font-medium">{bg.label}</span>
            </Button>
          ))}
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
    </div>
  );
};
