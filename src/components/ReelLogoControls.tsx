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
    { value: 'none', icon: '✨', label: 'Flotante' },
    { value: 'frosted', icon: '💎', label: 'Glass Pro' },
    { value: 'glow', icon: '⚡', label: 'Glow Neon' },
    { value: 'elevated', icon: '☁️', label: 'Elevado Pro' },
    { value: 'box', icon: '🎁', label: 'Premium' },
    { value: 'holographic', icon: '🌈', label: 'Holográfico' },
    { value: 'premium-mesh', icon: '🎨', label: 'Mesh Premium' },
    { value: 'gradient-animated', icon: '🌊', label: 'Gradiente Vivo' },
    { value: 'iridescent', icon: '💫', label: 'Iridiscente' },
  ];

  const animations: Array<{ value: NonNullable<LogoSettings['animation']>; icon: string; label: string }> = [
    { value: 'none', icon: '🚫', label: 'Sin Animación' },
    { value: 'floating', icon: '☁️', label: 'Flotante' },
    { value: 'pulse', icon: '💫', label: 'Pulso' },
  ];

  const sizes: Array<{ value: LogoSettings['size']; px: number; label: string }> = [
    { value: 'small', px: 60, label: 'Pequeño' },
    { value: 'medium', px: 90, label: 'Mediano' },
    { value: 'large', px: 120, label: 'Grande' },
  ];

  const shapes: Array<{ value: NonNullable<LogoSettings['shape']>; icon: string; label: string }> = [
    { value: 'square', icon: '⬜', label: 'Cuadrado' },
    { value: 'rounded', icon: '▢', label: 'Redondeado' },
    { value: 'circle', icon: '⚪', label: 'Círculo' },
    { value: 'squircle', icon: '◉', label: 'Squircle' },
  ];

  return (
    <div className="space-y-6">
      {/* Versión del Logo */}
      <div className="space-y-3 pb-4 border-b">
        <Label className="text-sm font-semibold">Versión del Logo</Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={(settings.logoVersion || 'transparent') === 'default' ? "default" : "outline"}
            size="sm"
            onClick={() => onChange({ ...settings, logoVersion: 'default' })}
            className="flex flex-col h-20 gap-2"
          >
            <span className="text-2xl">🏢</span>
            <span className="text-xs">Con Fondo</span>
          </Button>
          <Button
            variant={(settings.logoVersion || 'transparent') === 'transparent' ? "default" : "outline"}
            size="sm"
            onClick={() => onChange({ ...settings, logoVersion: 'transparent' })}
            className="flex flex-col h-20 gap-2"
          >
            <span className="text-2xl">✨</span>
            <span className="text-xs">Sin Fondo</span>
          </Button>
        </div>
      </div>

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
        <div className="grid grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1">
          {backgrounds.map((bg) => (
            <Button
              key={bg.value}
              variant={settings.background === bg.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ ...settings, background: bg.value })}
              className="flex flex-col h-16 gap-1"
            >
              <span className="text-xl">{bg.icon}</span>
              <span className="text-xs leading-tight">{bg.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Animación */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Animación del Logo</Label>
        <div className="grid grid-cols-3 gap-2">
          {animations.map((anim) => (
            <Button
              key={anim.value}
              variant={(settings.animation || 'none') === anim.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ ...settings, animation: anim.value })}
              className="flex flex-col h-16 gap-1"
            >
              <span className="text-xl">{anim.icon}</span>
              <span className="text-xs">{anim.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Velocidad de Flotación (solo visible si floating está activo) */}
      {settings.animation === 'floating' && (
        <div className="space-y-3 bg-accent/20 p-4 rounded-lg border border-accent/30">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-semibold">⏱️ Velocidad Flotante</Label>
            <span className="text-sm font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full">
              {settings.floatingSpeed || 5}s
            </span>
          </div>
          <Slider
            value={[settings.floatingSpeed || 5]}
            onValueChange={(value) => onChange({ ...settings, floatingSpeed: value[0] })}
            min={3}
            max={8}
            step={0.5}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>⚡ Rápido (3s)</span>
            <span>🐌 Suave (8s)</span>
          </div>
        </div>
      )}

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

      {/* Forma del Logo */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Forma del Logo</Label>
        <div className="grid grid-cols-2 gap-2">
          {shapes.map((shape) => (
            <Button
              key={shape.value}
              variant={(settings.shape || 'rounded') === shape.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ ...settings, shape: shape.value })}
              className="flex flex-col h-16 gap-1"
            >
              <span className="text-xl">{shape.icon}</span>
              <span className="text-xs">{shape.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
