import { Layers, Grid3X3, Split } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { StoryLayout } from "@/types/property";

interface StoryLayoutSelectorProps {
  selectedLayout: StoryLayout;
  onLayoutChange: (layout: StoryLayout) => void;
  primaryColor: string;
  secondaryColor: string;
}

const layoutOptions = [
  {
    id: "overlay" as StoryLayout,
    icon: Layers,
    name: "Overlay",
    description: "Info sobre foto",
    requirements: "Mínimo 1 foto"
  },
  {
    id: "gallery" as StoryLayout,
    icon: Grid3X3,
    name: "Gallery",
    description: "Grid de 4 fotos + info",
    requirements: "Mínimo 4 fotos"
  },
  {
    id: "showcase" as StoryLayout,
    icon: Split,
    name: "Showcase",
    description: "Split vertical (próximamente)",
    requirements: "Mínimo 2 fotos",
    disabled: true
  }
];

export const StoryLayoutSelector = ({ 
  selectedLayout, 
  onLayoutChange,
  primaryColor,
  secondaryColor
}: StoryLayoutSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">📐 Plantilla de Historia</Label>
      <div className="grid grid-cols-2 gap-3">
        {layoutOptions.map((option) => {
          const Icon = option.icon;
          const isActive = selectedLayout === option.id;
          const isDisabled = option.disabled;
          
          return (
            <Card
              key={option.id}
              className={`p-4 cursor-pointer transition-all duration-200 ${
                isActive 
                  ? 'border-2 shadow-lg' 
                  : isDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:shadow-md border'
              }`}
              style={{
                borderColor: isActive ? primaryColor : undefined,
                backgroundColor: isActive ? `${primaryColor}10` : undefined
              }}
              onClick={() => !isDisabled && onLayoutChange(option.id)}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <Icon 
                  className="w-8 h-8" 
                  style={{ color: isActive ? primaryColor : secondaryColor }} 
                />
                <div>
                  <div 
                    className="font-semibold text-sm"
                    style={{ color: isActive ? primaryColor : undefined }}
                  >
                    {option.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </div>
                  {option.requirements && (
                    <div className="text-[10px] text-muted-foreground mt-1 opacity-70">
                      📸 {option.requirements}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
