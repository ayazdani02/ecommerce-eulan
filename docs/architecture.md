# Arquitectura

Next.js 16, App Router, React 19, TypeScript estricto y CSS original. Vercel es el destino de despliegue; no se publica automáticamente. Se evita Tailwind/Motion adicional porque el CSS y las transiciones existentes resuelven la necesidad sin dependencias nuevas.

## Capas

- `src/app`: páginas SSR, metadatos, rutas API y estados de navegación.
- `src/components`: presentación reutilizable. Solo importa modelos y utilidades de dominio.
- `src/commerce/models.ts`: Product, Variant, Money, Collection, Cart y CommerceProvider.
- `src/commerce/provider.ts`: selección explícita por variable de entorno, solo servidor.
- `src/commerce/adapters/mock.ts`: catálogo de seis piezas de referencia, stock de demostración y carrito serializado en cookie HttpOnly. Los importes siempre se recalculan desde catálogo; no se confía en precios del navegador.
- `src/commerce/adapters/shopify.ts`: cliente Hydrogen React, Storefront GraphQL, normalización, carrito remoto y redirección a checkout.
- `src/integrations/contracts.ts`: contratos sin implementación para envíos, pagos y marketplace.

## Flujo

Página de servidor → CommerceProvider → adaptador → modelos propios → componentes visuales.

Carrito cliente → Route Handler con validación de origen y cuerpo → proveedor → cookie HttpOnly, SameSite=Lax, Secure en producción → carrito normalizado. Las cookies se separan por proveedor para no confundir IDs. El catálogo mock no tiene base de datos ni acepta pedidos.

`checkout` devuelve una unión discriminada: redirect (Shopify), unavailable (mock), session (reserva para futuros flujos propios). La UI no presupone que todos los proveedores usan URLs de checkout.

## Límites actuales

Shopify se configura en servidor y falla de forma visible si faltan credenciales. No se ha probado contra una tienda real. Los productos Shopify consultan hasta 100 variantes y diez imágenes por producto; antes de usar catálogos con más variantes debe añadirse paginación de variantes. El listado recorre páginas de 100 productos; para catálogos grandes conviene trasladar filtros y paginación al proveedor. Las colecciones se consultan hasta 100.

No se implementan sesiones de clientes ni pedidos; el icono de cuenta enlaza al login alojado en Shopify. Los favoritos se guardan localmente en el navegador y no se sincronizan con cuentas ni dispositivos. Tampoco hay webhook de inventario, traducciones múltiples, Blue Express, Mercado Pago ni Mercado Libre. Shopify gestiona precios y disponibilidad finales del checkout. Contacto prepara un correo local y no envía datos a un servidor.

## Seguridad y operación

Tokens solo servidor, import `server-only`, imágenes remotas restringidas a Shopify CDN, validación de cantidades, timeouts de API, errores controlados, cabeceras de seguridad. Sin SDK Shopify en componentes visuales. No se almacena información de pago. No hay analítica ni trackers. Sitemap y canonical dependen de NEXT_PUBLIC_SITE_URL. Modo mock con noindex. Revisar contenido oficial y políticas antes de publicar.
