import { ReelTemplate } from "@/types/property";

export interface TemplateStyle {
  name: string;
  description: string;
  gradient: {
    none: string;
    top: string;
    bottom: string;
    both: string;
  };
  priceStyle: {
    className: string;
    emoji: string;
  };
  subtitleStyle: {
    background: string;
    textColor: string;
    textSize: string;
  };
  icon: string;
}

export const REEL_TEMPLATES: Record<ReelTemplate, TemplateStyle> = {
  residencial: {
    name: "Residencial",
    description: "Cálido y acogedor para apartamentos y casas",
    gradient: {
      none: "",
      top: "from-blue-900/45 to-transparent",
      bottom: "from-transparent to-purple-900/55",
      both: "from-blue-900/45 via-transparent to-purple-900/55"
    },
    priceStyle: {
      className: "rounded-2xl shadow-2xl",
      emoji: "🏡"
    },
    subtitleStyle: {
      background: "bg-white/90 backdrop-blur-md border border-gray-300/50",
      textColor: "text-gray-900",
      textSize: "text-xl"
    },
    icon: "🏠"
  },
  
  comercial: {
    name: "Comercial",
    description: "Profesional y moderno para locales y oficinas",
    gradient: {
      none: "",
      top: "from-gray-900/55 to-transparent",
      bottom: "from-transparent to-blue-900/65",
      both: "from-gray-900/55 via-transparent to-blue-900/65"
    },
    priceStyle: {
      className: "rounded-lg shadow-2xl border-2",
      emoji: "💼"
    },
    subtitleStyle: {
      background: "bg-white/90 backdrop-blur-lg border-2 border-gray-400/40",
      textColor: "text-slate-900",
      textSize: "text-xl"
    },
    icon: "🏢"
  },
  
  premium: {
    name: "Premium",
    description: "Elegante y sofisticado para propiedades exclusivas",
    gradient: {
      none: "",
      top: "from-amber-900/40 to-transparent",
      bottom: "from-transparent to-rose-900/50",
      both: "from-amber-900/40 via-transparent to-rose-900/50"
    },
    priceStyle: {
      className: "rounded-3xl shadow-2xl border-4",
      emoji: "✨"
    },
    subtitleStyle: {
      background: "bg-white/95 backdrop-blur-xl border-2 border-amber-400/60",
      textColor: "text-gray-900",
      textSize: "text-2xl"
    },
    icon: "👑"
  }
};

export const applyGradientIntensity = (
  baseGradient: string, 
  intensity: number
): string => {
  if (intensity === 0 || !baseGradient) return '';
  if (intensity === 100) return baseGradient; // Optimización
  
  // Regex global para capturar TODAS las opacidades (/número)
  // El flag /g hace que replace() actúe sobre todas las coincidencias
  return baseGradient.replace(/\/(\d+)/g, (match, opacity) => {
    const baseOpacity = parseInt(opacity);
    const adjustedOpacity = Math.round((baseOpacity * intensity) / 100);
    return `/${adjustedOpacity}`;
  });
};

export const getTemplateForProperty = (tipo: string, uso?: string): ReelTemplate => {
  // Auto-detectar template basado en tipo de propiedad
  if (tipo === "local" || tipo === "oficina" || tipo === "bodega" || uso === "comercial") {
    return "comercial";
  }
  
  if (tipo === "apartamento" || tipo === "casa") {
    return "residencial";
  }
  
  return "residencial"; // Default
};
