# ENTRE LÍNEAS · Fotógrafo de la Liga Tica

> *“El partido lo juegan ellos. La historia la capturás vos.”*

Simulador 3D de fotografía deportiva ambientado en el fútbol costarricense. Sos un fotógrafo amateur que consigue su primera acreditación para **Ascenso Total** y construye su carrera: llegar al estadio, pasar seguridad, posicionarse, anticipar jugadas, disparar, editar, entregar al editor y ganar reputación.

Todo el contenido se genera de forma procedural (no hay assets externos). La sede principal, **Estadio La Cueva** en Tibás, reproduce la arquitectura del estadio tibaseño: tribunas laterales de dos niveles con techos de cerchas blancas, cabeceras abiertas, butacas moradas con pasillos amarillos y fachada granate con letras gigantes. Clubes, jugadores y patrocinadores son ficticios. Tu medio es **Ascenso Total**.

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

| Acción | Teclado / ratón | Control PS5 (DualSense) |
|---|---|---|
| Moverse / mirar | `WASD` / ratón | Stick izquierdo / stick derecho |
| Correr | `Shift` | L3 (presionar stick izq.) |
| Interactuar / aceptar | `E` | ✕ |
| Arrodillarse (ángulo bajo) / volver en menús | `C` | ○ |
| Saltar | `Espacio` | □ |
| Equipar / guardar cámara | `G` | △ |
| Levantar / bajar visor | Clic derecho | L2 |
| Disparar (mantener en ráfaga) | Clic izquierdo | R2 |
| Zoom | Rueda / `+` `−` | Cruceta ↑ ↓ (mantener) |
| Elegir parámetro / cambiar valor | `Q` `E` / `Z` `X` | L1 R1 / cruceta ← → |
| Autofoco | `F` | R3 |
| Individual / ráfaga | `R` | □ (en el visor) |
| Cambiar batería | `B` | Panel táctil |
| Inventario · Misiones · Mapa · Galería | `I` · `J` · `M` · `P` | Cruceta ↑ · ↓ · ← · → |
| Equipo | `Tab` | Create |
| Pausa | `Esc` | Options |
| Primera / tercera persona | `V` | R3 (fuera del visor) |
| Esperar el saque inicial | `T` | — |

**Control de PS5 en Mac:** emparejalo por Bluetooth (Ajustes del Sistema → Bluetooth; en el control mantené **PS + Create** hasta que la luz parpadee) o conectalo por USB-C. Funciona en Chrome y Safari. Con el juego abierto, presioná cualquier botón; aparece el aviso "Control de PlayStation conectado". Los menús se recorren con la cruceta o el stick, con ✕ para aceptar y ○ para volver. El control vibra al disparar y con los goles.

Todos los controles son reasignables en **Pausa → Ajustes → Teclas**.

---

## Qué está implementado (y funciona)

### Introducción jugable (escenas 1–6)
1. **La calle**: calle tica con sodas, pulperías, ferretería, barbería, postes con cables, carros que circulan (frenan y pitan si te les atravesás), parada de bus, vendedores de copos y granizados, aficionados caminando y conversando.
2. **Acreditación**: Mariana (coordinadora de prensa) te entrega una credencial realista (dibujada en canvas: equipos, número, QR, holograma) que queda en el inventario.
3. **Camino al estadio**: caminás físicamente; no hay teletransporte.
4. **Seguridad**: el guardia verifica tus datos; la mochila viaja por la banda del escáner de rayos X, cruzás el arco detector y la puerta corrediza se abre. **Sin acreditación la puerta queda cerrada** (colisión real).
5. **Pasillos**: vestuarios (bloqueados: tu acreditación no los incluye), sala de prensa (se abre con la credencial), túnel iluminado; el sonido del público se amortigua dentro y crece al salir.
6. **Primera fotografía**: Kendall Rojas te enseña posicionamiento, velocidad, enfoque y anticipación; misión de calentamiento (5 fotos), partido, entrega al editor.

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

### Tus propios sonidos (ambiente de estadio y música de inicio)
El juego puede usar audio tuyo en lugar del ambiente generado:
- **Opción 1:** copiá tus archivos a `public/audio/`: `menu.m4a` (música de inicio) y el ambiente **por estadio**: `cueva_1…8`, `alajuela_1…8`, `cartago_1…8`, `irazu_1…8`. `estadio_1…8` es el ambiente general para los estadios sin audio propio. También acepta `.mp3`, `.ogg`, `.wav` o `.mp4`.
- **Opción 2:** en el juego, **Ajustes → Audio → Tus sonidos**: cada estadio tiene su *Agregar…* (admite varios archivos a la vez). Quedan guardados en el navegador.

