import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface GalleryBadgeControlsProps {
  badgeText: string;
  onChange: (text: string) => void;
  defaultText?: string;
}

export const GalleryBadgeControls = ({ 
  badgeText, 
  onChange,
  defaultText = "OFERTA LIMITADA"
}: GalleryBadgeControlsProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Texto del Badge</Label>
        <button
          onClick={() => onChange(defaultText)}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Restaurar
        </button>
      </div>
      
      <Input
        type="text"
        value={badgeText}
        onChange={(e) => onChange(e.target.value)}
        placeholder={defaultText}
        maxLength={25}
        className="text-sm"
      />
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Aparece en la esquina superior derecha</span>
        <span>{badgeText.length}/25</span>
      </div>
      
      <div className="text-xs text-muted-foreground bg-muted/30 rounded p-3">
        💡 <strong>Sugerencias:</strong> "OFERTA LIMITADA", "NUEVO", "OPORTUNIDAD", "PRECIO ESPECIAL", "DISPONIBLE YA"
      </div>
    </div>
  );
};
