import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Film, Sparkles, Download, AlertCircle } from "lucide-react";
import { VideoGenerationProgress } from "@/utils/videoGenerator";

interface VideoToGifProgressProps {
  progress: VideoGenerationProgress;
}

export const VideoToGifProgress = ({ progress }: VideoToGifProgressProps) => {
  const getStageIcon = () => {
    switch (progress.stage) {
      case "initializing":
        return <Sparkles className="w-6 h-6 animate-spin" />;
      case "capturing":
        return <Film className="w-6 h-6 animate-pulse" />;
      case "encoding":
        return <Download className="w-6 h-6 animate-bounce" />;
      case "error":
        return <AlertCircle className="w-6 h-6 text-destructive" />;
      default:
        return <Sparkles className="w-6 h-6" />;
    }
  };

  const getStageLabel = () => {
    switch (progress.stage) {
      case "initializing":
        return "Inicializando...";
      case "capturing":
        return "Extrayendo frames del video";
      case "encoding":
        return "Generando GIF animado";
      case "complete":
        return "¡GIF generado!";
      case "error":
        return "Error";
      default:
        return "Procesando...";
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="text-primary">{getStageIcon()}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{getStageLabel()}</h3>
            <p className="text-sm text-muted-foreground">{progress.message}</p>
          </div>
        </div>

        <Progress value={progress.progress} className="h-3" />

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{Math.round(progress.progress)}%</span>
          {progress.currentFrame !== undefined && progress.totalFrames && (
            <span>
              Frame {progress.currentFrame} de {progress.totalFrames}
            </span>
          )}
          {progress.estimatedTimeLeft !== undefined && progress.estimatedTimeLeft > 0 && (
            <span>~{progress.estimatedTimeLeft}s restantes</span>
          )}
        </div>

        {progress.stage === "capturing" && (
          <div className="p-3 bg-accent/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              📹 Extrayendo frames del video... Esto puede tomar 1-2 minutos.
            </p>
          </div>
        )}

        {progress.stage === "encoding" && (
          <div className="p-3 bg-accent/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              🎨 Compilando GIF con overlays... Casi listo!
            </p>
          </div>
        )}

        {progress.stage === "complete" && (
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-center font-semibold text-primary">
              ✨ ¡Tu GIF animado está listo para descargar!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
