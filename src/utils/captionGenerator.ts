import { PropertyData, AliadoConfig } from "@/types/property";
import { TemplateTheme } from "@/types/templates";
import { ArrendadoData, ArrendadoType } from "@/types/arrendado";
import { getViralIdeas } from "./viralIdeas";

const TONES = {
  residencial: {
    prefix: "✨",
    style: "emocional y acogedor",
    verbs: ["espera", "sueñas", "imaginas", "deseas"],
    adjectives: ["hermoso", "acogedor", "ideal", "perfecto"]
  },
  comercial: {
    prefix: "💼",
    style: "profesional y directo",
    verbs: ["potencia", "impulsa", "desarrolla", "posiciona"],
    adjectives: ["estratégico", "eficiente", "rentable", "productivo"]
  },
  premium: {
    prefix: "💎",
    style: "exclusivo y sofisticado",
    verbs: ["distingue", "eleva", "transforma", "destaca"],
    adjectives: ["exclusivo", "distinguido", "excepcional", "único"]
  }
};

export const generateCaption = (
  property: PropertyData, 
  aliado: AliadoConfig,
  template: TemplateTheme = "residencial",
  includeViralIdeas: boolean = true
): string => {
  const { tipo, ubicacion, habitaciones, banos, canon, area, trafico, estrato, piso, alturaLibre, vitrina, uso } = property;
  const { ciudad } = aliado;
  const tone = TONES[template];
  
  let caption = "";
  let hashtags = "";

  // Get viral hook if enabled
  let hook = "";
  if (includeViralIdeas) {
    const viralIdeas = getViralIdeas(tipo, "post");
    if (viralIdeas && viralIdeas.length > 0) {
      hook = viralIdeas[0].title;
    }
  }

  switch (tipo) {
    case "apartamento":
      caption = hook || `${tone.prefix} ¡El hogar ${tone.adjectives[0]} que ${tone.verbs[0]} en ${ubicacion || ciudad}!\n`;
      caption += `Apartamento de ${habitaciones} habitaciones y ${banos} baños`;
      if (estrato) caption += `, estrato ${estrato}`;
      caption += `.\n`;
      caption += template === "premium" 
        ? `Vive con distinción en ${aliado.nombre}.\n`
        : `Arrienda con confianza y respaldo de ${aliado.nombre}.\n`;
      if (canon) caption += `💰 $${canon} mensual\n`;
      hashtags = `#Arriendos${ciudad.replace(/\s/g, "")} #Apartamentos${ciudad.replace(/\s/g, "")} #ElGestor #TuNuevoHogar`;
      break;

    case "casa":
      caption = hook || `${tone.prefix} La casa ${tone.adjectives[0]} que ${tone.verbs[1]} en ${ubicacion || ciudad}!\n`;
      caption += `${habitaciones} habitaciones, ${banos} baños`;
      if (estrato) caption += `, estrato ${estrato}`;
      caption += ` y mucho espacio para tu familia.\n`;
      caption += template === "premium"
        ? `${tone.adjectives[1].charAt(0).toUpperCase() + tone.adjectives[1].slice(1)} exclusividad con ${aliado.nombre}.\n`
        : `Haz realidad tu hogar con ${aliado.nombre}.\n`;
      if (canon) caption += `💰 $${canon} mensual\n`;
      hashtags = `#Casas${ciudad.replace(/\s/g, "")} #Arriendos #ElGestor #HogarDulceHogar`;
      break;

    case "local":
      caption = hook || `${tone.prefix} Espacio ${tone.adjectives[2]} para ${tone.verbs[2]} tu negocio en ${ubicacion || ciudad}.\n`;
      caption += `Local de ${area} m²`;
      if (trafico) caption += ` con tráfico ${trafico}`;
      if (vitrina) caption += ` y vitrina frontal`;
      caption += `.\n`;
      caption += template === "comercial"
        ? `${tone.verbs[0].charAt(0).toUpperCase() + tone.verbs[0].slice(1)} tu marca con ${aliado.nombre}.\n`
        : `Haz crecer tu negocio con el respaldo de ${aliado.nombre}.\n`;
      if (canon) caption += `💼 $${canon} mensual\n`;
      hashtags = `#LocalesComerciales #Negocios${ciudad.replace(/\s/g, "")} #ElGestor #EmprenderConConfianza`;
      break;

    case "oficina":
      caption = hook || `${tone.prefix} Oficina ${tone.adjectives[1]} en ${ubicacion || ciudad}.\n`;
      caption += `${area} m²`;
      if (piso) caption += ` en piso ${piso}`;
      if (trafico) caption += `, tráfico ${trafico}`;
      caption += ` ideales para tu empresa.\n`;
      caption += template === "comercial"
        ? `${tone.verbs[3].charAt(0).toUpperCase() + tone.verbs[3].slice(1)} tu éxito con ${aliado.nombre}.\n`
        : `Con ${aliado.nombre}, tu éxito empresarial empieza aquí.\n`;
      if (canon) caption += `📊 $${canon} mensual\n`;
      hashtags = `#Oficinas${ciudad.replace(/\s/g, "")} #EspaciosProfesionales #ElGestor`;
      break;

    case "bodega":
      caption = hook || `${tone.prefix} Bodega ${tone.adjectives[2]} en ${ubicacion || ciudad}.\n`;
      caption += `${area} m²`;
      if (alturaLibre) caption += ` con ${alturaLibre}m de altura libre`;
      if (trafico) caption += `, tráfico ${trafico}`;
      caption += ` para almacenamiento y logística.\n`;
      caption += template === "comercial"
        ? `Optimiza y ${tone.verbs[0]} tu operación con ${aliado.nombre}.\n`
        : `Optimiza tu operación con ${aliado.nombre}.\n`;
      if (canon) caption += `📦 $${canon} mensual\n`;
      hashtags = `#Bodegas${ciudad.replace(/\s/g, "")} #Logistica #ElGestor`;
      break;

    case "lote":
      caption = hook || `${tone.prefix} Lote ${tone.adjectives[3]} ${property.uso} en ${ubicacion || ciudad}.\n`;
      caption += `${area} m² con grandes posibilidades.\n`;
      caption += template === "premium"
        ? `Inversión ${tone.adjectives[0]} con ${aliado.nombre}.\n`
        : `Invierte en tu futuro con ${aliado.nombre}.\n`;
      if (property.valorVenta) caption += `💎 $${property.valorVenta}\n`;
      hashtags = `#Lotes${ciudad.replace(/\s/g, "")} #Inversión #ElGestor`;
      break;
  }

  caption += `\n📱 Agenda tu visita: ${aliado.whatsapp}\n\n`;
  caption += hashtags;

  return caption;
};

