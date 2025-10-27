import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle } from "lucide-react";

interface MultiVideoProcessingModalProps {
  isOpen: boolean;
  progress: number;
  stage: string;
  isComplete: boolean;
}

export const MultiVideoProcessingModal = ({
  isOpen,
  progress,
  stage,
  isComplete,
}: MultiVideoProcessingModalProps) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md"  onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                ¡Video listo!
              </>
            ) : (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                Generando tu reel multi-video
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{stage}</span>
              <span className="font-semibold">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {!isComplete && (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>⏳ Este proceso puede tomar varios minutos dependiendo del número de videos.</p>
              <p>💡 Por favor no cierres esta ventana.</p>
            </div>
          )}

          {isComplete && (
            <div className="text-center py-4">
              <p className="text-sm text-green-600 font-medium">
                ✨ Tu video está listo para descargar
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
