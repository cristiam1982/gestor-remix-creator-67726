import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type BackgroundStyle = 'solid' | 'blur' | 'mosaic';

interface SummaryBackgroundSelectorProps {
  selected: BackgroundStyle;
  onChange: (style: BackgroundStyle) => void;
  solidColor?: string;
  onColorChange?: (color: string) => void;
}

const BACKGROUND_OPTIONS: Record<BackgroundStyle, { label: string; icon: string; description: string }> = {
  solid: {
    label: 'Color Sólido',
    icon: '🎨',
    description: 'Fondo limpio con colores del aliado'
  },
  blur: {
    label: 'Foto Difuminada',
    icon: '🌫️',
    description: 'Última foto con blur'
  },
  mosaic: {
    label: 'Mosaico',
    icon: '🖼️',
    description: 'Grid con todas las fotos'
  }
};

export const SummaryBackgroundSelector = ({ 
  selected, 
  onChange, 
  solidColor = '#00A5BD',
  onColorChange 
}: SummaryBackgroundSelectorProps) => {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold">🎬 Fondo del Slide Final</label>
      <div className="grid grid-cols-3 gap-3">
        {(Object.entries(BACKGROUND_OPTIONS) as [BackgroundStyle, typeof BACKGROUND_OPTIONS[BackgroundStyle]][]).map(([key, option]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all hover:scale-105 ${
              selected === key ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onChange(key)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">{option.icon}</div>
              <h4 className="font-semibold text-xs mb-1">{option.label}</h4>
              <p className="text-xs text-muted-foreground">{option.description}</p>
              {selected === key && <div className="mt-2 text-primary">✓</div>}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Selector de color cuando está en modo sólido */}
      {selected === 'solid' && onColorChange && (
        <div className="mt-4 p-4 bg-accent/50 rounded-lg border border-border">
          <Label className="text-sm font-semibold mb-2 block">Color de Fondo</Label>
          <div className="flex gap-3 items-center">
            <Input
              type="color"
              value={solidColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="h-12 w-20 cursor-pointer"
            />
            <div className="flex-1">
              <p className="text-sm font-mono bg-background px-3 py-2 rounded border">
                {solidColor.toUpperCase()}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            💡 Recomendado: Usa el color primario de tu marca
          </p>
        </div>
      )}
    </div>
  );
};
