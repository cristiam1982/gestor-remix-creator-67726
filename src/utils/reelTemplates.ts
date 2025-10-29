import { ReelTemplate } from "@/types/property";

export interface TemplateStyle {
  name: string;
  description: string;
  gradient: {
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
    textSize: string;
  };
  icon: string;
}

export const REEL_TEMPLATES: Record<ReelTemplate, TemplateStyle> = {
  residencial: {
    name: "Residencial",
    description: "Cálido y acogedor para apartamentos y casas",
    gradient: {
      top: "from-blue-900/45 to-transparent",
      bottom: "from-transparent to-purple-900/55",
      both: "from-blue-900/45 via-transparent to-purple-900/55"
    },
    priceStyle: {
      className: "rounded-2xl shadow-2xl",
      emoji: "🏡"
    },
    subtitleStyle: {
      background: "bg-black/80 backdrop-blur-md border border-white/20",
      textSize: "text-xl"
    },
    icon: "🏠"
  },
  
  comercial: {
    name: "Comercial",
    description: "Profesional y moderno para locales y oficinas",
    gradient: {
      top: "from-gray-900/55 to-transparent",
      bottom: "from-transparent to-blue-900/65",
      both: "from-gray-900/55 via-transparent to-blue-900/65"
    },
    priceStyle: {
      className: "rounded-lg shadow-2xl border-2",
      emoji: "💼"
    },
    subtitleStyle: {
      background: "bg-slate-900/85 backdrop-blur-lg border-2 border-white/30",
      textSize: "text-xl"
    },
    icon: "🏢"
  },
  
  premium: {
    name: "Premium",
    description: "Elegante y sofisticado para propiedades exclusivas",
    gradient: {
      top: "from-amber-900/40 to-transparent",
      bottom: "from-transparent to-rose-900/50",
      both: "from-amber-900/40 via-transparent to-rose-900/50"
    },
    priceStyle: {
      className: "rounded-3xl shadow-2xl border-4",
      emoji: "✨"
    },
    subtitleStyle: {
      background: "bg-gradient-to-r from-amber-900/90 to-rose-900/90 backdrop-blur-xl border-2 border-amber-200/40",
      textSize: "text-2xl"
    },
    icon: "👑"
  }
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
