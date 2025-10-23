import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Film, Sparkles, CheckCircle2 } from "lucide-react";

interface VideoRecordingProgressProps {
  currentTime: number;
  duration: number;
  stage: "recording" | "processing" | "complete";
}

export const VideoRecordingProgress = ({ 
  currentTime, 
  duration, 
  stage 
}: VideoRecordingProgressProps) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  const getStageIcon = () => {
    switch (stage) {
      case "recording":
        return <Film className="w-6 h-6 animate-pulse text-red-500" />;
      case "processing":
        return <Sparkles className="w-6 h-6 animate-spin text-primary" />;
      case "complete":
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      default:
        return <Film className="w-6 h-6" />;
    }
  };

  const getStageLabel = () => {
    switch (stage) {
      case "recording":
        return "🔴 Grabando video con overlays...";
      case "processing":
        return "⚙️ Procesando video final...";
      case "complete":
        return "✅ ¡Video listo!";
      default:
        return "Preparando...";
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {getStageIcon()}
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{getStageLabel()}</h3>
            <p className="text-sm text-muted-foreground">
              {stage === "recording" && `${Math.round(currentTime)}s / ${Math.round(duration)}s`}
              {stage === "processing" && "Generando archivo descargable..."}
              {stage === "complete" && "Tu video está listo para descargar"}
            </p>
          </div>
        </div>

        <Progress value={progress} className="h-3" />

        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{Math.round(progress)}%</span>
          {stage === "recording" && (
            <span>~{Math.round(duration - currentTime)}s restantes</span>
          )}
        </div>

        {stage === "recording" && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-center">
              🎬 Grabando en tiempo real. El proceso es automático y continúa aunque cierres esta ventana.
            </p>
          </div>
        )}

        {stage === "complete" && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-center font-semibold text-green-700 dark:text-green-400">
              ✨ Video procesado en {Math.round(duration)} segundos
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
