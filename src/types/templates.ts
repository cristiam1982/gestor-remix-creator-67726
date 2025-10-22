export type TemplateTheme = "residencial" | "comercial" | "premium";

export interface TemplateConfig {
  theme: TemplateTheme;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  style: {
    borderRadius: string;
    shadow: string;
  };
}

export const TEMPLATE_THEMES: Record<TemplateTheme, TemplateConfig> = {
  residencial: {
    theme: "residencial",
    name: "Residencial",
    description: "Cálido y acogedor para apartamentos y casas",
    colors: {
      primary: "#8BC53F",
      secondary: "#00A5BD",
      accent: "#F5F6FA",
    },
    fonts: {
      heading: "font-bold",
      body: "font-normal",
    },
    style: {
      borderRadius: "rounded-2xl",
      shadow: "shadow-xl",
    },
  },
  comercial: {
    theme: "comercial",
    name: "Comercial",
    description: "Profesional y moderno para locales y oficinas",
    colors: {
      primary: "#192A56",
      secondary: "#3498db",
      accent: "#ecf0f1",
    },
    fonts: {
      heading: "font-extrabold",
      body: "font-medium",
    },
    style: {
      borderRadius: "rounded-xl",
      shadow: "shadow-2xl",
    },
  },
  premium: {
    theme: "premium",
    name: "Premium",
    description: "Elegante y exclusivo para propiedades de lujo",
    colors: {
      primary: "#2c3e50",
      secondary: "#c0392b",
      accent: "#f8f9fa",
    },
    fonts: {
      heading: "font-black",
      body: "font-semibold",
    },
    style: {
      borderRadius: "rounded-3xl",
      shadow: "shadow-[0_20px_50px_rgba(0,0,0,0.3)]",
    },
  },
};
