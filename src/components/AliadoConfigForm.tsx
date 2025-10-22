import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AliadoConfig } from "@/types/property";
import { Settings } from "lucide-react";
import { validateAliadoConfig } from "@/utils/formValidation";
import { useToast } from "@/hooks/use-toast";

interface AliadoConfigFormProps {
  onSave: (config: AliadoConfig) => void;
  initialConfig?: AliadoConfig;
}

export const AliadoConfigForm = ({ onSave, initialConfig }: AliadoConfigFormProps) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<AliadoConfig>(
    initialConfig || {
      nombre: "",
      logo: "",
      color: "#8BC53F",
      whatsapp: "",
      ciudad: "",
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(!initialConfig);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateAliadoConfig(config);
    
    if (!validation.success) {
      setErrors(validation.errors);
      toast({
        title: "❌ Errores en el formulario",
        description: "Por favor corrige los campos marcados en rojo.",
        variant: "destructive",
      });
      return;
    }
    
    setErrors({});
    localStorage.setItem("aliado-config", JSON.stringify(config));
    onSave(config);
    setShowForm(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig({ ...config, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!showForm && initialConfig) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowForm(true)}
          className="shadow-lg"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="w-full max-w-md p-6 animate-scale-in">
        <h2 className="text-2xl font-bold mb-6 text-primary">
          Configuración de Identidad
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre del Aliado</Label>
            <Input
              id="nombre"
              value={config.nombre}
              onChange={(e) => setConfig({ ...config, nombre: e.target.value })}
              placeholder="Ej: Inmobiliaria Éxito"
              required
              className={errors.nombre ? "border-destructive" : ""}
            />
            {errors.nombre && <p className="text-xs text-destructive mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <Label htmlFor="logo">Logo (opcional)</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="cursor-pointer"
              />
              {config.logo && (
                <img src={config.logo} alt="Logo preview" className="w-12 h-12 object-contain" />
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="color">Color Corporativo</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={config.color}
                onChange={(e) => setConfig({ ...config, color: e.target.value })}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                value={config.color}
                onChange={(e) => setConfig({ ...config, color: e.target.value })}
                placeholder="#8BC53F"
                className={errors.color ? "border-destructive" : ""}
              />
            </div>
            {errors.color && <p className="text-xs text-destructive mt-1">{errors.color}</p>}
          </div>

          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={config.whatsapp}
              onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })}
              placeholder="3001234567"
              required
              className={errors.whatsapp ? "border-destructive" : ""}
            />
            {errors.whatsapp && <p className="text-xs text-destructive mt-1">{errors.whatsapp}</p>}
          </div>

          <div>
            <Label htmlFor="ciudad">Ciudad Principal</Label>
            <Input
              id="ciudad"
              value={config.ciudad}
              onChange={(e) => setConfig({ ...config, ciudad: e.target.value })}
              placeholder="Ej: Bogotá"
              required
              className={errors.ciudad ? "border-destructive" : ""}
            />
            {errors.ciudad && <p className="text-xs text-destructive mt-1">{errors.ciudad}</p>}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1" variant="hero">
              Guardar Identidad
            </Button>
            {initialConfig && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
};
