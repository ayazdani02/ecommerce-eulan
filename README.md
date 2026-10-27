# EULÁN — e-commerce

Tienda Next.js 16 con App Router, React, TypeScript estricto y la identidad del Home original. Funciona sin credenciales en modo demostración. Integración Shopify mediante Hydrogen React aislada en la capa commerce; preparada para una futura adaptación a Medusa v2.

## Ejecutar

Node.js 22.14 o superior, npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Abrir http://localhost:3000. No necesitas tokens para el modo mock. Para una compilación de producción:

```sh
npm run build
npm start
```

## Comprobaciones

```sh
npm run typecheck
npm run lint
npm test
npm run build
# Con el servidor local en ejecución:
npm run test:e2e
```

Las pruebas de navegador usan Google Chrome instalado en macOS. En otro sistema define `PLAYWRIGHT_CHROME_PATH` con su ejecutable o cambia la configuración para usar un navegador Playwright instalado. `TEST_BASE_URL` permite otro servidor. No se añade un navegador al bundle de producción.

## Incluido

- Home migrado desde el original, tres escenas y carrusel de destacados.
- Catálogo con filtros, ordenamiento, búsqueda y estados vacíos.
- Colecciones editoriales, fichas, variantes, disponibilidad y relacionados.
- Carrito lateral y completo, persistencia, cantidades, eliminación y subtotal CLP.
- Sobre EULÁN, contacto, preguntas frecuentes, envíos, devoluciones, cuidados, privacidad, términos y 404.
- SSR, metadatos, canonical, Open Graph, sitemap, robots, imágenes optimizadas y fuentes locales.
- Shopify Storefront: catálogo y carrito reales configurables, checkout seguro delegado a Shopify.

## Referencia y documentación

La copia intacta del ZIP y su extracción están en `reference/`. Las licencias de fuentes e iconos se conservan junto a los recursos. El CSS de la migración conserva las reglas originales, adaptando rutas y selectores del antiguo body al frame de App Router; las extensiones están en `src/app/storefront.css`.

- [Arquitectura](docs/architecture.md)
- [Sistema de diseño](docs/design-system.md)
- [Integrar Shopify y desplegar en Vercel](docs/shopify.md)
- [Adaptar a Medusa v2](docs/medusa.md)
- [Registro de verificación](docs/verification.md)
- [Reglas permanentes](AGENTS.md)

## Antes de vender

Los productos mock, precios, stock, variantes e imágenes conceptuales son provisionales. Los textos comerciales y las políticas requieren confirmación de la marca. El modo mock bloquea pagos y envía noindex. Contacto prepara un correo local únicamente si se configura NEXT_PUBLIC_CONTACT_EMAIL; no hay servicio de envío de mensajes.

Shopify no se ha probado con credenciales reales. Deben validarse la tienda, inventario, checkout, pagos y despachos en un entorno de prueba antes de activar ventas. La configuración Shopify falla de forma visible; nunca se sustituye silenciosamente por mock. Blue Express, Mercado Pago y Mercado Libre no están conectados. No se realizó un despliegue.
