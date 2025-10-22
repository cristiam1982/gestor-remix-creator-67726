import { PropertyData, AliadoConfig } from "@/types/property";

export const generateCaption = (property: PropertyData, aliado: AliadoConfig): string => {
  const { tipo, ubicacion, habitaciones, banos, canon, area, trafico } = property;
  const { ciudad } = aliado;
  
  let caption = "";
  let hashtags = "";

  switch (tipo) {
    case "apartamento":
      caption = `✨ ¡Tu nuevo hogar te espera en ${ubicacion || ciudad}!\n`;
      caption += `Apartamento de ${habitaciones} habitaciones y ${banos} baños.\n`;
      caption += `Arrienda con confianza y respaldo de ${aliado.nombre}.\n`;
      if (canon) caption += `💰 $${canon} mensual\n`;
      hashtags = `#Arriendos${aliado.ciudad.replace(/\s/g, "")} #Apartamentos${aliado.ciudad.replace(/\s/g, "")} #ElGestor #TuNuevoHogar`;
      break;

    case "casa":
      caption = `🏡 La casa de tus sueños está aquí en ${ubicacion || ciudad}!\n`;
      caption += `${habitaciones} habitaciones, ${banos} baños y mucho espacio para tu familia.\n`;
      caption += `Haz realidad tu hogar con ${aliado.nombre}.\n`;
      if (canon) caption += `💰 $${canon} mensual\n`;
      hashtags = `#Casas${aliado.ciudad.replace(/\s/g, "")} #Arriendos #ElGestor #HogarDulceHogar`;
      break;

    case "local":
      caption = `📍 Ubica tu negocio en ${ubicacion || ciudad}.\n`;
      caption += `Local de ${area} m² con tráfico ${trafico} y excelente visibilidad.\n`;
      caption += `Haz crecer tu marca con el respaldo de ${aliado.nombre}.\n`;
      if (canon) caption += `💼 $${canon} mensual\n`;
      hashtags = `#LocalesComerciales #Negocios${aliado.ciudad.replace(/\s/g, "")} #ElGestor #EmprenderConConfianza`;
      break;

    case "oficina":
      caption = `💼 Oficina profesional en ${ubicacion || ciudad}.\n`;
      caption += `${area} m² ideales para tu empresa.\n`;
      caption += `Con ${aliado.nombre}, tu éxito empresarial empieza aquí.\n`;
      if (canon) caption += `📊 $${canon} mensual\n`;
      hashtags = `#Oficinas${aliado.ciudad.replace(/\s/g, "")} #EspaciosProfesionales #ElGestor`;
      break;

    case "bodega":
      caption = `🏭 Bodega estratégica en ${ubicacion || ciudad}.\n`;
      caption += `${area} m² para almacenamiento y logística.\n`;
      caption += `Optimiza tu operación con ${aliado.nombre}.\n`;
      if (canon) caption += `📦 $${canon} mensual\n`;
      hashtags = `#Bodegas${aliado.ciudad.replace(/\s/g, "")} #Logistica #ElGestor`;
      break;

    case "lote":
      caption = `🌳 Lote ${property.uso} en ${ubicacion || ciudad}.\n`;
      caption += `${area} m² con grandes posibilidades.\n`;
      caption += `Invierte en tu futuro con ${aliado.nombre}.\n`;
      if (property.valorVenta) caption += `💎 $${property.valorVenta}\n`;
      hashtags = `#Lotes${aliado.ciudad.replace(/\s/g, "")} #Inversión #ElGestor`;
      break;
  }

  caption += `\n📱 Agenda tu visita: ${aliado.whatsapp}\n\n`;
  caption += hashtags;

  return caption;
};
