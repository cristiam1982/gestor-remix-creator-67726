import { Card } from "@/components/ui/card";
import { CheckCircle, Image } from "lucide-react";

export const StoryLayoutRequirements = () => {
  return (
    <Card className="p-4 bg-muted/30">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Image className="w-4 h-4" />
        Requisitos por plantilla
      </h4>
      <div className="space-y-2 text-xs">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">Overlay:</span> Mínimo 1 foto · Información superpuesta · Ideal para destacar una sola imagen impactante
          </div>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">Gallery:</span> Mínimo 3 fotos · Grid + sección info · Ideal para mostrar múltiples ángulos del inmueble
          </div>
        </div>
      </div>
    </Card>
  );
};
