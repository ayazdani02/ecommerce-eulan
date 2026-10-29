# Conectar Shopify

## Biblioteca y documentación

Se usa `@shopify/hydrogen-react` 2026.4.4 en el adaptador de servidor para obtener URL y cabeceras de Storefront API. Es la biblioteca Hydrogen para una aplicación Next.js, sin instalar el framework de rutas Hydrogen/React Router ni acoplar la presentación a Shopify.

Fuentes oficiales verificadas:

- [createStorefrontClient y ejemplo Next.js](https://shopify.dev/docs/api/hydrogen-react/latest/utilities/createstorefrontclient)
- [Referencia Storefront API](https://shopify.dev/docs/api/storefront/latest)
- [Next.js App Router](https://nextjs.org/docs/app/getting-started)

## Configuración

1. En Shopify preparar una tienda con mercado Chile, español y precios en CLP. Crear un canal Headless y obtener un token **privado de Storefront**, no un token Admin.
2. Publicar productos y colecciones en ese canal y habilitar los permisos de catálogo de Storefront API. El catálogo usa `availableForSale` para mostrar disponibilidad; no necesita leer el número exacto de unidades. Si más adelante se quiere consultar `quantityAvailable`, habilitar también `unauthenticated_read_product_inventory` en los permisos del canal Headless.
3. Copiar `.env.example` a `.env.local`. Definir:
   - `COMMERCE_PROVIDER=shopify`
   - `SHOPIFY_STORE_DOMAIN=nombre.myshopify.com` (solo hostname, sin https ni rutas)
   - `SHOPIFY_PRIVATE_STOREFRONT_TOKEN` (solo servidor)
   - `SHOPIFY_STOREFRONT_API_VERSION=2026-04`
   - `NEXT_PUBLIC_SITE_URL` con el dominio real
4. Crear colecciones con handles `aros` y `collares` para la navegación original. Definir Product type como `aros` o `collares`. Se admiten más categorías en el catálogo, pero la navegación editorial fija conserva las dos del Home.
5. Usar nombres de opciones legibles en español. El filtro específico de acabado usa la opción `Acabado`; las demás opciones se muestran en los nombres de variantes.
6. Configurar `custom.material_attributes` como lista de texto de una línea, con acceso Storefront, para guardar cada material/atributo como un valor independiente y poder usarlo como fuente de filtros. La ficha muestra cada valor junto al precio. `custom.materials` es el metafield de texto largo para la sección desplegable de materiales y características; `custom.care` contiene cuidados. En la app Search & Discovery se debe añadir la definición como filtro; el storefront Next.js requiere conectar ese filtro a su propio catálogo para mostrarlo a los clientes.
7. Usar imágenes en `cdn.shopify.com`. Si se usa otra CDN, autorizar su dominio explícitamente en next.config.ts.
8. Reiniciar el servidor y probar catálogo, producto, variantes, stock, carrito y checkout en una tienda de desarrollo. El Home consulta los primeros cinco productos del proveedor para sus destacados; no traslada precios/descuentos mock a Shopify.

El acceso a clientes no crea sesiones en el storefront Next.js: la ruta `/cuenta` delega al login alojado en Shopify usando el dominio configurado en `SHOPIFY_STORE_DOMAIN`. En modo mock la página informa que el acceso aún no está habilitado.

## Instrucción obligatoria para la imagen principal de producto

El primer medio de cada producto Shopify (`images[0]` / imagen destacada) es el que muestran el carrusel de portada y las tarjetas del catálogo. Debe tener formato cuadrado 1:1, fondo blanco puro y uniforme `#FFFFFF`, y mostrar la pieza completa, centrada y claramente reconocible. No usar fondo marfil, beige, lino, piedra, textura, gradiente ni utilería en la imagen principal. Las fotos de modelo, detalles y estilo de vida pueden ir después en la galería.

Plantilla reutilizable para generar o editar esa imagen:

> Crea una fotografía cuadrada 1:1 de catálogo para la imagen principal del producto. Usa las fotos fuente como referencia exacta y conserva sin cambios el diseño, la geometría, las proporciones, el color y el acabado reales de la pieza; no añadas ni elimines componentes. Muestra el producto completo, centrado, con margen uniforme y luz de estudio suave. Usa un fondo blanco puro sólido y homogéneo (#FFFFFF), sin textura, degradado, superficie marfil, tela, piedra, utilería ni dominante cálida. Sin personas, texto, logo ni marca de agua. Si no se puede conservar fielmente el producto, no inventes una versión nueva: prepara la foto original sobre blanco.

Antes de fijarla como medio principal, comprobar visualmente que el fondo sea blanco puro, el producto esté completo y la imagen esté lista para mostrarse en una tarjeta pequeña. No ordenar una imagen marfil o de estilo de vida como primera imagen.

## Shopify CLI para operaciones de catálogo

Shopify CLI está instalado como dependencia de desarrollo del proyecto. Ejecuta `npm run shopify -- version` para revisar la versión. El comando `npm run shopify -- store execute` permite realizar operaciones Admin API sin incorporar credenciales Admin a Next.js ni al archivo `.env.local`.

La sesión de la tienda se autentica con los permisos mínimos usados para productos e inventario:

```sh
SHOPIFY_CLI_NO_ANALYTICS=1 npm run shopify -- store auth --store gg0kzc-em.myshopify.com --scopes write_products,write_inventory
```

Shopify CLI conserva la sesión en su almacén local de credenciales. Si expira o deja de tener esos permisos, vuelve a ejecutar la autenticación y aprueba los scopes en Shopify. Las mutaciones quedan bloqueadas por defecto; para operaciones que escriben datos, `store execute` requiere `--allow-mutations`. Mantén los comandos restringidos al catálogo de prueba hasta que los datos comerciales estén confirmados.

## Checkout

El adaptador crea y modifica un Cart remoto con contexto Chile. El navegador recibe un modelo propio, y una cookie HttpOnly guarda el ID del carrito. Al iniciar pago, el servidor vuelve a consultar el carrito y devuelve el checkoutUrl seguro de Shopify. Los dominios permitidos actualmente son el dominio myshopify.com configurado, subdominios myshopify.com, checkout.shopify.com y shop.app. Si la tienda utiliza un dominio de checkout propio, agregarlo explícitamente a la validación tras verificarlo.

No se implementa un formulario de tarjetas. Blue Express, Mercado Pago y otros proveedores chilenos se configuran o integran en una fase posterior. No se han realizado cobros ni probado credenciales reales en este proyecto.

## Publicación en Vercel

Importar esta carpeta como proyecto Next.js, usar Node 22, build `npm run build`. Definir las variables en cada entorno. El mock no necesita secretos. Configurar el dominio canónico, validar las políticas oficiales y reemplazar las imágenes/textos conceptuales antes de activar ventas. La campaña y los bloques editoriales originales contienen atributos de material que la marca debe confirmar. Esta tarea no publica la tienda ni crea un proyecto Vercel.

## Verificación pendiente en backend real

- Token, scopes, publicación de productos y permisos de metafields.
- Consulta de inventario y comportamiento de stock de la tienda.
- Checkout seguro y pagos en modo prueba.
- Tarifas, impuestos, políticas y cobertura de despacho.
- Paginación adicional si un producto supera 100 variantes o hay más de 100 colecciones.
