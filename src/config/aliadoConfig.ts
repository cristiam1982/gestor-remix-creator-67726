import { AliadoConfig } from "@/types/property";
import logoRubyMorales from "@/assets/logo-ruby-morales.png";
import logoRubyMoralesTransparent from "@/assets/logo-ruby-morales-transparent.png";

/**
 * Configuración fija del aliado
 * Para cambiar la identidad del aliado, edita estos valores directamente
 */
export const ALIADO_CONFIG: AliadoConfig = {
  nombre: "Ruby Morales Inmobiliaria",
  logo: logoRubyMorales,
  logoTransparent: logoRubyMoralesTransparent,
  colorPrimario: "#FF8C42", // Naranja del logo
  colorSecundario: "#2B3FD6", // Azul del logo
  whatsapp: "+573126041877",
  ciudad: "Cali",
  ctaArrendado: "💪 ¿Quieres arrendar tu inmueble rápido?",
  ctaVendido: "💪 ¿Quieres vender tu inmueble rápido?",
  galleryBadgeText: "OFERTA LIMITADA",
  galleryBackgroundColor: "#2B3FD6"
};
