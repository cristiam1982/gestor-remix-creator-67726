import { LandingTemplateId, LANDING_TEMPLATES } from "../templates/landingTemplates";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LandingTemplateSelectorProps = {
  selectedTemplate: LandingTemplateId;
  onChange: (value: LandingTemplateId) => void;
};

export const LandingTemplateSelector = ({
  selectedTemplate,
  onChange,
}: LandingTemplateSelectorProps) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-1">Plantilla de Diseño</h3>
        <p className="text-sm text-muted-foreground">
          Elige el estilo visual de tu landing page
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {LANDING_TEMPLATES.map((template) => {
          const isSelected = selectedTemplate === template.id;
          
          return (
            <Card
              key={template.id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg",
                isSelected 
                  ? "border-primary border-2 bg-primary/5 shadow-md" 
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => onChange(template.id)}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">
                  {template.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-base mb-1 flex items-center gap-2">
                    {template.name}
                    {isSelected && (
                      <span className="text-primary text-xs">✓</span>
                    )}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {template.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
