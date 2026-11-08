# ENTRE LÍNEAS · Fotógrafo de la Liga Tica

> *“El partido lo juegan ellos. La historia la capturás vos.”*

Simulador 3D de fotografía deportiva ambientado en el fútbol costarricense. Sos un fotógrafo amateur que consigue su primera acreditación para **Pura Vida Deportes** y construye su carrera: llegar al estadio, pasar seguridad, posicionarse, anticipar jugadas, disparar, editar, entregar al editor y ganar reputación.

Todo el contenido (estadios, clubes, jugadores, marcas, texturas y sonidos) es **ficticio y procedural**: no hay assets externos.

---

## Cómo ejecutarlo

Requisitos: Node.js 18+ y un navegador moderno con WebGL2 (Chrome, Edge o Firefox en Windows).

```bash
npm install
npm run dev        # desarrollo: http://localhost:5173
# o bien
npm run build && npm run preview   # versión optimizada: http://localhost:4173
```

Hacé clic en la ventana del juego para capturar el ratón (puntero bloqueado). `Esc` libera el ratón y abre la pausa.

### Por qué Three.js y no Unity

El encargo pedía *preferiblemente* Unity 6. El entorno en el que se desarrolló no tiene Unity Editor ni licencia, y el requisito central era **construir algo que funcione y que se pueda ejecutar, recorrer y verificar con capturas**. Por eso el juego usa **Three.js (WebGL2) + WebAudio + Vite**, que corre en cualquier PC Windows desde el navegador. La arquitectura (sistemas desacoplados, bus de eventos, datos tipo ScriptableObject en módulos de configuración) se puede portar a Unity/C# sistema por sistema si se desea.

---

## Controles

| Acción | Teclado / ratón | Mando |
|---|---|---|
| Moverse / correr / caminar | `WASD` / `Shift` / `Alt` | Stick izq. / L3 |
| Saltar / arrodillarse (ángulo bajo) | `Espacio` / `C` | A / B |
| Interactuar | `E` | A |
| Equipar / guardar cámara | `G` | Y |
| Levantar / bajar visor | Clic derecho | LT |
| Disparar | Clic izquierdo (mantener en ráfaga) | RT |
| Zoom | Rueda del ratón / `+` `−` | Cruceta ↑↓ |
| Elegir parámetro / cambiar valor | `Q` `E` / `Z` `X` | LB RB / cruceta ←→ |
| Autofoco | `F` | R3 |
| Individual / ráfaga | `R` | X |
| Cambiar batería | `B` | X |
| Inventario · Galería · Mapa · Misiones | `I` · `P` · `M` · `J` (y `Tab`) | Cruceta |
| Esperar el saque inicial (en la cancha) | `T` | — |
| Pausa / salir del visor | `Esc` | Start |

Todos los controles son reasignables en **Pausa → Ajustes → Teclas**.

---

## Qué está implementado (y funciona)

### Introducción jugable (escenas 1–6)
1. **La calle**: calle tica con sodas, pulperías, ferretería, barbería, postes con cables, carros que circulan (frenan y pitan si te les atravesás), parada de bus, vendedores de copos y granizados, aficionados caminando y conversando.
2. **Acreditación**: Mariana (coordinadora de prensa) te entrega una credencial realista (dibujada en canvas: equipos, número, QR, holograma) que queda en el inventario.
3. **Camino al estadio**: caminás físicamente; no hay teletransporte.
4. **Seguridad**: el guardia verifica tus datos; la mochila viaja por la banda del escáner de rayos X, cruzás el arco detector y la puerta corrediza se abre. **Sin acreditación la puerta queda cerrada** (colisión real).
5. **Pasillos**: vestuarios (bloqueados: tu acreditación no los incluye), sala de prensa (se abre con la credencial), túnel iluminado; el sonido del público se amortigua dentro y crece al salir.
6. **Primera fotografía**: Don Álvaro te enseña posicionamiento, velocidad, enfoque y anticipación; misión de calentamiento (5 fotos), partido, entrega al editor.