Las grabaciones de estadio forman una lista: suenan en orden aleatorio, con fundido cruzado y volumen normalizado.

El ambiente se mezcla con la intensidad del partido y se amortigua en pasillos y túnel; la música suena en el menú y en la Redacción. Usá solo audio propio o con permiso. La carpeta `public/audio` está excluida de Git para no subir archivos con derechos.

### Preparación del equipo, horarios y nuevas sedes
- **Zona de preparación** (pasillo, después de seguridad): dejás la mochila en la banca, sacás el cuerpo de cámara, elegís y montás el lente, insertás batería y tarjeta y podés cargar el perfil de deportes. Hasta entonces la cámara va guardada.
- **Horario de cada cobertura** (en la Redacción): original, tarde, atardecer, noche o **ciclo real** (empieza 17:05 y anochece durante el partido). Sol, cielo, niebla, nubes y exposición cambian minuto a minuto; los focos, vallas LED, ventanas y faroles se encienden gradualmente.
- **Sedes:** Estadio La Cueva (Tibás), **Estadio de Alajuela** (techos rojos con paneles solares, butacas rojinegras por bloques, torres de luz rayadas) y **Estadio de Cartago** (butacas azules con pasillos amarillos, estructura metálica azul, torres de celosía), además del Metropolitano Irazú.
- **Física:** futbolistas con giros y aceleraciones limitadas, inclinación en curvas y mirada al balón; cámara con resorte amortiguado y visor con inercia según el peso del lente.

### Fotorrealismo y primera persona
- Iluminación por mapa de entorno (IBL) generada desde el cielo físico o desde los focos nocturnos: reflejos coherentes en césped mojado, plásticos y metal.
- Bóveda de nubes según el clima (despejado, nublado, lluvia) y tonos de atardecer; niebla atmosférica.
- Paisaje del Valle Central: cordillera brumosa y un valle urbano con casas de techos de zinc y teja, árboles y luces de ciudad de noche.
- Postprocesado cinematográfico: *bloom* en los focos, oclusión ambiental GTAO (calidad Alta/Ultra), gradación de color con curva suave, viñeta, aberración cromática leve y grano de película.
- Relieve procedural (mapas de normales) en césped, concreto, asfalto y aceras.
- **Primera persona** (`V`, R3 o *Ajustes → Vista*): cámara a la altura de los ojos con balanceo natural al caminar y correr, manos sosteniendo tu cámara con el lente equipado, y retícula para interactuar. El visor fotográfico funciona igual desde ambas vistas.

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
  npc/          NPC genérico + apariencias (Mariana, Kendall Rojas, guardia, policía, stewards…)
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

## Cómo se verificó

Se ejecutó el juego en Chromium (render por software) con scripts de Playwright y se revisaron capturas de cada etapa:

- Menú con el estadio de fondo, calle, puesto de acreditaciones, credencial, control de seguridad (banda del escáner y arco), pasillo, sala de prensa, túnel, zona de Kendall Rojas.
- Visor fotográfico y fotos JPEG reales: profundidad de campo física, sobreexposición a 1/60 (+4 EV) detectada, foco errado detectado ("El foco quedó 24,1 m delante de…"), celebración evaluada 85/100 y marcada como posible portada.
- Partidos completos simulados a velocidad acelerada (90 minutos): marcadores 1-1, 2-1, 1-3; 12–19 remates, 5–9 atajadas, córners, penales, amarillas y rojas, disputas aéreas.
- Entrega al editor → resultados (+6 reputación, ₡130 600) → Redacción con calendario y tienda.
- Estadios Irazú (noche), Irazú con lluvia (césped mojado con reflejos) y La Fortaleza (clásico).
- Draw calls: ~2 200 → ~500–690 tras convertir personajes a *SkinnedMesh* y fusionar geometría estática.

## Limitaciones conocidas / siguientes pasos

- Los modelos son *low-poly* procedurales (sin assets externos); la fase de producción visual (modelos esculpidos, captura de movimiento, texturas fotográficas) queda pendiente.
- Las voces son murmullos sintetizados (opcionalmente texto a voz del navegador); no hay doblaje.
- Si se carga una partida guardada a mitad de evento, se retoma desde el inicio de ese evento (con inventario y progreso intactos).
- La IA de fútbol no modela fuera de juego ni sustituciones.
- Fase 5 (expansión): más estadios, torneos de selecciones, modo libre configurable, redes sociales del fotógrafo.
