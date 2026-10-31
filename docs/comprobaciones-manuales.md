# Comprobaciones manuales antes del merge

Lo que las pruebas automáticas no cubren. Se repasa una vez antes del merge, sobre la app compilada.

Anota al final el dispositivo, el sistema y el navegador de cada pasada.

## Táctil en dispositivos reales

El táctil no se automatiza: una prueba sintética daría una falsa seguridad.

Pásala en un Android y en un iPhone. **iPhone sigue sin probarse: un fallo allí reabre la elección de librería.**

| Comprobación                                                                                                     | Android | iPhone |
| ---------------------------------------------------------------------------------------------------------------- | ------- | ------ |
| Mantener pulsado un Pendiente lo levanta, sin menú del sistema ni selección de texto                             | [ ]     | [ ]    |
| Un toque corto abre el Pendiente; levantar uno y soltarlo sin moverlo no abre el diálogo                         | [ ]     | [ ]    |
| Deslizar rápido sobre un Pendiente no lo levanta                                                                 | [ ]     | [ ]    |
| Deslizar de lado mueve el carrusel, también desde un Pendiente, el hueco de la lista o una Etapa vacía           | [ ]     | [ ]    |
| Deslizar de lado con impulso y levantar el dedo sin frenar acaba encajado en una Etapa                           | [ ]     | [ ]    |
| Deslizar en vertical mueve la Etapa, y al llegar a su extremo no mueve la página                                 | [ ]     | [ ]    |
| Llevar el Pendiente al borde pasa a la Etapa siguiente, y al soltarlo queda allí                                 | [ ]     | [ ]    |
| Se puede parar en la Etapa siguiente sin que el carrusel se pase de largo                                        | [ ]     | [ ]    |
| El carrusel no salta ni encaja mientras se arrastra, y vuelve a encajar al soltar                                | [ ]     | [ ]    |
| Con una Etapa de 14 Pendientes o más, arrastrar hacia su borde la desplaza sola                                  | [ ]     | [ ]    |
| El asa de puntos reordena las Etapas con el dedo                                                                 | [ ]     | [ ]    |
| Con movimiento reducido en el sistema, el Pendiente sigue al dedo y soltar es instantáneo                        | [ ]     | [ ]    |

## Copia de seguridad en dispositivos reales

El selector de archivos y la carpeta de descargas son del sistema: las pruebas los simulan.

| Comprobación                                                                     | Android | iPhone |
| -------------------------------------------------------------------------------- | ------- | ------ |
| «Exportar» deja el archivo donde la persona puede encontrarlo, con su nombre     | [ ]     | [ ]    |
| «Importar» deja elegir ese archivo y el Tablero queda igual que al exportarlo    | [ ]     | [ ]    |
| Cancelar el selector de archivos no cambia nada y el foco vuelve al enlace       | [ ]     | [ ]    |

## Lector de pantalla

Las pruebas comprueban los textos; si se oyen bien, y en su momento, solo se sabe escuchándolos.

| Comprobación                                                                         | NVDA en Windows | TalkBack en Android |
| ------------------------------------------------------------------------------------ | --------------- | ------------------- |
| Al llegar a un Pendiente se oye su título; al llegar a una Etapa, su nombre          | [ ]             | [ ]                 |
| Coger, mover y soltar un Pendiente se oye en español, con títulos y posiciones       | [ ]             | [ ]                 |
| Mover desde el menú «⋮» se oye una sola vez, y el foco sigue al Pendiente            | [ ]             | [ ]                 |
| Al abrir un diálogo se oye su título; al cerrarlo, el Pendiente que tenía el foco    | [ ]             | [ ]                 |
| Borrar un Pendiente anuncia «Deshacer» y el foco no se pierde                        | [ ]             | [ ]                 |
| Nunca se oye un identificador ni un texto en inglés                                  | [ ]             | [ ]                 |

## Zoom y ancho

Las pruebas simulan el zoom con una ventana de 640 × 400; aquí se usa el zoom del navegador.

| Comprobación                                                                   | Zoom al 200 % | Ancho de 320 px |
| ------------------------------------------------------------------------------ | ------------- | --------------- |
| La página no se desplaza de lado; solo el carrusel y las pestañas              | [ ]           | [ ]             |
| Se llega a todas las Etapas y sus Pendientes                                   | [ ]           | [ ]             |
| Los diálogos caben, y sus botones se alcanzan desplazando su contenido         | [ ]           | [ ]             |
| El contorno de foco se ve entero al recorrer la página con Tab                 | [ ]           | [ ]             |

## Pasadas

| Fecha | Dispositivo | Sistema | Navegador | Resultado |
| ----- | ----------- | ------- | --------- | --------- |
