import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = ({ message = "Generando..." }: LoadingStateProps) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-background rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 animate-scale-in">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-lg font-semibold text-primary">{message}</p>
        <p className="text-sm text-muted-foreground">Por favor espera un momento...</p>
      </div>
    </div>
  );
};
