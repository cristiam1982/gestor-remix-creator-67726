import { z } from "zod";
import { PropertyType } from "@/types/property";

export const aliadoConfigSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  logo: z.string().optional(),
  colorPrimario: z.string().regex(/^#[0-9A-F]{6}$/i, "Color primario inválido (formato: #RRGGBB)"),
  colorSecundario: z.string().regex(/^#[0-9A-F]{6}$/i, "Color secundario inválido (formato: #RRGGBB)"),
  colorAccent: z.string().regex(/^#[0-9A-F]{6}$/i, "Color de acento inválido (formato: #RRGGBB)"),
  whatsapp: z.string()
    .min(10, "El número debe tener al menos 10 dígitos")
    .regex(/^[0-9+\s()-]+$/, "Solo se permiten números y símbolos telefónicos"),
  ciudad: z.string().min(3, "La ciudad debe tener al menos 3 caracteres"),
});

export const propertyBaseSchema = z.object({
  tipo: z.enum(["apartamento", "casa", "local", "oficina", "bodega", "lote"]),
  fotos: z.array(z.string()).min(1, "Debes subir al menos 1 foto"),
});

export const residencialSchema = propertyBaseSchema.extend({
  canon: z.string().min(1, "El canon es requerido"),
  ubicacion: z.string().min(5, "La ubicación debe ser más específica"),
  habitaciones: z.number().min(1, "Mínimo 1 habitación").max(20, "Máximo 20 habitaciones"),
  banos: z.number().min(1, "Mínimo 1 baño").max(10, "Máximo 10 baños"),
  parqueaderos: z.number().min(0).max(10, "Máximo 10 parqueaderos"),
  area: z.number().min(10, "El área mínima es 10 m²").max(10000, "El área máxima es 10,000 m²"),
  estrato: z.number().min(1).max(6).optional(),
});

export const comercialSchema = propertyBaseSchema.extend({
  canon: z.string().min(1, "El canon es requerido"),
  ubicacion: z.string().min(5, "La ubicación debe ser más específica"),
  area: z.number().min(10, "El área mínima es 10 m²").max(50000, "El área máxima es 50,000 m²"),
  trafico: z.enum(["bajo", "medio", "alto"]).optional(),
  alturaLibre: z.string().optional(),
  servicios: z.boolean().optional(),
  vitrina: z.boolean().optional(),
});

export const loteSchema = propertyBaseSchema.extend({
  valorVenta: z.string().min(1, "El valor es requerido"),
  ubicacion: z.string().min(5, "La ubicación debe ser más específica"),
  area: z.number().min(50, "El área mínima es 50 m²").max(1000000, "El área máxima es 1,000,000 m²"),
  uso: z.enum(["residencial", "comercial"]).optional(),
});

export const validatePropertyData = (data: any, tipo: PropertyType) => {
  try {
    if (tipo === "apartamento" || tipo === "casa") {
      residencialSchema.parse(data);
      return { success: true, errors: {} };
    } else if (tipo === "local" || tipo === "oficina" || tipo === "bodega") {
      comercialSchema.parse(data);
      return { success: true, errors: {} };
    } else if (tipo === "lote") {
      loteSchema.parse(data);
      return { success: true, errors: {} };
    }
    return { success: false, errors: { tipo: "Tipo de propiedad inválido" } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: "Error de validación" } };
  }
};

export const validateAliadoConfig = (config: any) => {
  try {
    aliadoConfigSchema.parse(config);
    return { success: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: "Error de validación" } };
  }
};
