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
  | "reel-video"
  | "reel-multi-video"
  | "arrendado"
  | "vendido";

export type ReelTemplate = 
  | "residencial"
  | "comercial" 
  | "premium";

export interface AliadoConfig {
  nombre: string;
  logo: string;
  colorPrimario: string;    // Color principal (canon/precio y destacados)
  colorSecundario: string;  // Color secundario (características: habitaciones, baños, etc.)
  whatsapp: string;
  ciudad: string;
}

export interface PropertyData {
  tipo: PropertyType;
  modalidad?: "arriendo" | "venta";
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
  piso?: number;
  amoblado?: boolean;
  fotos: string[];
  subtitulos?: string[];
  template?: ReelTemplate; // Fase 4: templates visuales
  gradientDirection?: 'top' | 'bottom' | 'both'; // Fase 4: dirección de gradiente
}
