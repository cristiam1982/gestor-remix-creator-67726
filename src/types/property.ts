// Core types for property data
export type PropertyType = 
  | "apartamento" 
  | "casa" 
  | "local" 
  | "oficina" 
  | "bodega" 
  | "lote";

export type ContentType = 
  | "post" 
  | "historia" 
  | "reel-fotos" 
  | "reel-video";

export interface AliadoConfig {
  nombre: string;
  logo: string;
  colorPrimario: string;    // Color principal (textos, botones)
  colorSecundario: string;  // Color secundario (acentos, iconos)
  colorAccent: string;      // Color de acento (fondos, gradientes)
  whatsapp: string;
  ciudad: string;
}

export interface PropertyData {
  tipo: PropertyType;
  canon?: string;
  ubicacion?: string;
  habitaciones?: number;
  banos?: number;
  parqueaderos?: number;
  area?: number;
  estrato?: number;
  trafico?: "bajo" | "medio" | "alto";
  alturaLibre?: string;
  servicios?: boolean;
  vitrina?: boolean;
  uso?: "residencial" | "comercial";
  valorVenta?: string;
  fotos: string[];
}
