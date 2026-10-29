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
- `src/integrations/envia`: cliente servidor para estimaciones informativas de entrega. No crea envíos ni interviene en el checkout; requiere token y origen configurados.

## Flujo

Página de servidor → CommerceProvider → adaptador → modelos propios → componentes visuales.

Carrito cliente → Route Handler con validación de origen y cuerpo → proveedor → cookie HttpOnly, SameSite=Lax, Secure en producción → carrito normalizado. Las cookies se separan por proveedor para no confundir IDs. El catálogo mock no tiene base de datos ni acepta pedidos.

`checkout` devuelve una unión discriminada: redirect (Shopify), unavailable (mock), session (reserva para futuros flujos propios). La UI no presupone que todos los proveedores usan URLs de checkout.

## Límites actuales

Shopify se configura en servidor y falla de forma visible si faltan credenciales. El catálogo Shopify del adaptador consulta hasta 100 variantes y diez imágenes por producto; el script de medidas de envío tiene paginación independiente completa. El listado de productos consulta 100 por página; las colecciones se consultan hasta 100. El estimador de entrega llama Envia solo tras selección de región y requiere `ENVIA_TOKEN`, origen y preparación/corte documentados en `shipping.md`; sus tarifas no afectan el checkout.

No se implementan sesiones de clientes ni pedidos; `/cuenta` delega el acceso al login alojado en Shopify a través del CommerceProvider, sin hardcodear el dominio en los componentes. En modo mock muestra que el acceso no está configurado. Los favoritos se guardan localmente en el navegador y no se sincronizan con cuentas ni dispositivos. Tampoco hay webhook de inventario, traducciones múltiples, Blue Express, Mercado Pago ni Mercado Libre. Shopify gestiona precios y disponibilidad finales del checkout. Contacto prepara un correo local y no envía datos a un servidor.

## Seguridad y operación

Tokens solo servidor, import `server-only`, imágenes remotas restringidas a Shopify CDN, validación de cantidades, timeouts de API, errores controlados, cabeceras de seguridad. Sin SDK Shopify en componentes visuales. No se almacena información de pago. No hay analítica ni trackers. Sitemap y canonical dependen de NEXT_PUBLIC_SITE_URL. Modo mock con noindex. Revisar contenido oficial y políticas antes de publicar.
