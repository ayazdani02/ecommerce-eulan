export type InfoPage = {
  title: string;
  lead: string;
  sections: { title: string; text: string }[];
};
export const infoPages: Record<string, InfoPage> = {
  contacto: {
    title: "Conversemos.",
    lead: "¿Una pregunta sobre una pieza? Estamos preparando un espacio para acompañarte.",
    sections: [
      {
        title: "Contacto oficial",
        text: "Canal, horario y plazo de respuesta pendientes de confirmación por EULÁN. No ingreses información de pago ni datos sensibles en el formulario.",
      },
    ],
  },
  "preguntas-frecuentes": {
    title: "Las cosas claras.",
    lead: "Una guía para conocer las piezas y explorar la tienda.",
    sections: [
      {
        title: "¿Puedo comprar en esta demostración?",
        text: "En modo demostración puedes explorar, elegir variantes y modificar tu carrito. No se generan pedidos, reservas ni cobros. El checkout real se habilita al configurar Shopify.",
      },
      {
        title: "¿Los precios y las fotografías son definitivos?",
        text: "Las piezas e imágenes del catálogo mock son conceptuales. Sus precios y disponibilidad son referencias de prueba, pendientes de validación.",
      },
      {
        title: "¿De qué están hechas las joyas?",
        text: "La dirección original propone acero inoxidable 316L y acabado PVD en oro 18K. La composición, medidas y atributos de cada pieza deben confirmarse en el catálogo oficial.",
      },
      {
        title: "¿Realizan envíos dentro de Chile?",
        text: "La tienda está preparada para operar en Chile y mostrar precios en CLP. Cobertura, costos, transportista y plazos se confirmarán antes de habilitar compras.",
      },
      {
        title: "¿Cómo inicio un cambio o devolución?",
        text: "El canal y procedimiento oficial están pendientes de confirmación. Consulta la página de cambios y devoluciones cuando se publique la política definitiva.",
      },
    ],
  },
  envios: {
    title: "Hasta donde estés.",
    lead: "Información de envíos para Chile.",
    sections: [
      {
        title: "Cobertura y plazos",
        text: "Pendiente de confirmación: comunas y regiones cubiertas, tiempos de preparación, días de entrega y restricciones de zonas. Esta demostración no promete plazos de despacho.",
      },
      {
        title: "Costo de envío",
        text: "Las tarifas y eventuales condiciones de envío gratuito todavía no están definidas. El costo final deberá mostrarse antes de confirmar un pago real.",
      },
      {
        title: "Seguimiento",
        text: "El transportista y el canal de seguimiento se informarán al configurar la operación. La arquitectura permite una integración futura con Blue Express; actualmente no está conectada.",
      },
    ],
  },
  "cambios-y-devoluciones": {
    title: "Cada detalle importa.",
    lead: "Información de cambios y devoluciones pendiente de aprobación por EULÁN.",
    sections: [
      {
        title: "Política en preparación",
        text: "La marca debe confirmar el procedimiento, canal de atención, plazos, requisitos de presentación, tratamiento de fallas y costos asociados antes de habilitar compras.",
      },
      {
        title: "Antes de comprar",
        text: "Esta página es contenido provisional y no establece condiciones comerciales ni limita derechos de consumidores. No hay pedidos ni cobros en modo demostración.",
      },
    ],
  },
  cuidados: {
    title: "Para acompañarte más.",
    lead: "Un pequeño cuidado, todos los días.",
    sections: [
      {
        title: "Limpieza suave",
        text: "Guía provisional: limpia con un paño suave y seco, sin productos abrasivos. Consulta las instrucciones definitivas para el material de cada pieza.",
      },
      {
        title: "Un lugar para cada joya",
        text: "Guarda las piezas por separado para reducir el roce. Evita golpes y contacto directo con perfumes o productos químicos mientras se confirman las recomendaciones oficiales.",
      },
      {
        title: "Materiales y agua",
        text: "La campaña original presenta el concepto waterproof. La resistencia y las recomendaciones concretas deben confirmarse por producto; esta guía provisional no constituye una garantía de composición o durabilidad.",
      },
    ],
  },
  privacidad: {
    title: "Tu privacidad.",
    lead: "Aviso provisional de funcionamiento de esta demostración.",
    sections: [
      {
        title: "Carrito y datos",
        text: "Se utiliza una cookie técnica HttpOnly para conservar tu carrito durante un máximo de 14 días. En demostración almacena identificadores de variantes y cantidades; con Shopify almacena el identificador del carrito remoto. No almacena datos de pago.",
      },
      {
        title: "Contacto",
        text: "El formulario prepara un correo en tu aplicación cuando se configura un canal oficial. Este sitio no envía ni almacena los datos del formulario. No hay analítica ni herramientas publicitarias integradas.",
      },
      {
        title: "Política definitiva",
        text: "Antes de publicar la tienda, EULÁN debe completar los datos del responsable, finalidades, proveedores, plazos de conservación y canales para ejercer derechos. Este aviso no sustituye la política definitiva.",
      },
    ],
  },
  terminos: {
    title: "Antes de elegir.",
    lead: "Condiciones de uso y compra pendientes de confirmación.",
    sections: [
      {
        title: "Demostración",
        text: "Este entorno permite revisar diseño y funcionamiento. El catálogo, imágenes, precios y stock mock son provisionales. No genera contratos de compra, pagos ni reservas.",
      },
      {
        title: "Tienda definitiva",
        text: "La identificación del vendedor, contacto, términos de compra, garantías, políticas de envío y cambios deberán validarse y publicarse antes de habilitar ventas reales. No se han definido condiciones comerciales en esta demostración.",
      },
    ],
  },
};
