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
  const { tipo, ubicacion, habitaciones, banos, canon, valorVenta, modalidad, area, trafico, estrato, piso, alturaLibre, vitrina, uso } = property;
  const { ciudad } = aliado;
  const tone = TONES[template];
  
  let caption = "";
  let hashtags = "";
  
  const esVenta = modalidad === "venta" || (valorVenta && !canon);
  const precio = esVenta ? valorVenta : canon;
  const verboAccion = esVenta ? "comprar" : "arrendar";

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
      caption = hook || `${tone.prefix} ¿Te imaginas despertar cada día en ${ubicacion || ciudad}?\n\n`;
      caption += `✨ Apartamento de ${habitaciones} ${habitaciones === 1 ? 'habitación' : 'habitaciones'} y ${banos} ${banos === 1 ? 'baño' : 'baños'}`;
      if (estrato) caption += ` en estrato ${estrato}`;
      caption += ` 🏠\n\n`;
      caption += template === "premium" 
        ? `Cada detalle pensado para tu comodidad. Espacios amplios donde la luz natural será tu mejor compañía ☀️\n\n`
        : `El espacio perfecto donde cada rincón cuenta una historia. ${esVenta ? 'Tu inversión' : 'Tu hogar'} te está esperando 🔑\n\n`;
      caption += `📍 Ubicación privilegiada en ${ubicacion || ciudad}\n`;
      if (precio) caption += `💰 ${esVenta ? 'Precio:' : 'Canon:'} $${precio}${esVenta ? '' : '/mes'}\n\n`;
      caption += `⚡ ${esVenta ? 'Agenda tu visita hoy' : 'Disponible de inmediato'} - Alta demanda en la zona\n`;
      hashtags = esVenta 
        ? `#Venta${ciudad.replace(/\s/g, "")} #Apartamentos${ciudad.replace(/\s/g, "")} #ElGestor #TuNuevoHogar #Inversión${ciudad.replace(/\s/g, "")}`
        : `#Arriendos${ciudad.replace(/\s/g, "")} #Apartamentos${ciudad.replace(/\s/g, "")} #ElGestor #TuNuevoHogar #Hogar${ciudad.replace(/\s/g, "")}`;

    case "casa":
      caption = hook || `${tone.prefix} ¿Buscas el lugar perfecto para crear recuerdos inolvidables?\n\n`;
      caption += `🏡 Casa con ${habitaciones} ${habitaciones === 1 ? 'habitación' : 'habitaciones'} y ${banos} ${banos === 1 ? 'baño' : 'baños'}`;
      if (estrato) caption += ` - Estrato ${estrato}`;
      caption += `\n\n`;
      caption += template === "premium"
        ? `Exclusividad y amplitud para tu familia. Jardín, espacios independientes y la tranquilidad que siempre soñaste 🌳\n\n`
        : `Espacio de sobra para toda la familia. Patio, zonas verdes y ese lugar especial para cada momento 🌺\n\n`;
      caption += `📍 ${ubicacion || ciudad} - Zona segura y tranquila\n`;
      if (precio) caption += `💰 ${esVenta ? 'Precio:' : 'Canon:'} $${precio}${esVenta ? '' : '/mes'}\n\n`;
      caption += `👨‍👩‍👧‍👦 ¡Tu familia se merece este espacio!\n`;
      hashtags = esVenta
        ? `#Casas${ciudad.replace(/\s/g, "")} #Venta${ciudad.replace(/\s/g, "")} #ElGestor #HogarDulceHogar #FamiliasConHogar`
        : `#Casas${ciudad.replace(/\s/g, "")} #Arriendos${ciudad.replace(/\s/g, "")} #ElGestor #HogarDulceHogar #VidaEnFamilia`;

    case "local":
      caption = hook || `${tone.prefix} ¿Listo para hacer crecer tu negocio?\n\n`;
      caption += `💼 Local comercial de ${area} m²`;
      if (trafico) caption += ` 🚶‍♂️ Tráfico ${trafico === 'alto' ? 'ALTO ⬆️' : trafico === 'medio' ? 'Medio 📊' : 'Bajo'}`;
      if (vitrina) caption += ` + Vitrina frontal para máxima visibilidad 👀`;
      caption += `\n\n`;
      caption += template === "comercial"
        ? `📍 Ubicación estratégica en ${ubicacion || ciudad} - El punto perfecto para captar clientes todos los días 🎯\n\n`
        : `📍 ${ubicacion || ciudad} - Zona con alto flujo de clientes potenciales 🎯\n\n`;
      caption += `✅ Todo listo para montar tu negocio\n`;
      if (precio) caption += `💰 ${esVenta ? 'Inversión:' : 'Canon:'} $${precio}${esVenta ? '' : '/mes'}\n\n`;
      caption += `⏰ Los mejores espacios se van rápido. ¡No dejes pasar esta oportunidad!\n`;
      hashtags = esVenta
        ? `#LocalesComerciales #Venta${ciudad.replace(/\s/g, "")} #ElGestor #Emprendimiento #Inversión${ciudad.replace(/\s/g, "")}`
        : `#LocalesComerciales #Negocios${ciudad.replace(/\s/g, "")} #ElGestor #Emprendimiento #TuNegocio`;

    case "oficina":
      caption = hook || `${tone.prefix} ¿Tu empresa necesita crecer? Este es el espacio que buscas\n\n`;
      caption += `🏢 Oficina profesional de ${area} m²`;
      if (piso) caption += ` en piso ${piso}`;
      caption += `\n\n`;
      caption += template === "comercial"
        ? `🎯 Ubicación estratégica en ${ubicacion || ciudad} para posicionar tu marca\n`
        : `📍 ${ubicacion || ciudad} - Zona empresarial de alto prestigio\n`;
      if (trafico) caption += `🚶‍♂️ Tráfico ${trafico} de profesionales y clientes potenciales\n`;
      caption += `\n`;
      caption += `✨ Espacios amplios, iluminados y listos para trabajar\n`;
      caption += `🅿️ Fácil acceso y parqueadero disponible\n\n`;
      if (precio) caption += `💼 ${esVenta ? 'Inversión:' : 'Canon:'} $${precio}${esVenta ? '' : '/mes'}\n\n`;
      caption += `🚀 Da el siguiente paso para tu empresa\n`;
      hashtags = esVenta
        ? `#Oficinas${ciudad.replace(/\s/g, "")} #Venta${ciudad.replace(/\s/g, "")} #ElGestor #InversiónInteligente #EspaciosCorporativos`
        : `#Oficinas${ciudad.replace(/\s/g, "")} #EspaciosProfesionales #ElGestor #Empresas${ciudad.replace(/\s/g, "")}`;

    case "bodega":
      caption = hook || `${tone.prefix} ¿Necesitas optimizar tu operación logística?\n\n`;
      caption += `📦 Bodega industrial de ${area} m²`;
      if (alturaLibre) caption += ` con ${alturaLibre}m de altura libre 📏`;
      caption += `\n\n`;
      caption += `📍 ${ubicacion || ciudad}`;
      if (trafico) caption += ` - Tráfico ${trafico} para carga y descarga 🚚`;
      caption += `\n\n`;
      caption += `✅ Perfecta para almacenamiento y distribución\n`;
      caption += `✅ Fácil acceso para vehículos de carga\n`;
      caption += template === "comercial"
        ? `✅ Instalaciones preparadas para operación inmediata\n\n`
        : `✅ Lista para tus operaciones\n\n`;
      if (precio) caption += `💰 ${esVenta ? 'Inversión:' : 'Canon:'} $${precio}${esVenta ? '' : '/mes'}\n\n`;
      caption += `⚡ Espacios como este no duran disponibles. ¡Cotiza ahora!\n`;
      hashtags = esVenta
        ? `#Bodegas${ciudad.replace(/\s/g, "")} #Venta${ciudad.replace(/\s/g, "")} #ElGestor #InversiónIndustrial #Logística`
        : `#Bodegas${ciudad.replace(/\s/g, "")} #Logística${ciudad.replace(/\s/g, "")} #ElGestor #AlmacenamientoProfesional`;

    case "lote":
      caption = hook || `${tone.prefix} ¿Buscas una inversión inteligente con proyección?\n\n`;
      caption += `🏗️ Lote ${property.uso || 'urbano'} de ${area} m²\n`;
      caption += `📍 ${ubicacion || ciudad}\n\n`;
      caption += template === "premium"
        ? `💎 Ubicación privilegiada con gran potencial de valorización\n`
        : `💡 Terreno con múltiples posibilidades de desarrollo\n`;
      caption += `✅ Escrituras al día\n`;
      caption += `✅ Servicios públicos cercanos\n`;
      caption += `✅ Zona de alto crecimiento 📈\n\n`;
      if (property.valorVenta) caption += `💰 Inversión: $${property.valorVenta}\n\n`;
      caption += `🎯 Las mejores oportunidades de inversión no esperan\n`;
      hashtags = `#Lotes${ciudad.replace(/\s/g, "")} #Inversión${ciudad.replace(/\s/g, "")} #ElGestor #BienesRaíces #Oportunidad`;
  }

  caption += `\n📲 Contacta a ${aliado.nombre}: ${aliado.whatsapp}\n`;
  caption += `👉 ${esVenta ? 'Invierte hoy' : 'Agenda tu visita'} y asegura este ${tipo === 'apartamento' || tipo === 'casa' ? 'hogar' : 'espacio'}\n\n`;
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
