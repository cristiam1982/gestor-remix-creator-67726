import { useState } from "react";
import { PropertyType, PropertyData } from "@/types/property";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Building2, Home, Store, Briefcase, Warehouse, Trees } from "lucide-react";

interface PropertyFormProps {
  onDataChange: (data: Partial<PropertyData>) => void;
  data: Partial<PropertyData>;
  errors?: Record<string, string>;
}

const propertyTypeIcons = {
  apartamento: Building2,
  casa: Home,
  local: Store,
  oficina: Briefcase,
  bodega: Warehouse,
  lote: Trees,
};

export const PropertyForm = ({ onDataChange, data, errors }: PropertyFormProps) => {
  const updateField = (field: string, value: any) => {
    onDataChange({ ...data, [field]: value });
  };

  const renderConditionalFields = () => {
    if (!data.tipo) return null;

    const isResidencial = data.tipo === "apartamento" || data.tipo === "casa";
    const isComercial = data.tipo === "local" || data.tipo === "oficina" || data.tipo === "bodega";
    const isLote = data.tipo === "lote";

    return (
      <div className="space-y-4 animate-fade-in">
        {!isLote && (
          <>
            <div>
              <Label htmlFor="canon">Canon Mensual (COP)</Label>
              <Input
                id="canon"
                type="text"
                value={data.canon || ""}
                onChange={(e) => updateField("canon", e.target.value)}
                placeholder="2.500.000"
                className={errors?.canon ? "border-destructive" : ""}
              />
              {errors?.canon && <p className="text-xs text-destructive mt-1">{errors.canon}</p>}
            </div>

            <div>
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                value={data.ubicacion || ""}
                onChange={(e) => updateField("ubicacion", e.target.value)}
                placeholder="Ej: Chapinero, Calle 63 #10-20"
                className={errors?.ubicacion ? "border-destructive" : ""}
              />
              {errors?.ubicacion && <p className="text-xs text-destructive mt-1">{errors.ubicacion}</p>}
            </div>
          </>
        )}

        {isResidencial && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="habitaciones">Habitaciones</Label>
                <Input
                  id="habitaciones"
                  type="number"
                  value={data.habitaciones || ""}
                  onChange={(e) => updateField("habitaciones", e.target.value === "" ? undefined : parseInt(e.target.value))}
                  placeholder="3"
                  className={errors?.habitaciones ? "border-destructive" : ""}
                />
                {errors?.habitaciones && <p className="text-xs text-destructive mt-1">{errors.habitaciones}</p>}
              </div>
              <div>
                <Label htmlFor="banos">Baños</Label>
                <Input
                  id="banos"
                  type="number"
                  value={data.banos || ""}
                  onChange={(e) => updateField("banos", e.target.value === "" ? undefined : parseInt(e.target.value))}
                  placeholder="2"
                  className={errors?.banos ? "border-destructive" : ""}
                />
                {errors?.banos && <p className="text-xs text-destructive mt-1">{errors.banos}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parqueaderos">Parqueaderos</Label>
                <Input
                  id="parqueaderos"
                  type="number"
                  value={data.parqueaderos ?? ""}
                  onChange={(e) => updateField("parqueaderos", e.target.value === "" ? 0 : parseInt(e.target.value))}
                  placeholder="1"
                  className={errors?.parqueaderos ? "border-destructive" : ""}
                />
                {errors?.parqueaderos && <p className="text-xs text-destructive mt-1">{errors.parqueaderos}</p>}
              </div>
              <div>
                <Label htmlFor="estrato">Estrato</Label>
                <Input
                  id="estrato"
                  type="number"
                  value={data.estrato || ""}
                  onChange={(e) => updateField("estrato", e.target.value === "" ? undefined : parseInt(e.target.value))}
                  placeholder="3"
                  min="1"
                  max="6"
                  className={errors?.estrato ? "border-destructive" : ""}
                />
                {errors?.estrato && <p className="text-xs text-destructive mt-1">{errors.estrato}</p>}
              </div>
            </div>
          </>
        )}

        {isComercial && (
          <>
            {/* Campos comunes para oficinas */}
            {data.tipo === "oficina" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="banos">Baños</Label>
                  <Input
                    id="banos"
                    type="number"
                    value={data.banos || ""}
                    onChange={(e) => updateField("banos", parseInt(e.target.value))}
                    placeholder="2"
                  />
                </div>
                <div>
                  <Label htmlFor="parqueaderos">Parqueaderos</Label>
                  <Input
                    id="parqueaderos"
                    type="number"
                    value={data.parqueaderos || ""}
                    onChange={(e) => updateField("parqueaderos", parseInt(e.target.value))}
                    placeholder="1"
                  />
                </div>
              </div>
            )}

            {data.tipo === "oficina" && (
              <div>
                <Label htmlFor="piso">Piso</Label>
                <Input
                  id="piso"
                  type="number"
                  value={data.piso || ""}
                  onChange={(e) => updateField("piso", parseInt(e.target.value))}
                  placeholder="5"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="trafico">Nivel de Tráfico</Label>
              <Select value={data.trafico || ""} onValueChange={(val) => updateField("trafico", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bajo">Bajo</SelectItem>
                  <SelectItem value="medio">Medio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {data.tipo === "bodega" && (
              <div>
                <Label htmlFor="alturaLibre">Altura Libre (metros)</Label>
                <Input
                  id="alturaLibre"
                  value={data.alturaLibre || ""}
                  onChange={(e) => updateField("alturaLibre", e.target.value)}
                  placeholder="4.5"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="servicios"
                checked={data.servicios || false}
                onCheckedChange={(checked) => updateField("servicios", checked)}
              />
              <Label htmlFor="servicios" className="cursor-pointer">
                Incluye servicios
              </Label>
            </div>

            {data.tipo === "oficina" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="amoblado"
                  checked={data.amoblado || false}
                  onCheckedChange={(checked) => updateField("amoblado", checked)}
                />
                <Label htmlFor="amoblado" className="cursor-pointer">
                  Amoblado
                </Label>
              </div>
            )}

            {data.tipo === "local" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vitrina"
                  checked={data.vitrina || false}
                  onCheckedChange={(checked) => updateField("vitrina", checked)}
                />
                <Label htmlFor="vitrina" className="cursor-pointer">
                  Tiene vitrina
                </Label>
              </div>
            )}
          </>
        )}

        {isLote && (
          <>
            <div>
              <Label htmlFor="valorVenta">Valor de Venta o Canon (COP)</Label>
              <Input
                id="valorVenta"
                value={data.valorVenta || ""}
                onChange={(e) => updateField("valorVenta", e.target.value)}
                placeholder="350.000.000"
                className={errors?.valorVenta ? "border-destructive" : ""}
              />
              {errors?.valorVenta && <p className="text-xs text-destructive mt-1">{errors.valorVenta}</p>}
            </div>

            <div>
              <Label htmlFor="uso">Uso del Lote</Label>
              <Select value={data.uso || ""} onValueChange={(val) => updateField("uso", val as "residencial" | "comercial")}>
                <SelectTrigger className={errors?.uso ? "border-destructive" : ""}>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residencial">Residencial</SelectItem>
                  <SelectItem value="comercial">Comercial</SelectItem>
                </SelectContent>
              </Select>
              {errors?.uso && <p className="text-xs text-destructive mt-1">{errors.uso}</p>}
            </div>

            <div>
              <Label htmlFor="ubicacion">Ubicación</Label>
              <Input
                id="ubicacion"
                value={data.ubicacion || ""}
                onChange={(e) => updateField("ubicacion", e.target.value)}
                placeholder="Ej: Chia, Vereda La Balsa"
                className={errors?.ubicacion ? "border-destructive" : ""}
              />
              {errors?.ubicacion && <p className="text-xs text-destructive mt-1">{errors.ubicacion}</p>}
            </div>
          </>
        )}

        <div>
          <Label htmlFor="area">Área (m²)</Label>
          <Input
            id="area"
            type="number"
            value={data.area || ""}
            onChange={(e) => updateField("area", e.target.value === "" ? undefined : parseInt(e.target.value))}
            placeholder="80"
            className={errors?.area ? "border-destructive" : ""}
          />
          {errors?.area && <p className="text-xs text-destructive mt-1">{errors.area}</p>}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2 text-primary">Información del Inmueble</h3>
        <p className="text-sm text-muted-foreground mb-4">
          💡 Completa los campos para generar tu publicación profesional
        </p>
        
        <div className="space-y-4">
          <div>
            <Label>Tipo de Inmueble</Label>
            <p className="text-xs text-muted-foreground mb-2">Selecciona el tipo que mejor describe tu propiedad</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {(Object.keys(propertyTypeIcons) as PropertyType[]).map((tipo) => {
                const Icon = propertyTypeIcons[tipo];
                const isSelected = data.tipo === tipo;
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => updateField("tipo", tipo)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-secondary bg-secondary/10 shadow-md"
                        : "border-border hover:border-secondary/50"
                    }`}
                  >
                    <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? "text-secondary" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium capitalize ${isSelected ? "text-secondary" : ""}`}>
                      {tipo}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {renderConditionalFields()}
        </div>
      </div>
    </Card>
  );
};
