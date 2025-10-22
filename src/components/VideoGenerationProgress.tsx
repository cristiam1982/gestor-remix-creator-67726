import { VideoGenerationProgress } from "@/utils/videoGenerator";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, XCircle, Film } from "lucide-react";

interface VideoGenerationProgressProps {
  progress: VideoGenerationProgress;
}

export const VideoGenerationProgressModal = ({ progress }: VideoGenerationProgressProps) => {
  const getIcon = () => {
    switch (progress.stage) {
      case "complete":
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case "error":
        return <XCircle className="w-12 h-12 text-red-500" />;
      default:
        return <Loader2 className="w-12 h-12 text-primary animate-spin" />;
    }
  };

  const getTitle = () => {
    switch (progress.stage) {
      case "initializing":
        return "Preparando generador...";
      case "capturing":
        return "Capturando frames";
      case "encoding":
        return "Codificando video";
      case "complete":
        return "¡Video listo!";
      case "error":
        return "Error al generar video";
      default:
        return "Generando reel...";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl p-8 shadow-2xl max-w-md w-full animate-scale-in">
        <div className="flex flex-col items-center gap-4">
          {getIcon()}
          
          <div className="text-center space-y-2 w-full">
            <h3 className="text-2xl font-bold text-primary">{getTitle()}</h3>
            <p className="text-sm text-muted-foreground">{progress.message}</p>
          </div>

          {progress.stage !== "complete" && progress.stage !== "error" && (
            <div className="w-full space-y-3">
              <Progress value={progress.progress} className="h-2" />
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{Math.round(progress.progress)}%</span>
                {progress.currentFrame && progress.totalFrames && (
                  <span className="flex items-center gap-1">
                    <Film className="w-3 h-3" />
                    Frame {progress.currentFrame}/{progress.totalFrames}
                  </span>
                )}
              </div>
              
              {progress.estimatedTimeLeft && progress.estimatedTimeLeft > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  ⏱️ ~{progress.estimatedTimeLeft}s restantes
                </p>
              )}
            </div>
          )}

          {progress.stage === "complete" && (
            <p className="text-sm text-green-600 dark:text-green-400 text-center">
              Tu reel se ha descargado exitosamente
            </p>
          )}

          {progress.stage === "error" && (
            <div className="text-center space-y-2">
              <p className="text-sm text-red-600 dark:text-red-400">
                Ocurrió un error al generar el video
              </p>
              <p className="text-xs text-muted-foreground">
                Intenta con menos fotos o reduce la calidad de las imágenes
              </p>
            </div>
          )}

          {(progress.stage === "initializing" || progress.stage === "capturing") && (
            <p className="text-xs text-muted-foreground text-center">
              ⏱️ Esto tomará 10-20 segundos
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
