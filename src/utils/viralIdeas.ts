import { PropertyType, ContentType } from "@/types/property";

export interface ViralIdea {
  title: string;
  description: string;
  hashtags: string[];
  captionStyle: string;
  callToAction: string;
}

export const getViralIdeas = (
  propertyType: PropertyType,
  contentType: ContentType
): ViralIdea[] => {
  // Ideas específicas para contenido "arrendado" o "vendido"
  if (contentType === "arrendado" || contentType === "vendido") {
    return [
      {
        title: "🚀 Récord de velocidad",
        description: "Enfatiza que se arrendó/vendió en tiempo récord (1-7 días)",
        hashtags: ["#ArriendoRápido", "#Récord", "#Efectividad"],
        captionStyle: "Urgente + celebración + CTA a propietarios",
        callToAction: "¿Quieres los mismos resultados?"
      },
      {
        title: "🎉 Cliente satisfecho",
        description: "Muestra testimonio o agradecimiento del propietario (si es posible)",
        hashtags: ["#ClienteFeliz", "#Confianza"],
        captionStyle: "Prueba social + credibilidad",
        callToAction: "Únete a nuestros propietarios felices"
      },
      {
        title: "💪 Resultados garantizados",
        description: "Destaca efectividad del equipo inmobiliario",
        hashtags: ["#ResultadosReales", "#EquipoExperto"],
        captionStyle: "Autoridad + efectividad comprobada",
        callToAction: "Confia en los expertos"
      },
      {
        title: "📊 Estrategia efectiva",
        description: "Menciona brevemente qué estrategia se usó (fotos pro, precio correcto, etc.)",
        hashtags: ["#EstrategiaGanadora", "#Marketing"],
        captionStyle: "Educativo + resultados",
        callToAction: "Aplicamos las mejores prácticas"
      }
    ];
  }
  

  const baseIdeas: Record<PropertyType, ViralIdea[]> = {
    apartamento: [
      {
        title: "El tour perfecto",
        description: "Graba un recorrido inmersivo mostrando luz natural, espacios y acabados",
        hashtags: ["#ApartamentoEnArriendo", "#TuNuevoHogar", "#ViveCómodo"],
        captionStyle: "Emocional + datos clave + urgencia",
        callToAction: "Agenda tu visita hoy",
      },
      {
        title: "Antes y después",
        description: "Muestra el apartamento vacío vs. amoblado (si aplica)",
        hashtags: ["#TransformaciónInmobiliaria", "#ApartamentoNuevo"],
        captionStyle: "Narrativa de transformación",
        callToAction: "Descubre tu nuevo espacio",
      },
      {
        title: "Datos que venden",
        description: "Destaca: ubicación estratégica, servicios incluidos, parqueadero",
        hashtags: ["#UbicaciónPremium", "#TodoIncluido"],
        captionStyle: "Listado de beneficios + precio",
        callToAction: "Pregunta por disponibilidad",
      },
    ],
    casa: [
      {
        title: "La casa de tus sueños",
        description: "Resalta jardín, espacios familiares, privacidad",
        hashtags: ["#CasaEnArriendo", "#EspaciosFamiliares", "#ViviendaIdeal"],
        captionStyle: "Emotivo + lifestyle",
        callToAction: "Vive en tu propia casa",
      },
      {
        title: "Tour completo 360°",
        description: "Recorrido por todas las áreas: sala, cocina, habitaciones, exteriores",
        hashtags: ["#CasaCompleta", "#TourVirtual"],
        captionStyle: "Descriptivo + invitación",
        callToAction: "Reserva tu visita",
      },
      {
        title: "Mascotas bienvenidas",
        description: "Si aplica, enfoca en pet-friendly, jardín, seguridad",
        hashtags: ["#PetFriendly", "#CasaConJardín"],
        captionStyle: "Familiar + inclusivo",
        callToAction: "Tu familia completa merece este espacio",
      },
    ],
    local: [
      {
        title: "Ubicación de alto tráfico",
        description: "Destaca visibilidad, flujo peatonal, acceso vehicular",
        hashtags: ["#LocalComercial", "#NegocioEnMarcha", "#PuntoEstrategico"],
        captionStyle: "Profesional + datos de tráfico",
        callToAction: "Impulsa tu negocio aquí",
      },
      {
        title: "Listo para operar",
        description: "Muestra instalaciones, servicios, posibilidad de adaptación",
        hashtags: ["#LocalListo", "#InversiónSegura"],
        captionStyle: "Objetivo + ventajas competitivas",
        callToAction: "Solicita información comercial",
      },
      {
        title: "Testimonios de vecinos",
        description: "Si es zona comercial consolidada, muestra el entorno",
        hashtags: ["#ZonaComercial", "#AltoFlujo"],
        captionStyle: "Storytelling + prueba social",
        callToAction: "Únete a esta zona exitosa",
      },
    ],
    oficina: [
      {
        title: "Espacio profesional",
        description: "Enfoca en iluminación, distribución, tecnología",
        hashtags: ["#OficinaModerna", "#EspaciosCorporativos", "#Productividad"],
        captionStyle: "Corporativo + beneficios",
        callToAction: "Eleva tu negocio",
      },
      {
        title: "Oficina lista para usar",
        description: "Destaca mobiliario incluido, internet, seguridad",
        hashtags: ["#OficinaEquipada", "#ListaParaTrabajar"],
        captionStyle: "Práctico + solución inmediata",
        callToAction: "Agenda tu recorrido",
      },
      {
        title: "Ubicación estratégica",
        description: "Proximidad a bancos, restaurantes, transporte",
        hashtags: ["#UbicaciónClave", "#AccesoFácil"],
        captionStyle: "Ventajas de ubicación",
        callToAction: "Consulta disponibilidad",
      },
    ],
    bodega: [
      {
        title: "Capacidad y seguridad",
        description: "Enfatiza metros cuadrados, altura libre, sistemas de seguridad",
        hashtags: ["#BodegaIndustrial", "#Almacenamiento", "#LogísticaEficiente"],
        captionStyle: "Técnico + capacidad",
        callToAction: "Optimiza tu operación",
      },
      {
        title: "Acceso logístico",
        description: "Muestra accesos vehiculares, rampas, zonas de carga",
        hashtags: ["#BodegaLogística", "#AccesoTotal"],
        captionStyle: "Operativo + ventajas",
        callToAction: "Agenda inspección",
      },
      {
        title: "Adaptable a tu negocio",
        description: "Versatilidad del espacio, posibilidad de adecuaciones",
        hashtags: ["#BodegaVersatil", "#EspacioIndustrial"],
        captionStyle: "Flexible + oportunidad",
        callToAction: "Consulta condiciones",
      },
    ],
    lote: [
      {
        title: "Inversión estratégica",
        description: "Destaca ubicación, valorización, usos posibles",
        hashtags: ["#LoteEnVenta", "#InversiónInmobiliaria", "#Oportunidad"],
        captionStyle: "Visión de futuro + ROI",
        callToAction: "Invierte en tu futuro",
      },
      {
        title: "Potencial de desarrollo",
        description: "Muestra entorno, servicios cercanos, proyecciones",
        hashtags: ["#DesarrolloInmobiliario", "#TerrenoEstratégico"],
        captionStyle: "Proyección + datos",
        callToAction: "Consulta por financiación",
      },
      {
        title: "Zona en crecimiento",
        description: "Enfoca en plusvalía, nuevos proyectos cercanos",
        hashtags: ["#Plusvalía", "#ZonaEnDesarrollo"],
        captionStyle: "Oportunidad + tendencia",
        callToAction: "Agenda visita al terreno",
      },
    ],
  };

  return baseIdeas[propertyType] || baseIdeas.apartamento;
};

