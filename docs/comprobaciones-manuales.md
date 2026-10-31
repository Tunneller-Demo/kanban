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

## Lector de pantalla

Por definir.

- [ ] NVDA en Windows
- [ ] TalkBack en Android

## Zoom y ancho

Por definir.

- [ ] Zoom al 200 %
- [ ] Ancho de 320 px

## Pasadas

| Fecha | Dispositivo | Sistema | Navegador | Resultado |
| ----- | ----------- | ------- | --------- | --------- |
