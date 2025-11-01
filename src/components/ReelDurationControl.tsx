import { Slider } from "@/components/ui/slider";

interface ReelDurationControlProps {
  duration: number;
  onChange: (duration: number) => void;
  photoCount: number;
}

export const ReelDurationControl = ({ duration, onChange, photoCount }: ReelDurationControlProps) => {
  const totalDuration = ((photoCount * duration) / 1000 + 2.5).toFixed(1);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">⏱️ Velocidad del Reel</h4>
        <span className="text-sm font-bold text-primary">{(duration / 1000).toFixed(1)}s por foto</span>
      </div>
      
      <Slider
        value={[duration]}
        onValueChange={(val) => onChange(val[0])}
        min={800}
        max={3000}
        step={100}
        className="w-full"
      />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>⚡ Rápido (0.8s)</span>
        <span>🐢 Lento (3s)</span>
      </div>
      
      <div className="rounded-lg bg-accent/50 p-3 mt-2">
        <p className="text-xs text-center">
          <span className="font-semibold text-foreground">Duración total:</span> {totalDuration}s ({photoCount} fotos + resumen)
        </p>
      </div>
    </div>
  );
};