export const getContentTypeStrategy = (contentType: ContentType): string => {
  const strategies: Record<ContentType, string> = {
    post: "Imagen impactante + caption completo + 5-7 hashtags + CTA claro",
    historia: "Visual vertical + texto mínimo + sticker de contacto + swipe up",
    "reel-fotos": "Slideshow dinámico 3-5 seg/foto + música trending + texto superpuesto",
    "reel-video": "Hook en 2 seg + tour fluido + CTA final + audio ambiental",
    "reel-multi-video": "Concatenación múltiples ángulos + transiciones suaves + storytelling progresivo",
    carrusel: "Múltiples slides (3-10) + última slide con CTA + storytelling visual progresivo",
    arrendado: "Imagen celebratorio + velocidad de arriendo + CTA a propietarios",
    vendido: "Imagen celebratorio + velocidad de venta + CTA a propietarios",
  };

  return strategies[contentType];
};

export const getViralHashtags = (
  ciudad: string,
  propertyType: PropertyType
): string[] => {
  const ciudadHashtag = ciudad ? `#Arriendos${ciudad.replace(/\s/g, "")}` : "#ArriendosColombia";
  
  const baseHashtags = [
    ciudadHashtag,
    "#ElGestor",
    "#InmobiliariaColombia",
    "#TuNuevoHogar",
    "#ArriendoSeguro",
  ];

  const typeSpecificHashtags: Record<PropertyType, string[]> = {
    apartamento: ["#ApartamentoEnArriendo", "#ViveAquí", "#ApartamentoNuevo"],
    casa: ["#CasaEnArriendo", "#CasaFamiliar", "#HogarIdeal"],
    local: ["#LocalComercial", "#NegociosColombia", "#EmprendeColombia"],
    oficina: ["#OficinaEnArriendo", "#EspaciosCorporativos", "#OficinaModerna"],
    bodega: ["#BodegaIndustrial", "#Logística", "#AlmacenamientoColombia"],
    lote: ["#LoteEnVenta", "#InversiónInmobiliaria", "#TerrenosColombia"],
  };

  return [...baseHashtags, ...typeSpecificHashtags[propertyType]];
};
