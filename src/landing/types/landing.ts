export type AllyData = {
  logoUrl?: string;
  name: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  city?: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
  };
  gestorBadgeUrl?: string;
};

export type PropertyData = {
  type: string;
  operation: "Arriendo" | "Venta" | "Ambos";
  price: number | string;
  hideAddress?: boolean;
  address?: string;
  neighborhood?: string;
  city?: string;
  builtArea?: number;
  privateArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  stratum?: number;
  floor?: number;
  age?: string;
  adminFee?: number | string;
  description?: string;
  benefits: string[];
  photos: string[];
  shortVideoUrl?: string;
  longVideoUrl?: string;
  mapEmbedUrl?: string;
};

export type LandingState = {
  ally: AllyData;
  property: PropertyData;
};
