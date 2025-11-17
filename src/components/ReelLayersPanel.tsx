import { VisualLayers } from "@/types/property";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ReelLayersPanelProps {
  layers: VisualLayers;
  onChange: (layers: VisualLayers) => void;
  hiddenLayers?: Array<keyof VisualLayers>; // Capas a ocultar del panel
}

export const ReelLayersPanel = ({ layers, onChange, hiddenLayers = [] }: ReelLayersPanelProps) => {
  const allLayerItems: Array<{ key: keyof VisualLayers; icon: string; label: string; description: string }> = [
    { key: 'showPhoto', icon: '🖼️', label: 'Foto Principal', description: 'Imagen de fondo' },
    { key: 'showPrice', icon: '💰', label: 'Precio', description: 'Canon o valor de venta' },
    { key: 'showIcons', icon: '🛏️', label: 'Iconografía', description: 'Íconos de características' },
    { key: 'showAllyLogo', icon: '🎨', label: 'Logo del Aliado', description: 'Tu marca personal' },
    { key: 'showCTA', icon: '📣', label: 'Call to Action', description: 'Llamado a la acción' },
    { key: 'showBadge', icon: '🏷️', label: 'Badge Subtítulo', description: 'Información adicional' },
  ];

  // Filtrar capas según hiddenLayers
  const layerItems = allLayerItems.filter(item => !hiddenLayers.includes(item.key));

  const toggleLayer = (key: keyof VisualLayers) => {
    onChange({ ...layers, [key]: !layers[key] });
  };

  return (
    <div className="space-y-3">
      <div className="bg-accent/30 p-2.5 rounded-lg border border-border/50">
        <p className="text-xs text-muted-foreground">
          💡 Controla qué elementos aparecen en tu reel. Desactiva capas para crear composiciones minimalistas.
        </p>
      </div>

      <div className="space-y-2">
        {layerItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-accent/20 transition-colors"
          >
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1">
                <Label htmlFor={item.key} className="text-sm font-semibold cursor-pointer">
                  {item.label}
                </Label>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <Switch
              id={item.key}
              checked={layers[item.key]}
              onCheckedChange={() => toggleLayer(item.key)}
              disabled={item.key === 'showPhoto'} // La foto siempre debe estar visible
            />
          </div>
        ))}
      </div>

      <div className="bg-accent/30 p-2.5 rounded-lg border border-border/50">
        <p className="text-xs text-muted-foreground">
          ℹ️ La foto principal no se puede desactivar. Es el elemento base del reel.
        </p>
      </div>
    </div>
  );
};
