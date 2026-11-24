# Rediseño de interfaz y experiencia de ChromaToken

## Por qué

El cliente pidió dos cosas:

1. Que la interfaz deje de parecer una copia de las herramientas en las que se inspiró.
2. Que, al unir dos herramientas en una, la experiencia quede mejor que la de cada una por separado.

Antes de este cambio, la pantalla de paleta replicaba casi pieza por pieza un generador de paletas conocido: columnas de color a sangre de borde a borde, el código HEX grande y centrado abajo, y los botones de bloquear, ajustar y copiar en el centro. Hasta la interfaz y los metadatos decían «Modo Coolors» y «al estilo Coolors». El resto de la app tenía el aspecto genérico de las plantillas SaaS: gris pizarra oscuro sobre blanco, Plus Jakarta Sans con DM Sans, etiquetas en mayúsculas por todas partes y secciones numeradas 01, 02, 03.

Además había problemas de uso:

- Tres pantallas que se sentían desconectadas, con la navegación de móvil duplicada fuera de la cabecera.
- Mover un color de rol requería pulsar flechas varias veces.
- Las paletas base estaban en un `<select>` que solo mostraba nombres, sin los colores.
- La barra lateral del sistema era un solo scroll largo, y «Compartir» quedaba escondido al final.
- La barra espaciadora generaba una paleta nueva incluso con un botón enfocado, así que a veces lo activaba dos veces.

