export type LandingTemplateId = "moderna" | "minimal" | "elegante" | "lujos";

export const LANDING_TEMPLATES: { 
  id: LandingTemplateId; 
  name: string; 
  description: string;
  emoji: string;
}[] = [
  { 
    id: "moderna", 
    name: "Moderna", 
    description: "Layout equilibrado, estilo tipo Airbnb/Houm.",
    emoji: "✨"
  },
  { 
    id: "minimal", 
    name: "Minimal", 
    description: "Mucho whitespace, tipografía sobria, pocos bordes.",
    emoji: "⚪"
  },
  { 
    id: "elegante", 
    name: "Elegante", 
    description: "Más contraste, detalles finos, sensación boutique.",
    emoji: "💎"
  },
  { 
    id: "lujos", 
    name: "Lujos", 
    description: "Enfocado en propiedades de alto perfil, highlight del precio y amenities.",
    emoji: "👑"
  },
];

export type LandingTheme = {
  background: string;
  cardBackground: string;
  primary: string;
  accent: string;
  borderRadius: string;
  shadow: string;
  headingFontClass: string;
  sectionSpacing: string;
  cardPadding: string;
  borderStyle: string;
};

type AllyColors = {
  primary: string;
  secondary: string;
  background: string;
  accent: string;
};

export function getLandingTheme(
  template: LandingTemplateId, 
  colors: AllyColors
): LandingTheme {
  const baseTheme = {
    primary: colors.primary,
    accent: colors.accent,
  };

  switch (template) {
    case "moderna":
      return {
        ...baseTheme,
        background: "bg-background",
        cardBackground: "bg-card",
        borderRadius: "rounded-xl",
        shadow: "shadow-md",
        headingFontClass: "font-semibold",
        sectionSpacing: "py-12 lg:py-16",
        cardPadding: "p-6",
        borderStyle: "border-0",
      };

    case "minimal":
      return {
        ...baseTheme,
        background: "bg-white dark:bg-background",
        cardBackground: "bg-white dark:bg-card",
        borderRadius: "rounded-lg",
        shadow: "shadow-none",
        headingFontClass: "font-normal tracking-tight",
        sectionSpacing: "py-16 lg:py-24",
        cardPadding: "p-8 lg:p-10",
        borderStyle: "border border-border/30",
      };

    case "elegante":
      return {
        ...baseTheme,
        background: "bg-gradient-to-b from-background to-muted/20",
        cardBackground: "bg-card/95 backdrop-blur-sm",
        borderRadius: "rounded-2xl",
        shadow: "shadow-lg",
        headingFontClass: "font-bold tracking-tight",
        sectionSpacing: "py-12 lg:py-20",
        cardPadding: "p-6 lg:p-8",
        borderStyle: "border-b border-border/40",
      };

    case "lujos":
      return {
        ...baseTheme,
        background: "bg-gradient-to-br from-background via-muted/10 to-background",
        cardBackground: "bg-card border border-primary/10",
        borderRadius: "rounded-2xl",
        shadow: "shadow-xl",
        headingFontClass: "font-bold tracking-wide uppercase",
        sectionSpacing: "py-16 lg:py-24",
        cardPadding: "p-8 lg:p-12",
        borderStyle: "border-b-2 border-primary/20",
      };

    default:
      return getLandingTheme("moderna", colors);
  }
}
