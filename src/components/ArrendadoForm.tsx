import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrendadoData } from "@/types/arrendado";
import { PropertyType } from "@/types/property";

interface ArrendadoFormProps {
  data: Partial<ArrendadoData>;
  updateField: (field: keyof ArrendadoData, value: any) => void;
  errors?: Partial<Record<keyof ArrendadoData, string>>;
  tipo: "arrendado" | "vendido";
  format?: "historia" | "reel-fotos" | "reel-video";
}

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
    </div>
  );
};
