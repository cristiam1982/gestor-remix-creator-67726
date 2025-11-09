import { TextCompositionSettings } from "@/types/property";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface ReelTextCompositionControlsProps {
  settings: TextCompositionSettings;
  onChange: (settings: TextCompositionSettings) => void;
}

export const ReelTextCompositionControls = ({ settings, onChange }: ReelTextCompositionControlsProps) => {
  const badgeStyles: Array<{ value: TextCompositionSettings['badgeStyle']; icon: string; label: string }> = [
    { value: 'circular', icon: '⭕', label: 'Circular' },
    { value: 'rectangular', icon: '▭', label: 'Rectangular' },
    { value: 'rounded', icon: '▢', label: 'Redondeado' },
    { value: 'none', icon: '🚫', label: 'Sin Badge' },
  ];

  const spacings: Array<{ value: TextCompositionSettings['verticalSpacing']; label: string }> = [
    { value: 'compact', label: 'Compacto' },
    { value: 'normal', label: 'Normal' },
    { value: 'spacious', label: 'Espacioso' },
  ];

  return (
    <div className="space-y-6">
      {/* Tamaño de Texto Principal */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-semibold">Tamaño de Texto Principal</Label>
          <span className="text-sm font-bold bg-accent px-3 py-1 rounded-full">
            {settings.typographyScale > 0 ? '+' : ''}{settings.typographyScale}%
          </span>
        </div>
        <Slider
          value={[settings.typographyScale]}
          onValueChange={(value) => onChange({ ...settings, typographyScale: value[0] })}
          min={-20}
          max={40}
          step={10}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Más Pequeño</span>
          <span>Más Grande</span>
        </div>
      </div>

      {/* Tamaño del Badge */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-semibold">Tamaño del Badge</Label>
          <span className="text-sm font-bold bg-accent px-3 py-1 rounded-full">
            {settings.badgeScale > 0 ? '+' : ''}{settings.badgeScale}%
          </span>
        </div>
        <Slider
          value={[settings.badgeScale]}
          onValueChange={(value) => onChange({ ...settings, badgeScale: value[0] })}
          min={-20}
          max={40}
          step={10}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Más Pequeño</span>
          <span>Más Grande</span>
        </div>
      </div>

      {/* Estilo del Badge */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Estilo del Badge</Label>
        <div className="grid grid-cols-2 gap-2">
          {badgeStyles.map((style) => (
            <Button
              key={style.value}
              variant={settings.badgeStyle === style.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ ...settings, badgeStyle: style.value })}
              className="flex flex-col h-16 gap-1"
            >
              <span className="text-xl">{style.icon}</span>
              <span className="text-xs">{style.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Espaciado Vertical */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Espaciado Vertical</Label>
        <div className="grid grid-cols-3 gap-2">
          {spacings.map((spacing) => (
            <Button
              key={spacing.value}
              variant={settings.verticalSpacing === spacing.value ? "default" : "outline"}
              size="sm"
              onClick={() => onChange({ ...settings, verticalSpacing: spacing.value })}
            >
              {spacing.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
