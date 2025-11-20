import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export interface FooterCustomization {
  customPhone?: string;
  customHashtag?: string;
  showElGestorLogo: boolean;
  customTypeText?: string;
  customLocationText?: string;
}

interface MultiVideoFooterControlsProps {
  customization: FooterCustomization;
  onChange: (customization: FooterCustomization) => void;
}

export const MultiVideoFooterControls = ({
  customization,
  onChange
}: MultiVideoFooterControlsProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="custom-type" className="text-[11px] font-medium">
          Texto Tipo de Inmueble (Personalizado)
        </Label>
        <Input
          id="custom-type"
          placeholder="Ej: Apartamento de ensueño"
          value={customization.customTypeText || ''}
          onChange={(e) => onChange({ ...customization, customTypeText: e.target.value })}
          className="h-9 text-sm"
        />
        <p className="text-[10px] text-muted-foreground">
          Deja vacío para usar el tipo automático
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-location" className="text-[11px] font-medium">
          Texto Ubicación (Personalizado)
        </Label>
        <Input
          id="custom-location"
          placeholder="Ej: Zona premium de Cali"
          value={customization.customLocationText || ''}
          onChange={(e) => onChange({ ...customization, customLocationText: e.target.value })}
          className="h-9 text-sm"
        />
        <p className="text-[10px] text-muted-foreground">
          Deja vacío para usar la ubicación automática
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-phone" className="text-[11px] font-medium">
          Teléfono Personalizado (Opcional)
        </Label>
        <Input
          id="custom-phone"
          placeholder="+57 300 123 4567"
          value={customization.customPhone || ''}
          onChange={(e) => onChange({ ...customization, customPhone: e.target.value })}
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-hashtag" className="text-[11px] font-medium">
          Hashtag Personalizado (Opcional)
        </Label>
        <Input
          id="custom-hashtag"
          placeholder="#TuHashtag"
          value={customization.customHashtag || ''}
          onChange={(e) => onChange({ ...customization, customHashtag: e.target.value })}
          className="h-9 text-sm"
        />
      </div>

      <div className="flex items-center gap-2.5 pt-2">
        <Checkbox
          id="show-elgestor-logo"
          checked={customization.showElGestorLogo}
          onCheckedChange={(checked) => onChange({ ...customization, showElGestorLogo: !!checked })}
        />
        <Label htmlFor="show-elgestor-logo" className="text-[11px] font-medium cursor-pointer">
          Mostrar logo "El Gestor" (branding)
        </Label>
      </div>
    </div>
  );
};
