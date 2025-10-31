import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrendadoData } from "@/types/arrendado";
import { PropertyType } from "@/types/property";

interface ArrendadoFormProps {
  data: Partial<ArrendadoData>;
  updateField: (field: keyof ArrendadoData, value: any) => void;
  errors?: Partial<Record<keyof ArrendadoData, string>>;
  tipo: "arrendado" | "vendido";
  format?: "historia" | "reel-fotos" | "reel-video";
}

// Array de iconos con buena energía
const ICONOS_ENERGIA = [
  { emoji: "✨", label: "Brillos" },
  { emoji: "🎉", label: "Celebración" },
  { emoji: "💪", label: "Fuerza" },
  { emoji: "🔥", label: "Fuego" },
  { emoji: "⚡", label: "Rapidez" },
  { emoji: "🚀", label: "Despegue" },
  { emoji: "💫", label: "Estrella" },
  { emoji: "🌟", label: "Brillo" },
  { emoji: "🎯", label: "Objetivo" },
  { emoji: "💎", label: "Valor" },
  { emoji: "🏆", label: "Éxito" },
  { emoji: "👍", label: "Aprobación" },
  { emoji: "💰", label: "Prosperidad" },
  { emoji: "🤝", label: "Confianza" },
  { emoji: "📞", label: "Llamada" },
  { emoji: "💬", label: "Mensaje" },
];

const formatPrecio = (value: string): string => {
  // Remover todo excepto números
  const numericValue = value.replace(/\D/g, '');
  
  // Formatear con separador de miles
  if (numericValue === '') return '';
  const formatted = parseInt(numericValue).toLocaleString('es-CO');
  return `$ ${formatted}`;
};

const parsePrecio = (formattedValue: string): string => {
  // Extraer solo números para guardar en el estado
  return formattedValue.replace(/\D/g, '');
};

export const ArrendadoForm = ({ data, updateField, errors, tipo }: ArrendadoFormProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  // Inicializar con mensaje por defecto
  useEffect(() => {
    if (!data.ctaCustom) {
      const defaultCTA = `💪 ¿Quieres ${tipo === "arrendado" ? "arrendar" : "vender"} tu inmueble rápido?`;
      updateField("ctaCustom", defaultCTA);
    }
  }, [tipo]);

  // Función para insertar emoji en la posición del cursor
  const insertarIcono = (emoji: string) => {
    const currentValue = data.ctaCustom || "";
    const position = inputRef.current?.selectionStart || currentValue.length;
    
    const newValue = 
      currentValue.slice(0, position) + 
      emoji + " " + 
      currentValue.slice(position);
    
    updateField("ctaCustom", newValue);
    
    // Restaurar el foco y posición del cursor
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPosition = position + emoji.length + 1;
        inputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipo">Tipo de Inmueble *</Label>
          <Select 
            value={data.tipo || ""} 
            onValueChange={(val) => updateField("tipo", val as PropertyType)}
          >
            <SelectTrigger className={errors?.tipo ? "border-destructive" : ""}>
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apartamento">Apartamento</SelectItem>
              <SelectItem value="casa">Casa</SelectItem>
              <SelectItem value="local">Local Comercial</SelectItem>
              <SelectItem value="oficina">Oficina</SelectItem>
              <SelectItem value="bodega">Bodega</SelectItem>
              <SelectItem value="lote">Lote</SelectItem>
            </SelectContent>
          </Select>
          {errors?.tipo && <p className="text-xs text-destructive mt-1">{errors.tipo}</p>}
        </div>

        <div>
          <Label htmlFor="ubicacion">Ubicación/Barrio *</Label>
          <Input
            id="ubicacion"
            value={data.ubicacion || ""}
            onChange={(e) => updateField("ubicacion", e.target.value)}
            placeholder="Ej: Ciudad Jardín, Cali"
            className={errors?.ubicacion ? "border-destructive" : ""}
          />
          {errors?.ubicacion && <p className="text-xs text-destructive mt-1">{errors.ubicacion}</p>}
        </div>

        <div>
          <Label htmlFor="diasEnMercado">Días en Mercado *</Label>
          <Input
            id="diasEnMercado"
            type="number"
            value={data.diasEnMercado ?? ""}
            onChange={(e) => updateField("diasEnMercado", e.target.value === "" ? 0 : parseInt(e.target.value))}
            placeholder="5"
            min="1"
            className={errors?.diasEnMercado ? "border-destructive" : ""}
          />
          {errors?.diasEnMercado && <p className="text-xs text-destructive mt-1">{errors.diasEnMercado}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            ¿Cuántos días tardó en {tipo === "arrendado" ? "arrendarse" : "venderse"}?
          </p>
        </div>

        <div>
          <Label htmlFor="precio">{tipo === "arrendado" ? "Canon Mensual" : "Valor de Venta"} *</Label>
          <Input
            id="precio"
            value={formatPrecio(data.precio || "")}
            onChange={(e) => {
              const parsed = parsePrecio(e.target.value);
              updateField("precio", parsed);
            }}
            placeholder="$ 2.500.000"
            className={errors?.precio ? "border-destructive" : ""}
          />
          {errors?.precio && <p className="text-xs text-destructive mt-1">{errors.precio}</p>}
          <p className="text-xs text-muted-foreground mt-1">
            Precio por el cual se {tipo === "arrendado" ? "arrendó" : "vendió"}
          </p>
        </div>
      </div>

      {/* Campo de CTA con iconos */}
      <div className="mt-4 space-y-3">
        <Label htmlFor="ctaCustom">
          Llamado a la Acción
          <span className="text-xs text-muted-foreground ml-2">
            (Edita el mensaje o agrega iconos)
          </span>
        </Label>
        
        {/* Paleta de iconos */}
        <div className="flex flex-wrap gap-1 p-3 bg-muted/30 rounded-lg border">
          <span className="text-xs text-muted-foreground mr-2 self-center">
            Agregar icono:
          </span>
          {ICONOS_ENERGIA.map(({ emoji, label }) => (
            <Button
              key={emoji}
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
              onClick={() => insertarIcono(emoji)}
              title={label}
            >
              {emoji}
            </Button>
          ))}
        </div>

        {/* Input de texto */}
        <Input
          ref={inputRef}
          id="ctaCustom"
          value={data.ctaCustom || ""}
          onChange={(e) => updateField("ctaCustom", e.target.value)}
          onSelect={(e) => setCursorPosition((e.target as HTMLInputElement).selectionStart || 0)}
          placeholder="Escribe tu llamado a la acción..."
          className="text-base"
        />
        
        <p className="text-xs text-muted-foreground">
          💡 Puedes editar el texto libremente o hacer clic en los iconos para agregarlos
        </p>
      </div>
    </div>
  );
};
