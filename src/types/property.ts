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
  | "carrusel"
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
  ctaArrendado?: string;
  ctaVendido?: string;
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
  gradientDirection?: 'top' | 'bottom' | 'both' | 'none'; // Fase 4: dirección de gradiente
  gradientIntensity?: number; // Fase 4: intensidad del gradiente (0-100)
  showSummarySlide?: boolean; // Fase 5: mostrar slide de resumen final
  summaryBackgroundStyle?: 'solid' | 'blur' | 'mosaic'; // Fase 5: estilo de fondo del slide final
}
