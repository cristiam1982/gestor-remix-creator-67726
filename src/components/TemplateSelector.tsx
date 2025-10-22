import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TemplateTheme, TEMPLATE_THEMES } from "@/types/templates";
import { Check, Home, Building2, Crown } from "lucide-react";

interface TemplateSelectorProps {
  selectedTheme: TemplateTheme;
  onThemeChange: (theme: TemplateTheme) => void;
}

const themeIcons = {
  residencial: Home,
  comercial: Building2,
  premium: Crown,
};

export const TemplateSelector = ({ selectedTheme, onThemeChange }: TemplateSelectorProps) => {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-primary mb-2">Estilo de Plantilla</h3>
        <p className="text-sm text-muted-foreground">
          Elige el estilo que mejor represente tu inmueble
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(TEMPLATE_THEMES) as TemplateTheme[]).map((themeKey) => {
          const template = TEMPLATE_THEMES[themeKey];
          const Icon = themeIcons[themeKey];
          const isSelected = selectedTheme === themeKey;

          return (
            <button
              key={themeKey}
              onClick={() => onThemeChange(themeKey)}
              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg scale-105"
                  : "border-border hover:border-primary/50 hover:shadow-md"
              }`}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-5 h-5" />
                </div>
              )}

              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`p-2 rounded-lg ${
                    isSelected ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isSelected ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <h4 className={`font-bold ${isSelected ? "text-primary" : ""}`}>
                  {template.name}
                </h4>
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                {template.description}
              </p>

              {/* Color preview */}
              <div className="flex gap-1">
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: template.colors.primary }}
                />
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: template.colors.secondary }}
                />
                <div
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: template.colors.accent }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-accent/50 rounded-lg">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Tip:</strong> La plantilla {TEMPLATE_THEMES[selectedTheme].name.toLowerCase()} 
          usa colores y estilos optimizados para destacar en redes sociales.
        </p>
      </div>
    </Card>
  );
};
