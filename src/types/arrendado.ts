import { PropertyType } from "./property";

export interface ArrendadoData {
  tipo: PropertyType;
  ubicacion: string;
  diasEnMercado: number;
  fotos: string[];
}

export type ArrendadoType = "arrendado" | "vendido";