### Sistema fotográfico (núcleo)
- Visor en primera persona con cuadro 3:2, tercios, punto AF, barra de parámetros y exposímetro.
- **Óptica física**: campo de visión según focal y factor de recorte (APS-C ×1,5 / formato completo); apertura máxima variable en zooms.
- **Profundidad de campo real**: círculo de confusión por píxel calculado con la fórmula de lente delgada (focal, apertura, distancia de enfoque, tamaño de sensor), aplicado en el visor y en la captura.
- **Desenfoque de movimiento real**: la captura renderiza N sub-fotogramas durante el tiempo de obturación moviendo jugadores, balón y público según su velocidad, más el **paneo** del fotógrafo y la **trepidación** de la mano (que depende del peso del lente, estabilización, monopié y postura).
- **Exposición**: EV de la escena según hora y clima; obturación, apertura, ISO (manual o AUTO con compensación). Sub/sobreexposición visibles en la imagen.
- **ISO → ruido** según el sensor de cada cámara. **Balance de blancos** (AWB, día, nublado, sombra, LED, tungsteno) con dominantes reales.
- **Autofoco** AF-C con seguimiento (mejor en cámaras superiores), AF-S con bloqueo, MF manual; el AF tarda según cámara + lente.
- Ráfaga a los fps de cada cámara con **buffer**; **batería** (disparo + visor encendido) con repuestos; **tarjeta** con capacidad.
- Gotas en el lente si llueve sin cubierta para lluvia. Obturador con sonido distinto por cámara.

### Captura y evaluación
- Cada foto es un **JPEG real** (render a RenderTarget → píxeles → canvas) guardado en IndexedDB con **EXIF simulado** (cámara, lente, focal, apertura, velocidad, ISO, balance, enfoque, jugador, jugada, minuto, marcador). Se puede **exportar como archivo .jpg**.
- Evaluación **sin aleatoriedad**, basada en el estado real del juego en el instante del disparo:
  - **Nitidez**: desenfoque de foco + movimiento + trepidación en píxeles sobre el sujeto principal.
  - **Composición**: encuadre proyectado del jugador (tercios, aire en la dirección del movimiento, cortes, cabeza cortada, oclusión por otros jugadores u objetos, balón en cuadro, duelo con rival, de frente/de espaldas).
  - **Momento**: eventos del partido (gol, atajada, remate, disputa, entrada, regate, penal, expulsión, celebración…) con ventana temporal gaussiana alrededor del pico de la acción y actores visibles.
  - **Exposición**: diferencia en pasos + luminancia medida en los píxeles del sujeto + recorte de luces + ruido + balance.
  - **Distancia**, **originalidad** (ángulo bajo, paneo logrado, contraluz, lluvia, perspectivas poco comunes, penalización por repetición) y **encargo** del editor.
  - Resultado: puntuación 0–100, calificación, comentarios específicos (“El foco quedó 3,2 m detrás de Rojas”, “Excelente anticipación…”), valor en colones.

### Fútbol
22 jugadores con IA por formación (4-4-2), presión, desmarques, conducción, pases rasos y aéreos, centros, regates, entradas y barridas, faltas, amarillas y rojas (el expulsado se retira), penales, porteros que se posicionan y se estiran, atajadas y rebotes, postes, saques de banda, de esquina y de meta, goles con celebraciones (carrera a la esquina, rodillas), medio tiempo, tiempo añadido y final. Árbitro y asistentes siguen la jugada; bancas con suplentes y técnicos animados. Calentamiento previo con parejas de pases, estiramientos y porteros. Cada sesión es distinta.

### Posicionamiento y reglas
Zonas de prensa pintadas en azul detrás de las porterías y en las bandas; zonas restringidas (cancha siempre, área técnica y boca de la portería durante el juego). Invadir = advertencia + steward que se acerca; a los 4 s se registra infracción; 3 infracciones = te retiran de la zona y no podés fotografiar 60 s. Afecta la reputación.

