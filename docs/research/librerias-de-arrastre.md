# Librerías de arrastre con soporte táctil, de teclado y de lector de pantalla

Investigación para el issue #2. Datos a fecha de 2026-10-30.

Pregunta: ¿qué librerías de arrastre para la web permiten mover Pendientes entre Etapas y reordenar Etapas, con soporte real de táctil, teclado y lector de pantalla?

Este documento compara; no elige. La decisión de stack queda fuera de su alcance.

## Cómo leer las marcas

| Marca | Significado |
| --- | --- |
| **[V]** | Verificado en fuente primaria: documentación oficial, código publicado, repositorio, registro npm o especificación. |
| **[M]** | Medido o calculado aquí a partir de artefactos publicados. |
| **[I]** | Inferencia a partir de datos verificados. |
| **[R]** | Informe de usuarios o agregador de terceros; indica un riesgo, no confirma un comportamiento. |
| **[N]** | No verificado en fuente primaria. |

**Límite general:** no se ha ejecutado ninguna librería. Nada se ha probado en dispositivos reales ni con NVDA, JAWS, VoiceOver o TalkBack. «Soporte de serie» significa aquí «lo que declara la documentación o aparece en el código», no «comprobado en uso».

Los términos de cada librería (`column`, `item`, `Droppable`) se mantienen solo al citar su API. En lo demás se usa el vocabulario de `CONTEXT.md`: Tablero, Etapa, Pendiente.

## Hallazgos que afectan a todas

