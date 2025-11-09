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
    { value: 'none', icon: '✨', label: 'Flotante' },
    { value: 'frosted', icon: '💎', label: 'Glass Pro' },
    { value: 'glow', icon: '⚡', label: 'Glow Neon' },
    { value: 'elevated', icon: '☁️', label: 'Elevado Pro' },
  ];

  const animations: Array<{ value: NonNullable<LogoSettings['animation']>; icon: string; label: string }> = [
    { value: 'none', icon: '🚫', label: 'Sin Animación' },
    { value: 'floating', icon: '☁️', label: 'Flotante' },
    { value: 'pulse', icon: '💫', label: 'Pulso' },
  ];

  const sizes: Array<{ value: LogoSettings['size']; px: number; label: string }> = [
    { value: 'small', px: 80, label: 'Pequeño' },
    { value: 'medium', px: 90, label: 'Mediano' },
    { value: 'large', px: 100, label: 'Grande' },
  ];

  const shapes: Array<{ value: NonNullable<LogoSettings['shape']>; icon: string; label: string }> = [
    { value: 'square', icon: '⬜', label: 'Cuadrado' },
    { value: 'rounded', icon: '▢', label: 'Redondeado' },
    { value: 'circle', icon: '⚪', label: 'Círculo' },
    { value: 'squircle', icon: '◉', label: 'Squircle' },
  ];

  const entranceAnimations: Array<{ value: NonNullable<LogoSettings['entranceAnimation']>; icon: string; label: string }> = [
    { value: 'none', icon: '⏸️', label: 'Sin Entrada' },
    { value: 'fade-in', icon: '🌅', label: 'Fade In' },
    { value: 'zoom-in', icon: '🔍', label: 'Zoom In' },
    { value: 'slide-in', icon: '📥', label: 'Slide In' },
    { value: 'bounce-in', icon: '🎾', label: 'Bounce In' },
    { value: 'spin-in', icon: '🌀', label: 'Spin In' },
    { value: 'elastic', icon: '🎪', label: 'Elastic' },
  ];

  return (
    <div className="space-y-6">
      {/* Posición */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Posición del Logo</Label>
        <div className="grid grid-cols-2 gap-2">
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

      {/* Animación de Entrada */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">🎬 Entrada del Logo</Label>
        <div className="grid grid-cols-2 gap-2">
          {entranceAnimations.map((entrance) => (
            <Button
              key={entrance.value}
              variant={(settings.entranceAnimation || 'none') === entrance.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ ...settings, entranceAnimation: entrance.value })}
              className="flex flex-col h-16 gap-1"
            >
              <span className="text-xl">{entrance.icon}</span>
              <span className="text-xs leading-tight">{entrance.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Duración de Entrada (solo visible si hay animación de entrada) */}
      {settings.entranceAnimation && settings.entranceAnimation !== 'none' && (
        <div className="space-y-3 bg-secondary/20 p-4 rounded-lg border border-secondary/30">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-semibold">⏱️ Duración de Entrada</Label>
            <span className="text-sm font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full">
              {settings.entranceDuration || 0.8}s
            </span>
          </div>
          <Slider
            value={[settings.entranceDuration || 0.8]}
            onValueChange={(value) => onChange({ ...settings, entranceDuration: value[0] })}
            min={0.6}
            max={1.2}
            step={0.1}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>⚡ Rápido (0.6s)</span>
            <span>🐌 Suave (1.2s)</span>
          </div>
        </div>
      )}
    </div>
  );
};
