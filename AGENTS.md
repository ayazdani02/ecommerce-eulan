<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# EULÁN — reglas prioritarias

1. El Home original en `reference/eulan-home-html/` es la referencia visual de EULÁN. El ZIP y su extracción se conservan intactos.
2. Todas las nuevas páginas deben respetar esa identidad: Outfit, Manrope, marfil, oliva oscuro, fotografía protagonista y ritmo editorial.
3. No introducir diseños genéricos ni rediseñar el Home sin solicitud explícita.
4. No acoplar los componentes visuales directamente a Shopify. Solo `src/commerce/adapters/shopify.ts` puede importar Hydrogen o tipos Shopify.
5. Mantener TypeScript estricto y componentes reutilizables.
6. Comprobar el resultado visual y funcional después de cambios importantes, en escritorio y móvil.
7. La imagen principal de cada producto Shopify, usada en el carrusel de portada y las tarjetas de catálogo, debe tener fondo blanco puro uniforme (#FFFFFF), encuadre cuadrado y producto completo centrado. No usar marfil, lino, piedra, fondos texturados ni utilería en esa imagen. Conservar la pieza exacta de las fotos fuente; las fotos de estilo de vida van después en la galería.

## Ejecución

- Node >=22.14; `npm ci`, `npm run dev`.
- Verificaciones: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`.
- Leer los documentos de `docs/` antes de alterar arquitectura o identidad.
- Precios, stock, imágenes y textos mock son provisionales. Nunca convertirlos en condiciones comerciales definitivas.
- No guardar tokens ni datos de clientes en el repositorio. Variables privadas solo en servidor.
- El checkout se inicia por CommerceProvider.checkout. El modo mock nunca cobra.
- Shopify configurado que falla debe informar el error, nunca sustituirlo silenciosamente por datos mock.
- Conservar CSS original en `src/app/original.css`, solo ajustar rutas de recursos y selectores necesarios para App Router; extender en `storefront.css`.
- No añadir dependencias de animación o UI sin una necesidad concreta.
- Integraciones Blue Express, pagos locales, Mercado Libre y Medusa: solo puertos/documentación hasta nueva autorización de implementación.
