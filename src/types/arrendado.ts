import { PropertyType } from "./property";

export interface ArrendadoData {
  tipo: PropertyType;
  ubicacion: string;
  diasEnMercado: number;
  precio: string;
  fotos: string[];
  videoUrl?: string;
  ctaCustom?: string;
}

export type ArrendadoType = "arrendado" | "vendido";
