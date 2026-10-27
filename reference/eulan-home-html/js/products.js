export const productCategories = [
  {
    type: "aros",
    name: "Aros",
    description: "Formas que enmarcan el rostro.",
    image: "assets/category-aros-natural-reference.webp",
    alt: "Primer plano natural de una modelo usando aros dorados",
  },
  {
    type: "collares",
    name: "Collares",
    description: "Detalles que acompañan cada gesto.",
    image: "assets/category-collares-referencia.webp",
    alt: "Primer plano de una modelo con un collar grueso de eslabones dorados",
  },
];

export const products = [
  {
    id: "curva",
    name: "Aros Curva",
    type: "aros",
    image: "assets/gold-product.webp",
    detail: "Una curva continua. Volumen suave y reflejos que cambian con la luz.",
    kind: "Aros de perfil orgánico",
  },
  {
    id: "gota",
    name: "Collar Gota",
    type: "collares",
    image: "assets/gold-necklace.webp",
    detail: "Un pequeño reflejo suspendido. Una cadena delicada y una forma esencial.",
    kind: "Collar con colgante de gota",
  },
];

export const findProduct = (id) => products.find((product) => product.id === id);
