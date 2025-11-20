import { VisualLayers } from "@/types/property";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ReelLayersPanelProps {
  layers: VisualLayers;
  onChange: (layers: VisualLayers) => void;
  hiddenLayers?: Array<keyof VisualLayers>; // Capas a ocultar del panel
}

export const ReelLayersPanel = ({ layers, onChange, hiddenLayers = [] }: ReelLayersPanelProps) => {
  const allLayerItems: Array<{ key: keyof VisualLayers; icon: string; label: string }> = [
    { key: 'showPhoto', icon: '🖼️', label: 'Foto Principal' },
    { key: 'showPrice', icon: '💰', label: 'Precio' },
    { key: 'showIcons', icon: '🛏️', label: 'Iconografía' },
    { key: 'showAllyLogo', icon: '🎨', label: 'Logo del Aliado' },
    { key: 'showCTA', icon: '📍', label: 'Tipo y Ubicación' },
    { key: 'showBadge', icon: '🏷️', label: 'Badge Subtítulo' },
  ];

  // Filtrar capas según hiddenLayers
  const layerItems = allLayerItems.filter(item => !hiddenLayers.includes(item.key));

  const toggleLayer = (key: keyof VisualLayers) => {
    onChange({ ...layers, [key]: !layers[key] });
  };

  return (
    <div className="space-y-3">
      <div className="bg-accent/30 p-2 rounded-lg border border-border/50">
        <p className="text-[10px] text-muted-foreground">
          💡 Activa/desactiva elementos visuales del reel
        </p>
      </div>

      <div className="space-y-1.5">
        {layerItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center gap-2.5 py-1.5"
          >
            <Checkbox
              id={item.key}
              checked={layers[item.key]}
              onCheckedChange={() => toggleLayer(item.key)}
              disabled={item.key === 'showPhoto'}
            />
            <Label 
              htmlFor={item.key} 
              className="text-sm font-medium cursor-pointer flex items-center gap-2 flex-1"
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Label>
          </div>
        ))}
      </div>

      <div className="bg-accent/30 p-2 rounded-lg border border-border/50">
        <p className="text-[10px] text-muted-foreground">
          ℹ️ La foto principal no se puede desactivar
        </p>
      </div>
    </div>
  );
};
