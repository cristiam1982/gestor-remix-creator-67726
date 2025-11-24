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

export type StoryLayout = 
  | "overlay"    // Layout actual (foto completa con overlay)
  | "gallery"    // Layout con grid de fotos + sección info
  | "showcase";  // Layout split (futuro)

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
  galleryBadgeText?: string;        // Texto del badge en Gallery (default: "OFERTA LIMITADA")
  galleryBackgroundColor?: string;  // Color de fondo de sección inferior en Gallery
}

// Fase 6: Logo settings
export interface LogoSettings {
  position: 'top-left' | 'top-right';
  opacity: number; // 30-100
  background: 'none' | 'frosted' | 'glow' | 'elevated';
  size: 'small' | 'medium' | 'large' | 'xlarge'; // 60px, 70px, 80px, 90px
  shape?: 'square' | 'rounded' | 'circle' | 'squircle'; // Default: 'rounded'
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

// First Photo Configuration (Portada especial)
export interface FirstPhotoConfig {
  duration?: number; // 1000-5000ms (solo Reel)
  showPrice: boolean; // Mostrar precio en primera foto
  showTitle: boolean; // Mostrar título/ubicación en primera foto
  showIcons: boolean; // Mostrar iconos de características en primera foto
  showCTA?: boolean; // Mostrar Call to Action en primera foto
  textScaleOverride?: number; // -50 a +60 (porcentaje)
  showAllyLogo?: boolean; // Mostrar/ocultar logo del aliado en primera foto
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
  storyLayout?: StoryLayout; // Fase 6: Layout de historia (overlay/gallery/showcase)
  gradientDirection?: 'top' | 'bottom' | 'both' | 'none'; // Fase 4: dirección de gradiente
  gradientIntensity?: number; // Fase 4: intensidad del gradiente (0-100)
  showSummarySlide?: boolean; // Fase 5: mostrar slide de resumen final
  summaryBackgroundStyle?: 'solid' | 'blur' | 'mosaic'; // Fase 5: estilo de fondo del slide final
  // Fase 6: Customization settings
  logoSettings?: LogoSettings;
  textComposition?: TextCompositionSettings;
  visualLayers?: VisualLayers;
  firstPhotoConfig?: FirstPhotoConfig; // Configuración especial para primera foto
  
  // Gallery Story - Override temporal del color de fondo
  galleryBackgroundColorOverride?: string;
  galleryBadgeTextOverride?: string; // Override del texto del badge
}
