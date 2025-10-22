import { Card } from "@/components/ui/card";
import { ContentType } from "@/types/property";
import { Download, Video, Image as ImageIcon, Smartphone } from "lucide-react";

interface DownloadInstructionsProps {
  contentType: ContentType;
}

export const DownloadInstructions = ({ contentType }: DownloadInstructionsProps) => {
  const getInstructions = () => {
    switch (contentType) {
      case "post":
        return {
          icon: ImageIcon,
          title: "Post Cuadrado (1:1)",
          instructions: [
            "Descarga la imagen usando el botón de descarga",
            "Sube a Instagram/Facebook como publicación normal",
            "Copia y pega el caption generado",
            "Usa hashtags relevantes para tu ciudad"
          ]
        };
      case "historia":
        return {
          icon: Smartphone,
          title: "Historia (9:16)",
          instructions: [
            "Descarga la imagen vertical",
            "Sube a Instagram Stories o Facebook Stories",
            "Agrega stickers o GIFs para más interacción",
            "Comparte en tu WhatsApp Status también"
          ]
        };
      case "reel-fotos":
        return {
          icon: Video,
          title: "Reel con Fotos",
          instructions: [
            "Toma screenshots de cada foto del slideshow",
            "Usa una app de edición de video (CapCut, InShot)",
            "Configura 3 segundos por foto con transiciones",
            "Agrega música de fondo trending",
            "Exporta en formato vertical 9:16"
          ]
        };
      case "reel-video":
        return {
          icon: Video,
          title: "Reel con Video",
          instructions: [
            "Edita tu video en CapCut o InShot",
            "Agrega los textos del caption como overlays",
            "Mantén la duración entre 15-20 segundos",
            "Usa música trending para mayor alcance",
            "Exporta en 1080x1920 para mejor calidad"
          ]
        };
    }
  };

  const { icon: Icon, title, instructions } = getInstructions();

  return (
    <Card className="p-6 bg-accent/50">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold text-primary mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">Guía de publicación</p>
        </div>
      </div>
      
      <ol className="space-y-2">
        {instructions.map((instruction, idx) => (
          <li key={idx} className="flex gap-3 text-sm">
            <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
              {idx + 1}
            </span>
            <span className="text-muted-foreground pt-0.5">{instruction}</span>
          </li>
        ))}
      </ol>

      {(contentType === "reel-fotos" || contentType === "reel-video") && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            <strong>💡 Apps recomendadas:</strong> CapCut (gratis, fácil de usar), InShot, Adobe Premiere Rush
          </p>
        </div>
      )}
    </Card>
  );
};
