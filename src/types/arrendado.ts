import { PropertyType } from "./property";

export interface ArrendadoData {
  tipo: PropertyType;
  ubicacion: string;
  diasEnMercado: number;
  precio: string;
  fotos: string[];
  videoUrl?: string;
  ctaCustom?: string;
  // Campos opcionales para enriquecer los captions
  habitaciones?: number;
  banos?: number;
  area?: number;
  estrategia?: string;
}

export type ArrendadoType = "arrendado" | "vendido";
