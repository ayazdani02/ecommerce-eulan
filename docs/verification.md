# Verificación — 27 de octubre de 2026

## Resumen por fase

| Fase | Resultado | Pendiente |
|---|---|---|
| 1 — Análisis y arquitectura | Inspección de HTML/CSS/JS/recursos, copia intacta, tokens documentados, Next.js 16.4.3 y TypeScript estricto | Confirmar catálogo y textos oficiales |
| 2 — Migración del Home | JSX renderizado en servidor, composición/CSS/fuentes/fotografías conservados, tres escenas, destacados, navegación real; comparación escritorio y móvil | Aprobar contenido conceptual para una eventual publicación |
| 3 — Páginas y sistema de diseño | Catálogo, colecciones editoriales, fichas, búsqueda, carrito completo, páginas informativas y 404 | Reemplazar políticas y contacto provisionales |
| 4 — Commerce | Modelos propios, seis piezas mock, variantes, stock de prueba, carrito persistente, cantidades, subtotal CLP y bloqueo de cobros mock | Catálogo e inventario definitivos |
| 5 — Shopify | Adaptador Hydrogen React + Storefront API para productos, colecciones, carrito y checkout; configuración privada y guía | Credenciales y validación integral en tienda de desarrollo |
| 6 — Verificación | Tipos, lint, build, pruebas de dominio y navegador aprobados; capturas revisadas | Medir Core Web Vitals de producción y realizar auditoría WCAG completa al cerrar contenido |

## Comandos ejecutados y resultados

- `npm run typecheck`: aprobado.
- `npm run lint`: aprobado, sin advertencias.
- `npm test`: 3 pruebas de dominio aprobadas.
- `npm run build`: compilación de producción aprobada; 18 salidas estáticas generadas y rutas comerciales dinámicas disponibles.
- `npm run test:e2e`: 10 pruebas aprobadas contra `next start`, en Chrome, a 1440×900 y 390×844.
- `node scripts/compare-home.mjs`: comparación del HTML original en puerto 3001 y producción en puerto 3000, con movimiento reducido para capturas deterministas. Las imágenes lazy se decodifican antes de capturar.

## Cobertura funcional

Escenas del hero y navegación, menú móvil con Escape, filtros por categoría y orden, búsqueda con/sin resultados, selección de variante, agregar al drawer, aumentar cantidad y subtotal, foco restaurado tras cerrar, persistencia al navegar al carrito, checkout mock informativo, eliminación, carrito vacío y producto agotado. También rutas informativas, formulario sin envío, 404, un h1 por página interior y ausencia de desbordamiento horizontal.

La API rechaza orígenes externos, cantidades inválidas y stock excedido. Las pruebas de dominio comprueban variantes separadas, recálculo de subtotales y cookie inválida/manipulada sin confiar en precios del cliente.

## Comparación visual del Home

Capturas completas en `docs/verification/`, con resultados de geometría en `home-comparison.json`.

| Viewport | Hero original/migrado | Titular original/migrado | Desbordamiento | Errores JS |
|---|---|---|---|---|
| 1440×900 | 792 px / 792 px | Posición y caja iguales | Ninguno | Ninguno |
| 390×844 | 844 px / 844 px | Posición y caja iguales | Ninguno | Ninguno |

Se revisaron las capturas del Home, catálogo, colección y producto. Las diferencias deliberadas son el botón de pausa, las rutas de los destacados y la ampliación del footer con ayuda y búsqueda. La comparación no afirma equivalencia píxel a píxel: Next optimiza imágenes y el contenido nuevo amplía el footer.

Se corrigieron durante la verificación la validación de origen tras la reconstrucción interna de URLs de Next, el display/posicionamiento heredado de diálogos cerrados, el retorno de foco tras una actualización asíncrona y el relleno activo que ocultaba etiquetas en el menú de escritorio.

## Integridad del original

Se contrastaron todos los archivos extraídos con los bytes del ZIP: sin modificaciones.

SHA-256 de `reference/eulan-home-html.zip`:

```text
1a879b9aa51e06e037df23ff4d49ad88e723a1f1dfceaf2f640a37b2299dfa3a
```

## Límites de esta verificación

No hubo credenciales Shopify, pagos, pedidos, contacto enviado ni despliegue público. No se ejecutó una auditoría WCAG certificada, Lighthouse ni medición de Core Web Vitals en tráfico real. Las integraciones futuras de Medusa, Blue Express, pagos locales y Mercado Libre solo tienen contratos/documentación. Ver `shopify.md`, `medusa.md` y `architecture.md` para límites y requisitos.

## Ajuste del progreso del hero

Se conectó la barra dorada existente de cada miniatura con una animación lineal que también dispara el cambio de escena (10 s para campaña y 7,2 s para las otras escenas). Pausar/reanudar conserva el tiempo transcurrido; cambiar manualmente reinicia la barra de la escena elegida. Se respeta movimiento reducido y se detiene el avance cuando la pestaña está oculta o el hero tiene interacción de puntero/foco.

TypeScript, lint y build aprobados. Cuatro pruebas de navegador del hero aprobadas en escritorio y móvil, incluyendo progreso, transición, pausa, reanudación y movimiento reducido. Captura de comprobación al 50 %: `verification/hero-progress-desktop.png`.

### Refuerzo visual con Impeccable

A solicitud del usuario se incorporó un reloj perimetral de alto contraste, cuenta regresiva y una miniatura activa de mayor tamaño. Se revisaron las tres escenas a 1440×900 y 390×844: sin desbordamiento; capturas `hero-clock-desktop-0/1/2.png` y `hero-clock-mobile-0/1/2.png`. El detector mecánico Impeccable no reportó hallazgos en los archivos modificados. TypeScript, lint y build aprobados. Se conserva la sincronización con el cambio de escena, pausa/reanudación y preferencia de movimiento reducido.

### Corrección del borde interno

Se eliminó el elemento de la barra horizontal anterior. El indicador ahora es un trazo de 1,5 px a 2 px dentro de la miniatura, sin marco externo ni borde activo blanco fijo que aparente estar completo. La animación actúa directamente sobre el contorno medido con getTotalLength, sin viewBox/pathLength ni escalado del trazo. La finalización de esa misma animación dispara el siguiente slide.

TypeScript, lint y build aprobados. Cuatro pruebas del hero aprobadas en escritorio y móvil: ausencia de la barra antigua, grosor, posición interna, 50 % del contorno al 50 % del tiempo, transición, pausa y reanudación. Capturas: `hero-inner-desktop.png` y `hero-inner-mobile.png`.
