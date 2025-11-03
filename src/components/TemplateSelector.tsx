import { Card } from "@/components/ui/card";
import { ReelTemplate } from "@/types/property";
import { REEL_TEMPLATES } from "@/utils/reelTemplates";
import { Check } from "lucide-react";

interface TemplateSelectorProps {
  selected: ReelTemplate;
  onChange: (template: ReelTemplate) => void;
  showTitle?: boolean;
}

export const TemplateSelector = ({ selected, onChange, showTitle = true }: TemplateSelectorProps) => {
  return (
    <div className="space-y-3">
      {showTitle && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">🎨 Estilo Visual</span>
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(REEL_TEMPLATES) as ReelTemplate[]).map((key) => {
          const template = REEL_TEMPLATES[key];
          const isSelected = selected === key;
          
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
                <div className="text-3xl">{template.icon}</div>
                <div className="font-bold text-sm">{template.name}</div>
                <div className="text-xs text-muted-foreground leading-tight">
                  {template.description}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