Para orientar el rediseño usé las reglas de dirección de arte de la skill `awwwards` ([juliobsz/skills](https://github.com/juliobsz/skills)), sobre todo su lista de patrones que delatan una interfaz genérica o generada.

## Identidad visual

| Antes | Ahora | Motivo |
| --- | --- | --- |
| Gris pizarra 900 sobre blanco | Fondo gris papel `#EEEDE8`, tinta `#161614` y un único naranja de señal `#FF5B2E` | La paleta del usuario es la protagonista. La interfaz se mantiene neutra, y el acento se reserva para la acción principal (Generar), el paso activo y el foco. |
| Plus Jakarta Sans + DM Sans + JetBrains Mono | Archivo (corte ancho en títulos) + Geist Mono | Le da a la marca una voz propia y evita la combinación más repetida en plantillas SaaS. Geist Mono con cifras tabulares mantiene alineados los HEX y los ratios. |
| Logotipo de solo texto | Isotipo construido en vivo con los 4 colores de la paleta, y favicon a juego | La marca refleja el trabajo del usuario y deja de ser un texto genérico. |
| Secciones numeradas 01–05 y títulos en Title Case | Títulos en frase normal, sin numeración decorativa | Las secciones no son una secuencia, así que numerarlas era ruido y una señal clara de plantilla. |

Los tokens de la interfaz están definidos en `src/index.css` dentro de `@theme`, de modo que Tailwind los expone como clases (`bg-ground`, `text-ink`, `border-line`, `bg-signal`…).

## Paso 1: Color

### Roles fijos y colores que se arrastran

**Pedido explícito:** las columnas se movían con flechas y debían moverse arrastrando y soltando.

- Cada rol (Primary, Secondary, Accent, Neutral) es ahora un espacio fijo, con su nombre y su descripción arriba. Lo que se arrastra es el color, desde el asa ⋮⋮.
- Al soltar un color en otro rol, el color y su candado se mueven a ese rol. Los roles no cambian de sitio. Así se entiende qué pasa: estás reasignando qué color cumple cada función.
- Para esto se usa `@dnd-kit` (core + sortable), por tres razones:
  - Funciona con ratón, con pantalla táctil (`touch-action: none` en el asa) y con teclado: se enfoca el asa, Espacio para tomar el color, flechas para moverlo y Espacio para soltarlo.
  - Los anuncios para lectores de pantalla están en español.
  - La copia flotante y el hueco de destino dejan claro dónde va a caer el color.
- Cada movimiento queda en el historial, así que se puede deshacer.

### Tarjeta de color

- El HEX está alineado a la izquierda, con el nombre del color debajo. Abandona el HEX centrado abajo del original.
- Dos muestras «Aa» enseñan el contraste real del texto blanco y del texto oscuro sobre ese color, con el ratio y una etiqueta: **AAA**, **AA**, **Grande** (solo pasa en texto grande) o **No**. Antes eran dos números sueltos, difíciles de interpretar.
- La escala 50–950 va integrada en el borde inferior de la tarjeta, y un clic en un tono lo aplica. Antes esta escala solo aparecía dentro del panel de ajuste.
- El ajuste de matiz, saturación y luminosidad se abre sobre la tarjeta y se cierra con Escape. Cada barra muestra su propio degradado: la de saturación va del gris al color pleno, y la de luminosidad, del oscuro al claro.

### Barra de herramientas

- Las reglas de armonía son botones visibles, con una pista de qué hace cada una, en vez de un `<select>` oculto.
- «Paletas base» abre un menú que muestra los cuatro colores de cada opción, no solo el nombre.
- Atajos:
  - **Espacio** genera una paleta nueva.
  - **Ctrl/Cmd+Z** deshace.
  - **Ctrl/Cmd+Shift+Z** o **Ctrl+Y** rehacen.
- **Corrección:** Espacio ya no se pierde ni se duplica.
  - Tras hacer clic con el ratón en un botón (por ejemplo, el candado), Espacio sigue generando, como espera el usuario.
  - Cuando se navega con teclado, Espacio activa el botón enfocado.
  - En el asa de arrastre, Espacio arrastra.
- Si todos los colores están bloqueados, «Generar» avisa en lugar de no hacer nada.

## Paso 2: Sistema

- La barra lateral se divide en tres pestañas: **Color**, **Tipografía** y **Forma**. Antes era un scroll largo donde los ajustes tipográficos quedaban lejos de la vista previa.
- El nombre del sistema se edita directamente en un título grande.
- Las opciones de radio muestran una esquina con la curva real. Las de elevación muestran una muestra con la sombra aplicada.
- La muestra tipográfica usa el nombre del sistema y un fragmento de código con la fuente monoespaciada.
- La vista previa tiene su propia barra con los modos Claro, Oscuro y Ambos, más un botón «Siguiente: exportar».

## Paso 3: Exportar

- Exportar tiene ahora su propia pantalla. Antes eran pestañas mezcladas con la vista previa visual.
- Cada formato es una tarjeta que explica para qué sirve: Variables CSS, Tailwind v4, JSON W3C y Markdown.
- El visor de código tiene números de línea y muestra el tamaño del archivo, con botones para copiar y descargar.
- Un bloque «Enlace editable» explica qué hace el enlace para compartir.

## Navegación y respuesta

- La cabecera tiene un indicador de pasos (1 Color · 2 Sistema · 3 Exportar) que es el mismo control en escritorio y en móvil, y reemplaza al selector duplicado.
- «Compartir» está siempre visible en la cabecera.
- Copiar, compartir y aplicar una paleta muestran un aviso breve, que también se anuncia a lectores de pantalla.

## Accesibilidad

- Un enlace «Saltar al área de trabajo».
- Foco visible en naranja en toda la interfaz.
- Los grupos de opciones usan `radiogroup` y los botones con estado usan `aria-pressed`.
- Las pestañas usan `tablist` y `tabpanel`, y los paneles flotantes usan `role="dialog"` y se cierran con Escape.
- Los botones de solo icono tienen `aria-label` y `title`.
- Las animaciones se desactivan con `prefers-reduced-motion`.
- A 390 px de ancho no hay desplazamiento horizontal.

## Lo que no cambió

- **Lógica:** el motor de color, la generación de escalas, los exportadores y el formato del enlace compartido son los mismos. Los enlaces y el estado guardado en `localStorage` siguen funcionando.
- **Vista previa:** la vista que aplica los tokens del usuario (`VisualShowcaseSurface`) conserva su diseño, porque la pinta el propio sistema del usuario. Solo cambió el texto.

## Archivos

| Archivo | Cambio |
| --- | --- |
| `src/components/PaletteBoard.tsx` | Nuevo. Reemplaza a `CoolorsGenerator.tsx`. |
| `src/components/ExportPanel.tsx` | Nuevo. Reemplaza a `ExportCodeView.tsx` y a las pestañas de código de `PreviewCanvas`. |
| `src/components/Toast.tsx` | Nuevo. Avisos breves. |
| `src/components/TopBar.tsx` | Indicador de pasos, isotipo en vivo y botón Compartir. |
| `src/components/StudioSidebar.tsx` | Pestañas y nuevos controles. |
| `src/components/PreviewCanvas.tsx` | Solo vista previa, con selector de modo. |
| `src/App.tsx` | `handleMoveColor` (reasignar colores entre roles), avisos y navegación. |
| `src/index.css`, `index.html`, `public/favicon.svg`, `metadata.json` | Tokens de la interfaz, tipografías, favicon y textos sin referencias a terceros. |

## Cómo se verificó

- `tsc --noEmit` y `vite build` terminan sin errores.
- Pruebas automáticas en Chrome sin interfaz gráfica:
  - Arrastre con ratón del rol 1 al 3: correcto.
  - Arrastre con teclado del rol 4 al 3: correcto.
  - Espacio genera una paleta nueva.
  - Tras hacer clic en un candado, Espacio genera y respeta el color bloqueado.
  - Sin desbordamiento horizontal a 390 px.
  - Sin errores en consola.
