import { Card } from "@/components/ui/card";
import { Check, Palette } from "lucide-react";
import { useState, useEffect } from "react";

interface GalleryBackgroundSelectorProps {
  currentColor: string;
  primaryColor: string;
  secondaryColor: string;
  onChange: (color: string) => void;
}

const BACKGROUND_PRESETS = [
  { id: 'secondary', label: 'Color Secundario', icon: '🎨', description: 'Usa el color secundario de tu marca' },
  { id: 'primary', label: 'Color Primario', icon: '✨', description: 'Usa el color primario de tu marca' },
  { id: 'black', label: 'Negro', icon: '⬛', description: 'Clásico y elegante', color: '#000000' },
  { id: 'dark-blue', label: 'Azul Oscuro', icon: '🔵', description: 'Profesional y moderno', color: '#1A1A2E' },
  { id: 'dark-green', label: 'Verde Oscuro', icon: '🟢', description: 'Natural y sofisticado', color: '#1B4332' },
  { id: 'dark-gray', label: 'Gris Oscuro', icon: '⚫', description: 'Neutral y versátil', color: '#2C2C2C' }
];

export const GalleryBackgroundSelector = ({ 
  currentColor, 
  primaryColor, 
  secondaryColor, 
  onChange 
}: GalleryBackgroundSelectorProps) => {
  const [customColor, setCustomColor] = useState(currentColor);
  
  // Sincronizar customColor cuando cambia externamente
  useEffect(() => {
    setCustomColor(currentColor);
  }, [currentColor]);

  const getPresetColor = (preset: typeof BACKGROUND_PRESETS[0]) => {
    if (preset.id === 'secondary') return secondaryColor;
    if (preset.id === 'primary') return primaryColor;
    return preset.color || '#000000';
  };

  // Verificar si el color actual es un preset o personalizado
  const isCustomColorSelected = !BACKGROUND_PRESETS.some(preset => 
    getPresetColor(preset) === currentColor
  );

  const handleCustomColorChange = (newColor: string) => {
    setCustomColor(newColor);
    onChange(newColor);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">🎨 Color de Fondo</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Este color se aplica tanto al fondo de la sección inferior como al fondo del badge superior.
      </p>
      
      <div className="grid grid-cols-3 gap-3">
        {/* Presets existentes */}
        {BACKGROUND_PRESETS.map((preset) => {
          const presetColor = getPresetColor(preset);
          const isSelected = currentColor === presetColor;
          
          return (
            <Card
              key={preset.id}
              onClick={() => onChange(presetColor)}
              className={`
                relative p-3 cursor-pointer transition-all duration-200
                hover:scale-105 hover:shadow-lg
                ${isSelected 
                  ? 'ring-2 ring-primary shadow-lg' 
                  : 'hover:ring-1 hover:ring-muted-foreground/30'
                }
              `}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="w-3 h-3" />
                </div>
              )}
              
              <div className="text-center space-y-1.5">
                <div className="text-2xl">{preset.icon}</div>
                <div className="font-bold text-xs">{preset.label}</div>
                <div 
                  className="w-full h-6 rounded border border-white/20"
                  style={{ backgroundColor: presetColor }}
                />
                <div className="text-[10px] text-muted-foreground leading-tight">
                  {preset.description}
                </div>
              </div>
            </Card>
          );
        })}

        {/* Selector de color personalizado */}
        <Card
          className={`
            relative p-3 cursor-pointer transition-all duration-200
            hover:scale-105 hover:shadow-lg
            ${isCustomColorSelected 
              ? 'ring-2 ring-primary shadow-lg' 
              : 'hover:ring-1 hover:ring-muted-foreground/30'
            }
          `}
        >
          {isCustomColorSelected && (
            <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
              <Check className="w-3 h-3" />
            </div>
          )}
          
          <label htmlFor="custom-color-picker" className="text-center space-y-1.5 block cursor-pointer">
            <div className="text-2xl">
              <Palette className="w-6 h-6 mx-auto" />
            </div>
            <div className="font-bold text-xs">Personalizado</div>
            <div className="relative">
              <input
                id="custom-color-picker"
                type="color"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="w-full h-6 rounded border border-white/20 cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              Elige cualquier color
            </div>
          </label>
        </Card>
      </div>

      {/* Mostrar el valor HEX actual */}
      <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded px-3 py-2">
        <span>Color actual:</span>
        <span className="font-mono font-semibold">{currentColor.toUpperCase()}</span>
      </div>
    </div>
  );
};
