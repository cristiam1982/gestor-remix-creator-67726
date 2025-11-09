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
  logoTransparent?: string;
  colorPrimario: string;    // Color principal (canon/precio y destacados)
  colorSecundario: string;  // Color secundario (características: habitaciones, baños, etc.)
  whatsapp: string;
  ciudad: string;
  ctaArrendado?: string;
  ctaVendido?: string;
}

// Fase 6: Logo settings
export interface LogoSettings {
  position: 'top-left' | 'top-right';
  opacity: number; // 30-100
  background: 'none' | 'frosted' | 'glow' | 'elevated';
  size: 'small' | 'medium' | 'large'; // 80px, 90px, 100px
  shape?: 'square' | 'rounded' | 'circle' | 'squircle'; // Default: 'rounded'
  animation?: 'none' | 'floating' | 'pulse'; // Default: 'none'
  floatingSpeed?: number; // 3-8 segundos, default: 5
  entranceAnimation?: 'none' | 'fade-in' | 'zoom-in' | 'slide-in' | 'bounce-in' | 'spin-in' | 'elastic'; // Animación de entrada una vez
  entranceDuration?: number; // 0.6-1.2 segundos, default: 0.8
}

// Fase 6: Text composition settings
export interface TextCompositionSettings {
  typographyScale: number; // -20 a +40 (porcentaje) - para texto principal (precio, ubicación, etc.)
  badgeScale: number; // -20 a +40 (porcentaje) - para badge/subtítulo
  badgeStyle: 'circular' | 'rectangular' | 'rounded' | 'none';
  verticalSpacing: 'compact' | 'normal' | 'spacious';
}

// Fase 6: Visual layers visibility
export interface VisualLayers {
  showPhoto: boolean;
  showPrice: boolean;
  showBadge: boolean;
  showIcons: boolean;
  showAllyLogo: boolean;
  showCTA: boolean;
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
  // Fase 6: Customization settings
  logoSettings?: LogoSettings;
  textComposition?: TextCompositionSettings;
  visualLayers?: VisualLayers;
}
