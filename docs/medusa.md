# Migración futura a Medusa v2

No se instaló ni implementó Medusa. El contrato `CommerceProvider` es el punto de sustitución, y `adapters/medusa.md` identifica dónde implementar el adaptador.

1. Crear `adapters/medusa.ts`, solo servidor, que implemente productos, variantes, colecciones, disponibilidad, carrito y checkout con los modelos propios de `models.ts`.
2. Mapear región Chile, moneda CLP, sales channel e inventario al dominio; no trasladar tipos del SDK a componentes.
3. Traducir las unidades monetarias según la API/configuración real de Medusa. Validar CLP con pruebas de contrato; no asumir que Shopify y Medusa usan la misma representación de importes.
4. Conservar el carrito remoto en una cookie separada (`eulan-cart-medusa`). No reutilizar IDs Shopify. Decidir cómo comunicar o migrar una selección previa.
5. Implementar el flujo de checkout propio: dirección, despacho, colección/sesión de pago, confirmación e idempotencia. Devolver `CheckoutResult.type = session` y construir la ruta de checkout que consuma esa sesión. Medusa no ofrece necesariamente un checkoutUrl equivalente al de Shopify.
6. Registrar el adaptador en `provider.ts` al terminar las pruebas. Los componentes de catálogo y producto siguen consumiendo Product, Variant y Cart propios.
7. Ampliar CartProvider para resolver el caso `session` una vez que existan sus pantallas. Hoy informa que el flujo todavía no está habilitado.

Blue Express: implementar ShippingProvider para cotización, etiquetas y seguimiento cuando se autorice. Pagos locales: implementar PaymentProvider según el proveedor y requisitos de backend. Mercado Libre: implementar MarketplaceConnector con credenciales, stock y pedidos desde backend, no desde componentes.

Criterio de aceptación: repetir pruebas de catálogo, disponibilidad, variantes, subtotales, cantidades, expiración del carrito, pago idempotente y estados de error. Mantener comparación visual con el Home original.
