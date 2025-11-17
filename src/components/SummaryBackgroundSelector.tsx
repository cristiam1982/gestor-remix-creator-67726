import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type BackgroundStyle = 'solid' | 'blur' | 'mosaic';

interface SummaryBackgroundSelectorProps {
  selected: BackgroundStyle;
  onChange: (style: BackgroundStyle) => void;
  solidColor?: string;
  onColorChange?: (color: string) => void;
  customPhone?: string;
  onPhoneChange?: (phone: string) => void;
  customHashtag?: string;
  onHashtagChange?: (hashtag: string) => void;
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
  onColorChange,
  customPhone,
  onPhoneChange,
  customHashtag,
  onHashtagChange
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
            <CardContent className="p-3 text-center">
              <div className="text-2xl mb-1">{option.icon}</div>
              <h4 className="font-semibold text-[10px] mb-0.5">{option.label}</h4>
              <p className="text-[9px] text-muted-foreground leading-tight">{option.description}</p>
              {selected === key && <div className="mt-1 text-primary text-sm">✓</div>}
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

      {/* Campo para número de WhatsApp personalizado */}
      {onPhoneChange && (
        <div className="mt-4 p-4 bg-accent/50 rounded-lg border border-border">
          <Label className="text-sm font-semibold mb-2 block">📱 Número de WhatsApp (Slide Final)</Label>
          <Input
            type="text"
            value={customPhone || ''}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="+57 300 123 4567"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground mt-2">
            💡 Dejar vacío para usar el número del aliado por defecto
          </p>
        </div>
      )}

      {/* Campo para hashtag personalizado */}
      {onHashtagChange && (
        <div className="mt-4 p-4 bg-accent/50 rounded-lg border border-border">
          <Label className="text-sm font-semibold mb-2 block">🏷️ Hashtag Personalizado (Slide Final)</Label>
          <Input
            type="text"
            value={customHashtag || ''}
            onChange={(e) => onHashtagChange(e.target.value)}
            placeholder="#TuNuevoHogarEnCali 🏡"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground mt-2">
            💡 Dejar vacío para usar el hashtag por defecto basado en la ciudad
          </p>
        </div>
      )}
    </div>
  );
};
