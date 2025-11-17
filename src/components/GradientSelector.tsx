import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";

type GradientDirection = 'top' | 'bottom' | 'both' | 'none';

interface GradientSelectorProps {
  direction: GradientDirection;
  onChange: (direction: GradientDirection) => void;
}

const GRADIENT_OPTIONS: Record<GradientDirection, { label: string; icon: string; description: string }> = {
  none: {
    label: "Sin Sombreado",
    icon: "🔆",
    description: "Foto limpia y luminosa"
  },
  top: {
    label: "Solo Arriba",
    icon: "🔝",
    description: "Protege logos y precio"
  },
  bottom: {
    label: "Solo Abajo",
    icon: "🔻",
    description: "Protege texto inferior"
  },
  both: {
    label: "Ambos Lados",
    icon: "⬍",
    description: "Máximo contraste"
  }
};

export const GradientSelector = ({ direction, onChange }: GradientSelectorProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">🎨 Sombreado de Foto</span>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {(Object.keys(GRADIENT_OPTIONS) as GradientDirection[]).map((key) => {
          const option = GRADIENT_OPTIONS[key];
          const isSelected = direction === key;
          
          return (
            <Card
              key={key}
              onClick={() => onChange(key)}
              className={`
                relative p-4 cursor-pointer transition-all duration-200
                hover:scale-105 hover:shadow-lg
                ${isSelected 
                  ? 'ring-2 ring-primary shadow-lg' 
                  : 'hover:ring-1 hover:ring-muted-foreground/30'
                }
              `}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              )}
              
              <div className="text-center space-y-2">
                <div className="text-3xl">{option.icon}</div>
                <div className="font-bold text-sm">{option.label}</div>
                <div className="text-xs text-muted-foreground leading-tight">
                  {option.description}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
