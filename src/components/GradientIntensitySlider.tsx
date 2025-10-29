interface GradientIntensitySliderProps {
  intensity: number;
  onChange: (intensity: number) => void;
}

export const GradientIntensitySlider = ({ intensity, onChange }: GradientIntensitySliderProps) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold">🌗 Intensidad de Sombreado</label>
        <span className="text-xs font-bold bg-secondary/10 px-3 py-1 rounded-full">
          {intensity}%
        </span>
      </div>
      
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={intensity}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-secondary/20 rounded-lg appearance-none cursor-pointer accent-primary"
      />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>🔆 Sin sombreado</span>
        <span>🌑 Máximo contraste</span>
      </div>
    </div>
  );
};