1. **Ninguna cubre WCAG 2.2 por sí sola.** El criterio 2.5.7 (nivel AA) exige lograr con un solo puntero, sin arrastrar, todo lo que se hace arrastrando. W3C aclara que la equivalencia por teclado no lo cumple automáticamente, y pone como ejemplos un tablero kanban con botones de mover y un menú emergente para llevar el elemento a otra columna **[V]** ([W3C 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)). No se ha encontrado en ninguna candidata un control de este tipo que funcione de serie **[I]**. La app tendrá que aportar algo como «Mover a…» para Pendientes y para Etapas.
2. **Español a cargo de la app, salvo React Aria.** dnd-kit y `@hello-pangea/dnd` traen sus textos en inglés **[V]**. `svelte-dnd-action` también cae a inglés si faltan cadenas **[V]**. Pragmatic no trae textos. React Aria publica traducciones `es-ES` **[V]**.
3. **La API nativa de arrastre condiciona el táctil.** Pragmatic y React Aria dependen de ella **[V]**. Según caniuse no hay soporte en Firefox para Android 159 ni en Samsung Internet, y sí en iOS Safari desde 15 y Chrome para Android **[R]** ([datos](https://github.com/Fyrd/caniuse/blob/main/features-json/dragndrop.json)). dnd-kit usa eventos de puntero **[V]** y SortableJS tiene su propio mecanismo alternativo **[V]**, así que no dependen de esa tabla **[I]**.
4. **Otros criterios siguen siendo de la app.** Objetivos de 24 × 24 px como mínimo (2.5.8, AA) **[V]** ([W3C 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)), mensajes de estado detectables por tecnología de apoyo (4.1.3, AA) **[V]** ([W3C 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)) y gestión del foco tras cada movimiento.

## Candidatas y mantenimiento

Fechas de publicación tomadas del registro npm; actividad, del API de GitHub **[V]**.

| Librería | Versión vigente | Publicada | Último commit | Estrellas / issues abiertos | Estado |
| --- | --- | --- | --- | --- | --- |
| dnd-kit nuevo (`@dnd-kit/dom`, `/react`, `/vue`, `/svelte`, `/solid`) | 0.5.1 (beta diaria 0.5.2) | 2026-10-15 | 2026-10-30 | 17 763 / 138 | Muy activo. Sigue en 0.x y la API aún cambia: la 0.4.0 sustituyó tipos de eventos y movió `feedback`. |
| dnd-kit legado (`@dnd-kit/core`, `/sortable`) | 6.3.1 y 10.0.0 | 2024-12 | mismo repositorio | igual | Sin versiones desde hace 22 meses. Su documentación recomienda usar la nueva versión. No se indica fecha de fin de soporte. |
| Pragmatic (`@atlaskit/pragmatic-drag-and-drop`) | 4.0.0 | 2026-09-24 | 2026-10-29 | 12 790 / 104 | Activo. La 4.0.0 retiró rutas de importación antiguas, y el núcleo exige Chrome/Edge 114, Firefox 125 y Safari 17 (desde 1.8.0). |
| SortableJS (`sortablejs`) | 1.15.7 | 2026-02-11 | 2026-03-24 | 31 208 / 532 | Mantenimiento bajo: la versión anterior era de 2024-11. |
| `@hello-pangea/dnd` | 18.0.1 | 2025-02-09 | 2026-02-13 (solo `.gitignore`) | 4 040 / 144 | Casi detenido: 20 meses sin versión. Admite React 18 y 19. |
| React Aria (`react-aria-components`) | 1.22.1 | 2026-10-09 | 2026-10-28 | 15 999 / 675 | Muy activo, respaldado por Adobe. Es una librería de componentes, no solo de arrastre. |
| `svelte-dnd-action` | 0.9.80 | 2026-10-05 | 2026-10-05 | 2 130 / 33 | Activo. Solo Svelte; sigue en 0.x. |
| `@formkit/drag-and-drop` | 0.6.1 | 2026-06-15 | 2026-07-01 | 1 951 / 11 | Activo. Sigue en 0.x. |

**Descartadas por su estado [V]:**

- `react-beautiful-dnd`: marcada como obsoleta en npm y archivada.
- `react-dnd`: última versión de 2022.
- `dragula`: última versión de 2020.
- `@thisbeyond/solid-dnd`: última versión de 2023.
- `swapy`: última versión de 2025-01 y licencia GPL-3.0.

Los envoltorios `vuedraggable` 4.1.0 (2021) y `react-sortablejs` 6.1.4 (2022) también están parados. Usar SortableJS desde Vue o React con ellos añade esa dependencia sin mantenimiento **[V]**.

## Táctil, teclado y lector de pantalla

| Librería | Táctil | Teclado | Lector de pantalla | A cargo de la app |
| --- | --- | --- | --- | --- |
| **dnd-kit nuevo** | De serie por eventos de puntero, con 250 ms de espera y 5 px de tolerancia **[V]**. Hay un informe abierto de fallo en algunos Android, sobre todo Samsung **[R]** ([#1955](https://github.com/clauderic/dnd-kit/issues/1955)). | De serie: Espacio/Intro cogen; Espacio/Intro/Tab sueltan; Escape cancela; flechas mueven **[V]**. En listas ordenables, las flechas saltan al destino más cercano en esa dirección, también en otro grupo **[V]** (código de `SortableKeyboardPlugin`). | De serie: atributos ARIA, instrucciones ocultas, región `aria-live="polite"` con `role="status"` y anuncios **[V]**. Textos en inglés; los de ejemplo usan el `id` **[V]**. | Traducir anuncios e instrucciones, y usar títulos en lugar de `id`. Alternativa de 2.5.7. |
| **dnd-kit legado** | Requiere configurar sensores **[N]** (no revisado a fondo). | De serie, 25 px por pulsación; `useSortable` lo adapta **[V]**. El paso entre listas no se ha revisado **[N]**. | De serie, solo en inglés **[V]**. | Lo mismo que el nuevo. |
| **Pragmatic** | API nativa. El README declara soporte completo en iOS y Android **[V]**, pero la documentación no explica gestos. Requiere mantener pulsado en iOS **[R]** ([#13](https://github.com/atlassian/pragmatic-drag-and-drop/issues/13), [#124](https://github.com/atlassian/pragmatic-drag-and-drop/issues/124)). Hay informes abiertos en Firefox para Android y Samsung Internet **[R]** ([#14](https://github.com/atlassian/pragmatic-drag-and-drop/issues/14), [#143](https://github.com/atlassian/pragmatic-drag-and-drop/issues/143)). | **Sin arrastre por teclado.** Atlassian desaconseja las flechas para la mayoría de los casos y recomienda un menú de acciones; cita que en JAWS obligan a cambiar de modo **[V]**. | No anuncia nada solo. `live-region` da una función `announce` **[V]**. | Casi todo: botón y menú de movimiento, nombres accesibles, mensajes con posición antigua y nueva, y restaurar el foco **[V]**. El paquete `react-accessibility` exige React y componentes de Atlaskit con Emotion **[V]**. |
| **SortableJS** | De serie, con `delay`, `delayOnTouchOnly` y `touchStartThreshold` **[V]**. | **Nada.** El único `keydown` del código es para la tecla de selección múltiple **[V]**. | **Nada:** sin `aria-*` en el código **[V]**. Issue abierto desde 2020 sin solución ([#1951](https://github.com/SortableJS/Sortable/issues/1951)) **[V]**. | Todo el flujo accesible, por completo fuera de la librería. |
| **`@hello-pangea/dnd`** | De serie, con pulsación larga de duración no documentada; si el dedo se mueve antes, se desplaza en vez de arrastrar **[V]**. | De serie: Espacio coge y suelta, Escape cancela, flechas mueven y saltan a la lista contigua **[V]**. | De serie: regiones vivas e instrucciones en `aria-describedby`. Solo inglés **[V]**. | Traducir con `announce`, una llamada por evento y de forma inmediata **[V]**. Alternativa de 2.5.7. |
| **React Aria** | API nativa **[V]**. Con lector de pantalla táctil, doble toque para activar y deslizar entre destinos **[V]**. | De serie: Intro coge, Tab recorre destinos, Intro suelta, Escape cancela **[V]**. | De serie, con paridad declarada y cadenas `es-ES` **[V]**. | Añadir un control de arrastre enfocable **[V]**. Montar el Tablero con colecciones que no están pensadas para esto (ver abajo). Alternativa de 2.5.7. |
| **`svelte-dnd-action`** | De serie, con `delayTouchStart` (80 ms) **[V]**. | De serie, aunque su accesibilidad se declara en beta **[V]**. | De serie, traducible con `setAriaStrings` **[V]**. | `aria-label` en contenedores y elementos; traducir textos **[V]**. Alternativa de 2.5.7. |
| **`@formkit/drag-and-drop`** | Por eventos de puntero, con `longPress` opcional **[V]**. La portada no lo describe. | **Nada útil:** `handleNodeKeydown` está vacío y el otro manejador solo trata Escape **[V]**. | **Nada:** ni `aria-live` ni anuncios, solo `aria-selected` **[V]**. | Todo el flujo accesible. |

## Mover Pendientes y reordenar Etapas

| Librería | Entre Etapas | Reordenar Etapas | Desplazamiento automático |
| --- | --- | --- | --- |
| **dnd-kit nuevo** | Sí: `useSortable` con `group`, helper `move` y `CollisionPriority.Low` para Etapas vacías **[V]**. | Sí: guía oficial con `type: 'column'` **[V]**. | Activo de serie: actúa sobre el ancestro desplazable más cercano bajo el puntero, con zona del 20 % por eje **[V]**. Por teclado se desactiva y usa `scrollIntoViewIfNeeded` **[V]**. Informes abiertos: [#2119](https://github.com/clauderic/dnd-kit/issues/2119), [#2083](https://github.com/clauderic/dnd-kit/issues/2083), [#2072](https://github.com/clauderic/dnd-kit/issues/2072), [#2107](https://github.com/clauderic/dnd-kit/issues/2107) **[R]**. |
| **Pragmatic** | Sí, con destinos y `hitbox` **[V]**; hay ejemplo oficial de tablero **[V]**. | Sí, pero la lógica de orden la escribe la app **[I]**. | Paquete aparte: contenedores anidados, del más interior al exterior, un contenedor por eje en cada fotograma. La ventana se registra aparte **[V]**. El desplazamiento nativo no se puede desactivar **[V]**. La documentación no trata móvil **[V]**. |
| **SortableJS** | Sí, con el mismo `group` **[V]**. | Sí, con otra instancia y otro `group` **[I]**. Hay que cuidar los eventos anidados (`dragoverBubble`) **[V]**. | Plugin de serie: 30 px de zona y `bubbleScroll` para contenedores padres; en móvil usa su propio mecanismo **[V]**. |
| **`@hello-pangea/dnd`** | Sí **[V]**. | Sí: ejemplo oficial con `type="COLUMN"` y `direction="horizontal"` **[V]**. | Incluye teclado y táctil, con temblor conocido en iOS **[V]**. **Límite clave:** «solo un padre de desplazamiento» y sin contenedores anidados **[V]**. Una Etapa con desplazamiento propio dentro de un Tablero con desplazamiento horizontal queda fuera de los casos listados **[I]**. |
| **React Aria** | Sí, en el ejemplo de dos listas **[V]**. | No hay guía de Etapas que contienen listas arrastrables, ni se ha encontrado un ejemplo oficial **[N]**. | Interno: se apoya en el navegador salvo en WebKit de macOS **[V]**. La documentación de arrastre no lo trata **[V]**. |
| **`svelte-dnd-action`** | Sí, por `type` **[V]**. | Sí: zonas anidadas, «piensa en Trello» **[V]**. | Zonas, padres y ventana, en ambos ejes **[V]**. |
| **`@formkit/drag-and-drop`** | Sí, con `group` **[V]**. | Probable, sin verificar **[N]**. | Hay lógica en el código, sin revisar **[N]**. |

En pantallas estrechas importa la forma del Tablero. Si cada Etapa se desplaza por sí misma dentro de un Tablero que se desplaza en horizontal, hay dos contenedores anidados. Eso elimina o limita a `@hello-pangea/dnd` y exige probar los demás **[I]**.

## Frameworks, peso y licencia

**Sobre el peso:** no se pudo hacer una compilación local real con `tree-shaking`. Las cifras proceden de Bundlephobia o de jsDelivr comprimido con `gzip -9`. Son orientativas y no sirven para comparar con precisión. Los frameworks no están incluidos **[M]**.

| Librería | Frameworks | Min. | Gzip | Licencia |
| --- | --- | --- | --- | --- |
| dnd-kit nuevo | JS, React 18/19, Vue ≥3.5, Svelte ≥5.29, Solid ≥1.8 **[V]** | 90,3 kB `dom` | ≈ 36,5 kB: `dom` 29,5 + `/sortable` 5,8 + `helpers` 1,2 **[M]** | MIT **[V]** |
| dnd-kit nuevo, React | React 18/19 | 100,0 kB | ≈ 40 kB: `react` 33,0 + `/sortable` 5,8 + `helpers` 1,2 **[M]** (el subpath `/sortable` de React se ha aproximado con el de `dom`) | MIT **[V]** |
| dnd-kit legado | React ≥16.8 **[V]** | 52,9 kB | ≈ 17,9 kB **[M]** | MIT **[V]** |
| Pragmatic | Cualquiera (núcleo JS) **[V]**; la guía oficial de frameworks solo trata React y lista adaptaciones comunitarias **[V]** | 18,4 kB adaptador | ≈ 14,5 kB con adaptador, `hitbox`, `reorder`, `auto-scroll`, `live-region` y dependencias, sin ayudantes de `@babel/runtime` **[M]**. Atlassian declara 4,7 kB para el núcleo **[V]**. | Apache-2.0 **[V]** |
| SortableJS | Cualquiera (JS) **[V]** | 45,5 kB | 15,0 kB (`Sortable.min.js`) o 18,3 kB (Bundlephobia) **[M]** | MIT **[V]** |
| `@hello-pangea/dnd` | Solo React 18/19 **[V]** | 93,2 kB | 28,8 kB **[M]** | Apache-2.0 **[V]** |
| React Aria | Solo React ≥16.8 **[V]** | 990,7 kB paquete completo | 279,1 kB sin `tree-shaking`; no representa el uso real **[M]** | Apache-2.0 **[V]** |
| `svelte-dnd-action` | Solo Svelte ≥3.23 **[V]** | 43,1 kB | 13,8 kB **[M]** | MIT **[V]** |
| `@formkit/drag-and-drop` | JS, React, Vue, Svelte, Solid **[V]** | 49,0 kB | 12,6 kB **[M]**; su web declara 4–5 kB **[V]**, sin explicar la diferencia | MIT **[V]** |

Todas se pueden usar en una app estática. GitHub devuelve licencia «Other» para Pragmatic y `@hello-pangea/dnd`. La licencia Apache-2.0 sale de npm y, en Pragmatic, también de `packages/core/LICENSE.md` **[V]**.

## Preguntas para la decisión

- ¿Qué framework usará la app? React Aria, `@hello-pangea/dnd` y `svelte-dnd-action` solo sirven si coincide.
- ¿Se acepta depender de una API 0.x con cambios entre versiones menores, o se prefiere más estabilidad?
- ¿Se quiere arrastre por teclado o bastan botones y menús? Lo segundo cuadra con la guía de Atlassian y además cubre 2.5.7, pero conviene validarlo con personas usuarias.
- ¿Importa funcionar en Firefox para Android y Samsung Internet?
- ¿Tendrá cada Etapa su propio desplazamiento en móvil?
- Antes de cerrar la elección, ¿se prueban las finalistas con un prototipo en iOS, Android, VoiceOver, TalkBack y NVDA?

## Sin verificar en fuente primaria

- Comportamiento real en dispositivos y con lectores de pantalla (nada se ha ejecutado).
- Soporte de la API nativa por navegador en octubre de 2026: viene de caniuse, un agregador.
- Pulsación larga en iOS con Pragmatic: viene de issues, no de documentación oficial.
- Fallos de Pragmatic en Samsung Internet y de dnd-kit en Android: informes abiertos, sin reproducir.
- Configuración táctil de dnd-kit legado y paso de teclado entre listas en esa versión.
- Reordenar Etapas con listas anidadas en React Aria y `@formkit/drag-and-drop`.
- Desplazamiento automático de `@formkit/drag-and-drop` y comportamiento en móvil de React Aria.
- Causa del `pushed_at` reciente de `@hello-pangea/dnd` (2026-10-30), sin commits nuevos en `main`.
- Pesos con `tree-shaking` real; los de este documento son aproximados.

## Fuentes

**dnd-kit**

- [Documentación](https://dndkit.com/), [sensores](https://dndkit.com/extend/sensors), [sensor de teclado](https://dndkit.com/extend/sensors/keyboard-sensor), [sensor de puntero](https://dndkit.com/extend/sensors/pointer-sensor), [plugins](https://dndkit.com/extend/plugins), [changelog](https://dndkit.com/changelog)
- [Plugin de accesibilidad](https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/extend/plugins/accessibility.mdx), [AutoScroller](https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/extend/plugins/auto-scroller.mdx), [varias listas](https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/react/guides/multiple-sortable-lists.mdx)
- [Accesibilidad en legado](https://github.com/clauderic/dnd-kit/blob/main/apps/docs/docs/legacy/guides/accessibility.mdx), [instalación de legado](https://dndkit.com/legacy/introduction/installation)
- Código publicado: [`index.js`](https://cdn.jsdelivr.net/npm/@dnd-kit/dom@0.5.1/index.js), [`sortable.js`](https://cdn.jsdelivr.net/npm/@dnd-kit/dom@0.5.1/sortable.js)

**Pragmatic drag and drop**

- [README](https://github.com/atlassian/pragmatic-drag-and-drop/blob/main/README.md), [guía de accesibilidad](https://atlassian.design/components/pragmatic-drag-and-drop/accessibility-guidelines), [restricciones de plataforma](https://github.com/atlassian/pragmatic-drag-and-drop/blob/main/packages/documentation/constellation/07-web-platform-design-constraints/index.mdx)
- [Comparación](https://github.com/atlassian/pragmatic-drag-and-drop/blob/main/packages/documentation/constellation/index/comparison.mdx), [paquetes opcionales](https://github.com/atlassian/pragmatic-drag-and-drop/blob/main/packages/documentation/constellation/06-optional-packages/index.mdx), [ejemplos](https://github.com/atlassian/pragmatic-drag-and-drop/blob/main/packages/documentation/constellation/00-examples/index.mdx), [frameworks](https://github.com/atlassian/pragmatic-drag-and-drop/blob/main/packages/documentation/constellation/05-core-package/08-UI-frameworks/about.mdx)
- [Auto-scroll](https://github.com/atlassian/pragmatic-drag-and-drop/blob/main/packages/auto-scroll/constellation/index/about.mdx), [changelog](https://github.com/atlassian/pragmatic-drag-and-drop/blob/main/packages/core/CHANGELOG.md), [licencia](https://github.com/atlassian/pragmatic-drag-and-drop/blob/main/packages/core/LICENSE.md)

**SortableJS**

- [README](https://github.com/SortableJS/Sortable/blob/master/README.md), [AutoScroll](https://github.com/SortableJS/Sortable/blob/master/plugins/AutoScroll/README.md), [código publicado](https://cdn.jsdelivr.net/npm/sortablejs@1.15.7/Sortable.js)

**`@hello-pangea/dnd`**

- [README](https://github.com/hello-pangea/dnd/blob/main/README.md), [lector de pantalla](https://github.com/hello-pangea/dnd/blob/main/docs/guides/screen-reader.md), [táctil](https://github.com/hello-pangea/dnd/blob/main/docs/sensors/touch.md), [teclado](https://github.com/hello-pangea/dnd/blob/main/docs/sensors/keyboard.md)
- [Desplazamiento automático](https://github.com/hello-pangea/dnd/blob/main/docs/guides/auto-scrolling.md), [`Droppable`](https://github.com/hello-pangea/dnd/blob/main/docs/api/droppable.md), [ejemplo de tablero](https://github.com/hello-pangea/dnd/blob/main/stories/src/board/board.tsx)

**React Aria**

- [Arrastre](https://react-aria.adobe.com/dnd), [GridList](https://react-aria.adobe.com/GridList), [`useAutoScroll`](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/dnd/useAutoScroll.ts), [textos `es-ES`](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/intl/dnd/es-ES.json)

**Otras**

- [`svelte-dnd-action`](https://github.com/isaacHagoel/svelte-dnd-action/blob/master/README.md)
- [FormKit Drag and Drop](https://drag-and-drop.formkit.com/), [código publicado](https://cdn.jsdelivr.net/npm/@formkit/drag-and-drop@0.6.1/index.mjs)
- Metadatos: [registro npm](https://registry.npmjs.org/), [API de GitHub](https://docs.github.com/rest), [Bundlephobia](https://bundlephobia.com/), [jsDelivr](https://www.jsdelivr.com/)