### Progresión
Reputación 0–100 con títulos, dinero (₡), 6 eventos de calendario en 3 estadios (Las Palmas, Metropolitano Irazú, La Fortaleza) con distintas horas (tarde, atardecer, noche) y climas (despejado, nublado, lluvia), encargos del editor, contratos (colaborador → planta → agencia) que multiplican el pago, tienda con 4 cámaras, 7 lentes, tarjetas, baterías, monopié, cubierta de lluvia y mochila pro (con requisitos de reputación). Mochila con espacios limitados: elegís qué lentes y accesorios llevar a cada evento.

### Galería, edición y entrega
Galería con filtros (evento, favoritas, seleccionadas, entregadas, tipo de jugada), orden por puntuación, ampliación, comparación lado a lado, EXIF, favoritas, borrado (libera tarjeta), exportación. Editor con exposición, contraste, saturación, temperatura, nitidez, viñeta y recorte (3:2 o libre) que **modifican los píxeles** y **re-evalúan** la foto con influencia moderada (máx. +8: el recorte puede mejorar la composición pero baja la resolución; levantar sombras agrega ruido; el procesado excesivo penaliza; un foco fallado no se arregla). Entrega de hasta 10 fotos en la laptop de la sala de prensa → liquidación del editor con desglose de reputación y pago.

### Guardado
Autoguardado en hitos, 3 ranuras manuales, cargar, continuar, nueva partida y eliminar con confirmación. Ajustes persistentes (gráficos, sensibilidad, volumen, teclas, duración del partido).

### Rendimiento
Personajes como una sola *SkinnedMesh* con huesos (1 draw call cada uno), público instanciado con animación en vertex shader, fusión automática de geometría estática por material y celda, ocultación de la ciudad dentro del estadio y del estadio desde la calle, sombras centradas en la zona de juego, presets de calidad (bajo/medio/alto/ultra) y escala de resolución.

---

## Estructura del proyecto

```
src/
  core/         EventBus, Input (teclado/ratón/mando, reasignable), Settings, Collision (AABB), MathUtil
  gfx/          Texturas procedurales (césped con líneas, asfalto, paredes, vallas…), fusión de geometría
  characters/   Humanoid: rig óseo + animaciones procedurales con transiciones
  world/        Environment (cielo, sol, noche, lluvia), Stadium, StadiumConfigs, City, Crowd
  player/       PlayerController (3.ª persona), FollowCamera (colisión, zoom)
  npc/          NPC genérico + apariencias (Mariana, Álvaro, guardia, policía, stewards…)
  interaction/  Sistema de interacción, puertas con bisagra/corredizas
  football/     Teams, Ball (física), Footballer, Match (IA, reglas, eventos)
  photography/  Equipment, PhotoMode (visor), PhotoPipeline (render óptico), PhotoEvaluator, EditEval
  inventory/    Inventario, mochila, batería, tarjeta
  missions/     Misiones con objetivos, progreso y recompensas
  career/       Calendario, reputación, contratos, liquidación
  save/         SaveSystem (localStorage), PhotoLibrary (IndexedDB)
  audio/        AudioEngine procedural y espacial
  ui/           HUD, visor, diálogos, galería, editor, pantallas, credencial, mapa
  game/         Game (orquestador), Story (flujo de eventos), Rules (zonas)
```

## Limitaciones conocidas / siguientes pasos

- Los modelos son *low-poly* procedurales (sin assets externos); la fase de producción visual (modelos esculpidos, captura de movimiento, texturas fotográficas) queda pendiente.
- Las voces son murmullos sintetizados (opcionalmente texto a voz del navegador); no hay doblaje.
- Si se carga una partida guardada a mitad de evento, se retoma desde el inicio de ese evento (con inventario y progreso intactos).
- La IA de fútbol no modela fuera de juego ni sustituciones.
- Fase 5 (expansión): más estadios, torneos de selecciones, modo libre configurable, redes sociales del fotógrafo.
