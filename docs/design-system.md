# Sistema de diseño extraído del original

## Referencia y fidelidad

Fuente: `reference/eulan-home-html.zip` y extracción intacta. El ZIP contiene un SPA de referencia con Home, dos productos conceptuales, páginas básicas y carrito local. No es un catálogo comercial confirmado.

El Home se migra manteniendo secciones, orden, contenido, imágenes, clases y reglas del CSS original (rutas de recursos y selectores de contexto adaptados a App Router). `src/components/Home.tsx` es JSX real renderizado en servidor, sin inyección HTML. Header, Footer y mejoras de interacción se comparten. Las rutas hash se sustituyen por App Router. Los destacados abren fichas individuales.

## Tokens efectivos (últimas declaraciones CSS)

| Uso                   | Valor                      |
| --------------------- | -------------------------- |
| Fondo base            | `#ffffff`                  |
| Papel                 | `#ffffff`                  |
| Texto                 | `#2b2a23`                  |
| Texto secundario      | `#646457`                  |
| Líneas                | `#d9d5ca`                  |
| Acento beige          | `#eeebe3`                  |
| Superficie secundaria | `#e5e5da`                  |
| Fondo de producto y foto principal | `#ffffff`       |
| Dorado auxiliar       | `#c7a361`                  |
| Curva de movimiento   | `cubic-bezier(.2,.7,.3,1)` |

Tipografía local: Outfit variable (100–900) para titulares y nombres; Manrope variable (200–800) para cuerpo, navegación y precios. Licencias OFL conservadas en assets. Cuerpo 13 px/1.6; títulos de página 48–76 px, hero según clamps originales (64–98 px de escritorio con ajustes móviles). Pesos contenidos y tracking negativo en titulares.

Escala ajustada para la tienda: títulos de sección 25–32 px en escritorio y 24–29 px en móvil; nombres de producto 17/16 px; precios 13 px; títulos de categoría 19–24/20 px. Los titulares del hero conservan su papel principal con una escala de 58–82 px en escritorio y 48–58 px en móvil. Mantener estas proporciones salvo que la jerarquía editorial requiera un titular mayor.

Grilla: márgenes originales 4vw en escritorio, 20–24 px en móvil. Breakpoint principal 767 px, secundario 1023 px. Catálogo nuevo: tres columnas de escritorio y dos de móvil, fotografías cuadradas, sin sombras. Colecciones: composición editorial dividida y apilada en móvil. Producto: galería 58% y texto restante, apilado en móvil. Espaciado base 8, 12, 16, 20, 24, 32, 40, 56, 64 px, ampliado con vw en escenas editoriales.

## Dirección artística

Fotografía costera, piel natural y reflejos dorados. El fondo por defecto de páginas, header, footer y carrito es blanco. El beige claro se reserva para destacar tarjetas o bloques editoriales puntuales. Se priorizan los recursos existentes. Imágenes de joyas y campaña son conceptuales. No incorporar bancos de imágenes ni inventar identidad. Sin sombras ornamentales ni nuevos degradados; se conservan las superposiciones del hero original.

La fotografía principal de cada producto que Shopify entrega al carrusel de portada y a las tarjetas usa un fondo blanco puro uniforme (`#FFFFFF`). Las imágenes de estilo de vida pueden ir después en la galería.

## Componentes

Header y menú móvil, Footer, Home y mejoras del carrusel, tarjetas de producto, catálogo con formulario GET, encabezado de colección, galería, selector de variante, Modal nativo, CartContents, páginas editoriales y estados de error/vacío/carga.

Accesibilidad: enlace de salto, un h1 por página, botones con nombre, diálogos nativos con Escape/foco restaurado, escenas inactivas inert, pausa explícita del carrusel, reduced-motion, controles táctiles, filtros y búsqueda que funcionan sin JavaScript. El contenido no se oculta por animaciones de entrada.

## Diferencias deliberadas

Footer ampliado con ayuda y búsqueda, destacados con fichas individuales, botón de pausa del hero y aviso de demostración en catálogo/carrito. La composición del Home no se rediseña. Nuevas páginas no usan componentes prediseñados.

Ver `verification/home-comparison.json` y capturas a 1440×900 y 390×844. No interpretar capturas como certificación WCAG o medición de Core Web Vitals de producción.

### Progreso del hero — refinamiento solicitado

Aplicando Impeccable, el temporizador de la miniatura activa se refuerza con un marco perimetral marfil de 1,5 px dentro de la miniatura, sobre un trazo oliva discreto, segundos restantes en una etiqueta de alto contraste y mayor tamaño de la miniatura activa (80×60 px en escritorio y 68×52 px en móvil). El propio recorrido del marco dispara el cambio de escena al completarse. Se mide el perímetro real en píxeles, sin normalización SVG, y se eliminó la barra horizontal anterior. La cuenta regresiva lee esa misma animación. Con movimiento reducido se muestra un marco estático y se oculta la cuenta regresiva, ya que no hay avance automático. El resto de la composición del Home se conserva.