export const regenerateCaption = (
  property: PropertyData, 
  aliado: AliadoConfig,
  template: TemplateTheme = "residencial"
): string => {
  // Generate alternative version without viral hook
  return generateCaption(property, aliado, template, false);
};

export const generateArrendadoCaption = (
  data: ArrendadoData,
  aliado: AliadoConfig,
  tipo: ArrendadoType
): string => {
  const { tipo: tipoInmueble, ubicacion, diasEnMercado, precio } = data;
  
  const tipoLabel = {
    apartamento: "apartamento",
    casa: "casa",
    local: "local comercial",
    oficina: "oficina",
    bodega: "bodega",
    lote: "lote"
  }[tipoInmueble];

  const velocidad = diasEnMercado <= 7 
    ? `🚀 ¡RÉCORD! En solo ${diasEnMercado} día${diasEnMercado === 1 ? '' : 's'}`
    : diasEnMercado <= 15 
    ? `⚡ En solo ${diasEnMercado} días`
    : `🎉 En ${diasEnMercado} días`;

  const accionInfinitivo = tipo === "arrendado" ? "arrendar" : "vender";

  let caption = `🎉 ¡${tipo === "arrendado" ? "ARRENDADO" : "VENDIDO"}! ${velocidad}\n\n`;
  caption += `${tipoLabel.charAt(0).toUpperCase() + tipoLabel.slice(1)} en ${ubicacion}\n`;
  caption += `💰 ${tipo === "arrendado" ? "Canon:" : "Precio:"} ${precio}${tipo === "arrendado" ? "/mes" : ""}\n\n`;
  caption += `✨ ¡Otro propietario feliz con ${aliado.nombre}!\n\n`;
  caption += `💪 ¿Quieres ${accionInfinitivo} tu inmueble rápido y seguro?\n`;
  caption += `📱 Contáctanos: ${aliado.whatsapp}\n\n`;
  caption += `#Propiedad${tipo === "arrendado" ? "Arrendada" : "Vendida"} #${aliado.ciudad.replace(/\s/g, "")} #ElGestor #${accionInfinitivo}Rápido #${ubicacion.replace(/\s/g, "")}`;

  return caption;
};
