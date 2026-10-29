# Despacho: Shopify y Envia.com

## Estimación informativa en la ficha de producto

`DeliveryEstimator` se muestra en la ficha con un combo accesible de búsqueda por comuna. El catálogo local contiene las 346 comunas chilenas con identificador DPA, región y código regional de Envia; las sugerencias se filtran al escribir y se puede elegir con teclado o mouse. Solo después de elegir una comuna se llama la API de producción de Envia. No calcula ni modifica el checkout de Shopify, no muestra precios y no crea envíos ni etiquetas. El catálogo de 345 comunas se basa en [Open Admin Data Chile Administrative Divisions](https://github.com/open-admin-data/chile-administrative-divisions), con licencia CC BY 4.0; se incorpora Antártica (CUT `12202`) según el [catálogo de comunas del MINSAL](https://interoperabilidad.minsal.cl/fhir/ig/eis/CodeSystem-eis-comunas-cs.html).

La ficha abre con Santiago (`CL13101`) precargado y consulta su plazo automáticamente. El comprador puede editar el combo o pulsar **Usar mi ubicación**; el navegador solicitará permiso solo después de esa acción. La coordenada se compara localmente con los centroides comunales, se selecciona la comuna más cercana y al servidor de Envia se envía únicamente el identificador de comuna, nunca las coordenadas GPS.

El origen real de despacho se configura con la dirección guardada en la cuenta Envia, en Santiago y dentro de Región Metropolitana. El servidor envía los campos requeridos de remitente al endpoint de estimación; no crea etiquetas ni envíos. Para cada selección, consulta Geocodes de Envia con el nombre de la comuna y valida que el estado coincida con la región asociada a su identificador DPA; usa un código postal devuelto por Envia, nunca códigos postales inventados. Envia no documenta un endpoint separado para obtener solo el plazo: `deliveryDate` y `deliveryEstimate` llegan dentro de la respuesta de `POST /ship/rate/`. El servidor obtiene de Envia la lista de carriers para Chile y consulta cada entrada que no esté marcada explícitamente como inactiva. Solo procesa y devuelve servicio y plazo estimado; descarta `totalPrice` y no lo envía al navegador ni lo muestra. Se descartan fechas que Envia devuelva en el pasado. Se usa el plazo más rápido; la prioridad configurada desempata cuando las fechas coinciden. La disponibilidad final depende de los servicios que Envia cotice para cada comuna y paquete. En la ficha, los carriers con logo local usan imagen; los demás se muestran con su nombre.

La relación entre códigos regionales DPA y Envia se validó con `GET /state?country_code=CL` y permite distinguir nombres de comuna repetidos. Geocodes decide el código postal de destino al cotizar.

La estimación del carrier se trata como tránsito desde el momento de cotización. El Route Handler añade las horas de preparación y el corte una sola vez, porque esos valores no se envían al endpoint de Envia. `deliveryDate.date` prevalece sobre `deliveryEstimate`; cuando solo hay un rango, se comunica el inicio del rango, en días hábiles. Los cálculos locales usan `America/Santiago`, fines de semana y feriados nacionales recurrentes chilenos (incluido el solsticio de invierno, Semana Santa, los casos de 17/20 de septiembre y 2 de enero, y los traslados legales de San Pedro y San Pablo y del 12 de octubre). Los plazos siguen siendo estimaciones del carrier y pueden variar.

La caché TTL de cotizaciones, ubicaciones y carriers es de 6 horas por defecto; las respuestas sin una tarifa útil se conservan hasta 15 minutos. La caché vive en memoria del proceso Node. No hace consultas por cada visita ni al render inicial de la ficha; solo se actualiza tras seleccionar una comuna y vuelve a consultar al vencer la caché. En despliegues serverless cada instancia mantiene su propia caché en memoria.

Los plazos se muestran como “Llega mañana”, como día de la semana cuando el destino está dentro de la semana actual o como fecha `DD/MM` para semanas posteriores. El logo local que acompaña al plazo se carga según el courier seleccionado. Fuentes visuales: [CorreosChile](https://www.correos.cl/documents/20123/1231365/logo_correos.svg), [Blue Express](https://www.greatplacetowork.cl/certificacion/bluexpress/), [Starken](https://www.radioagricultura.cl/programas/tendencias-programas/starken-da-nuevo-salto-crea-division-internacional-para-potenciar-servicio-a-empresas-pymes-y-personas_20231220/) y [Chilexpress](https://www.biobiochile.cl/assets/logos-notas-patrocinadas/6613636_logo_img_patrocinada.png).

### Datos que faltan en el entorno actual

El `.env.local` del entorno local contiene credenciales de Envia y no se debe versionar. Configura la dirección de origen real, las horas de preparación y la hora de corte en el entorno servidor. No reutilices el token Storefront/Admin de Shopify como token Envia y no pongas el token en variables `NEXT_PUBLIC_*`.

```dotenv
ENVIA_TOKEN=                           # Token de producción de Envia
ENVIA_ORIGIN_NAME=                     # Nombre del remitente
ENVIA_ORIGIN_PHONE=                    # Teléfono del remitente
ENVIA_ORIGIN_STREET=                   # Calle de despacho
ENVIA_ORIGIN_NUMBER=                   # Número de calle
ENVIA_ORIGIN_CITY=                     # Comuna/ciudad de despacho
ENVIA_ORIGIN_STATE=                    # Código Envia de región, por ejemplo RM
ENVIA_ORIGIN_POSTAL_CODE=              # Código postal de despacho
ENVIA_PREPARATION_HOURS=1              # Horas de preparación asumidas con fulfillment (entero entre 0 y 24)
ENVIA_CUTOFF_TIME=                     # Corte diario HH:MM, hora America/Santiago
```

El paquete inicial se configura en `.env.example`: contenido “Joyería”, 20 × 20 × 20 cm, 0,4 kg, una unidad. `ENVIA_CACHE_TTL_SECONDS` controla la duración (por defecto 21600); `ENVIA_COURIER_PRIORITY` fija el desempate. El contenido, las dimensiones, el peso y la cantidad se ajustan con `ENVIA_PACKAGE_CONTENT`, `ENVIA_PACKAGE_LENGTH_CM`, `ENVIA_PACKAGE_WIDTH_CM`, `ENVIA_PACKAGE_HEIGHT_CM`, `ENVIA_PACKAGE_WEIGHT_KG` y `ENVIA_PACKAGE_AMOUNT`.

Envia documenta un entorno de prueba separado que devuelve datos simulados. El cotizador no acepta ese host: solo llama `https://api.envia.com` para no presentar simulaciones como plazos reales. Las pruebas automatizadas validan normalización, días hábiles, búsqueda por comuna y selección; las cotizaciones reales se validan con el token y el origen del entorno local.

## Configurar medidas en Shopify

Ejecutar `npm run shipping:setup-products` actualiza solo variantes físicas (`inventoryItem.requiresShipping === true`) mediante Shopify Admin GraphQL `productVariantsBulkUpdate`. Usa Shopify CLI con la versión estable `2026-04` de forma predeterminada y rechaza `2027-01`. `npm run shipping:setup-products -- --export-only` realiza solo el respaldo paginado, sin mutaciones.

Antes de mutar, el script comprueba la sesión y los scopes `read_products`, `write_products`, `read_inventory` y `write_inventory`; exporta productos y variantes con datos originales a `backups/shopify-products-shipping-<fecha>.json` con permisos locales restringidos. Después actualiza el peso nativo a 400 g, crea/usa `custom.package_length`, `custom.package_width` y `custom.package_height` de tipo `dimension` con 20 cm, y vuelve a paginar para verificar cada variante física. No modifica precio, inventario, SKU, imágenes, descripciones ni opciones. El respaldo se excluye de Git.

Para autenticar Shopify CLI en la tienda configurada:

```sh
npm run shopify -- store auth --store "$SHOPIFY_STORE_DOMAIN" --scopes read_products,write_products,read_inventory,write_inventory
```

La CLI administra su sesión fuera del repositorio. No copies un token Admin al frontend ni a archivos versionados. Si hay datos comerciales que no deben cambiar, confirma la tienda antes de ejecutar el script: la operación modifica todas sus variantes físicas.

## Productos de Ecommerce Pro

La ayuda oficial de Envia describe el editor masivo dentro de Ecommerce Pro y la carga mediante plantilla Excel. La plantilla incluye `ID`, `Shop ID`, `Name` y `SKU` como datos no editables; las variantes requieren filas y medidas propias. La ayuda indica además que los cambios de Shopify no se sincronizan automáticamente a Envia.

No hay una API de catálogo de Ecommerce Pro documentada en la referencia oficial consultada; por eso este repositorio no inventa IDs ni Shop IDs ni presenta una sincronización que no existe. Para crear un XLSX importable conservando los identificadores reales, se necesita exportar la hoja oficial de la cuenta desde **Productos → Exportar XLSX** y adjuntarla aquí. Ese archivo contiene los IDs/Shop IDs de Envia que el repositorio no puede leer sin la sesión de esa cuenta. Hasta recibirlo, no se ha creado un XLSX incompleto o con datos inventados. Como alternativa, Envia documenta **Productos → Edición masiva** para ajustar medidas en cuenta, pero indica que las variantes se editan individualmente.
