import * as THREE from 'three';
import { NPC, LOOKS, randomFan } from '../npc/NPC.js';
import { formatClock, rand, pick } from '../core/MathUtil.js';
import { STADIUMS } from '../world/StadiumConfigs.js';

const ALVARO_TIPS = [
  'Seguí la jugada, no el balón. Cuando un extremo encara por la banda, ya deberías estar apuntando al área.',
  'Detrás de la portería tenés las mejores caras: remates de frente, atajadas y celebraciones que vienen hacia vos.',
  'Si la luz baja, subí el ISO antes que bajar la velocidad. Una foto con ruido se publica; una foto movida, no.',
  'El teleobjetivo comprime: con 400 mm el delantero y el defensor parecen pegados. Eso da tensión.',
  'Arrodillate con C: el ángulo bajo hace ver a los jugadores más heroicos y limpia el fondo.',
  'Para el paneo, bajá a 1/250 y seguí al jugador mientras disparás. Fondo barrido, jugador nítido.',
  'Al final, elegí pocas y buenas. El editor no quiere veinte fotos iguales.',
  'Si querés cambiar de lado durante el juego, rodeá por la banda opuesta. Por el área técnica no se pasa.',
];

export class Story {
  constructor(game) { this.game = game; this.introDone = false; this.stage = 'street'; this.npcs = []; this.timers = []; }
  serialize() { return { introDone: this.introDone }; }
  load(d) { this.introDone = !!d?.introDone; }
  clear() { for (const n of this.npcs) n.root.parent?.remove(n.root); for (const m of this.props || []) m.parent?.remove(m); this.props = []; this.npcs = []; this.game.storyNPCs = []; this.game.stewards = []; }
  // Prepara NPC, interacciones y objetivos de un evento.
  setup(ev, intro) {
    const g = this.game, st = g.stadium, city = g.city, P = city.P, I = g.interaction;
    this.ev = ev; this.intro = intro; this.stage = 'street'; this.gateHinted = false; this.briefed = false; this.kickedOff = false; this.inBowlOnce = false;
    this.clear();
    const add = (parent, o) => { const n = new NPC(g, parent, o); this.npcs.push(n); return n; };
    // ---------- Personajes principales ----------
    this.mariana = add(city.group, { name: 'Mariana Quesada', role: 'story', look: LOOKS.mariana, pos: city.spots.mariana, yaw: 0, idle: 'clipboard' });
    this.mariana.mapLabel = 'Mariana (acreditaciones)';
    this.guard = add(st.group, { name: 'Oficial Brenes', role: 'story', look: LOOKS.guard, pos: st.spots.guard, yaw: 0, idle: 'loco' });
    this.guard.mapLabel = 'Seguridad';
    this.alvaro = add(st.group, { name: 'Don Álvaro', role: 'story', look: LOOKS.alvaro, pos: st.spots.alvaro, yaw: -Math.PI / 2, idle: 'sit', camera: 400 });
    this.alvaro.mapLabel = 'Don Álvaro';
    g.storyNPCs = [this.mariana, this.guard, this.alvaro];
    // Policías en la plaza, periodistas en fila, vendedores
    add(city.group, { name: 'Policía', look: LOOKS.police, pos: new THREE.Vector3(4, 0, st.gateZ + 8), yaw: Math.PI, idle: 'loco' });
    add(city.group, { name: 'Policía', look: LOOKS.police, pos: new THREE.Vector3(-5, 0, st.gateZ + 10), yaw: Math.PI * 0.8, idle: 'talk', chatty: 0.5 });
    add(city.group, { name: 'Periodista', look: LOOKS.journalist, pos: city.spots.mariana.clone().add(new THREE.Vector3(1.5, 0, 3.4)), yaw: Math.PI, idle: 'talk', chatty: 0.6 });
    for (const v of city.vendorSpots) add(city.group, { name: 'Vendedor', look: LOOKS.vendor, pos: v.pos, yaw: Math.PI, idle: 'wave', chatty: 1 });
    // Aficionados caminando y en grupos
    const home = g.team(ev.home), away = g.team(ev.away);
    const routeFan = () => {
      const start = new THREE.Vector3(rand(-150, 150), 0, P + rand(0.8, 3.2));
      const mid = new THREE.Vector3(rand(-30, 30), 0, P - rand(4, 10));
      const nearGate = new THREE.Vector3(pick([-20, -14, 14, 20]), 0, st.gateZ + rand(3, 8));
      return [start, mid, nearGate, new THREE.Vector3(rand(-40, 40), 0, st.gateZ + rand(12, 28)), start];
    };
    const nFans = Math.round(18 * g.settings.q.crowd + 6);
    for (let i = 0; i < nFans; i++) { const r = routeFan(); add(city.group, { name: 'Aficionado', look: randomFan(Math.random() < 0.7 ? home : away), pos: r[0], route: r, speed: rand(1.1, 1.6), chatty: 0.2 }); }
    for (let k = 0; k < 5; k++) {
      const c = new THREE.Vector3(rand(-45, 45), 0, st.gateZ + rand(10, 28));
      for (let j = 0; j < 3; j++) { const a = (j / 3) * Math.PI * 2; add(city.group, { name: 'Aficionado', look: randomFan(home), pos: c.clone().add(new THREE.Vector3(Math.cos(a), 0, Math.sin(a))), yaw: a + Math.PI, idle: j === 0 ? 'talk' : pick(['loco', 'talk', 'cheer']), chatty: 0.7 }); }
    }
    // Stewards y fotógrafos dentro del estadio
    g.stewards = st.spots.stewards.map((p) => add(st.group, { name: 'Steward', look: LOOKS.steward, pos: p, yaw: p.z > 0 ? Math.PI : 0, idle: 'loco', speed: 2 }));
    const stoolM = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.6, metalness: 0.4 });
    const stool = (pos) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.44, 10), stoolM); m.position.set(pos.x, 0.22, pos.z); m.castShadow = true; st.group.add(m); this.props.push(m); };
    stool(st.spots.alvaro);
    for (const p of st.spots.photographers) { if (Math.random() < 0.7) p.userData = 'sit'; }
    for (const p of st.spots.photographers) add(st.group, { name: 'Fotógrafo', look: { ...LOOKS.photog, skin: pick(['#e0ac85', '#c68d63', '#a86f48', '#f1c9a5']), vest: pick(['#0b3d91', '#c8102e', '#2a9d8f']) }, pos: p, yaw: p.x > 0 ? -Math.PI / 2 : Math.PI / 2, idle: p.userData === 'sit' ? (stool(p), 'sit') : 'kneel', camera: pick([300, 400, 600]) });
    // ---------- Interacciones ----------
    I.clear();
    I.add({ position: this.mariana.pos.clone().setY(1.2).add(new THREE.Vector3(0, 0, 2)), radius: 3.2, prompt: () => `<kbd>${g.ui.key('interact')}</kbd>Hablar con Mariana`, onInteract: () => this.talkMariana() });
    I.add({ position: st.spots.guard.clone().setY(1.2), radius: 3.5, prompt: () => this.stage === 'street' || this.stage === 'credential' ? `<kbd>${g.ui.key('interact')}</kbd>Presentarse en seguridad` : null, onInteract: () => this.security() });
    I.add({ getPosition: () => this.alvaro.pos.clone().setY(1), position: this.alvaro.pos, radius: 3, prompt: () => `<kbd>${g.ui.key('interact')}</kbd>Hablar con Don Álvaro`, onInteract: () => this.talkAlvaro() });
    I.add({ position: st.pressDoor.center, radius: 2.4, prompt: () => (st.pressDoor.isOpen ? null : `<kbd>${g.ui.key('interact')}</kbd>Abrir: Sala de prensa`), onInteract: () => {
      if (!g.inventory.credential) { g.ui.toast('Acceso restringido: se requiere acreditación de prensa.', 'warn'); g.audio?.ui('error'); return; }
      st.pressDoor.open(); g.audio?.ui('door'); g.ui.toast('Tu acreditación abre la sala de prensa.', 'good');
    } });
    for (const d of st.lockerDoors) I.add({ position: d.center, radius: 2.2, prompt: () => `<kbd>${g.ui.key('interact')}</kbd>${d.label}`, onInteract: () => { g.audio?.ui('error'); g.ui.toast(`${d.label}: acceso exclusivo para jugadores y cuerpo técnico. Tu acreditación (Foto · Campo) no incluye esta zona.`, 'warn', 4000); } });
    for (const lp of st.pressLaptops) I.add({ position: lp, radius: 1.6, prompt: () => `<kbd>${g.ui.key('interact')}</kbd>${this.stage === 'post' ? 'Entregar fotografías al editor' : 'Usar laptop de prensa'}`, onInteract: () => this.laptop() });
    for (const v of city.vendorSpots) I.add({ position: v.pos.clone().setY(1), radius: 2.5, prompt: () => `<kbd>${g.ui.key('interact')}</kbd>Comprar en «${v.name}» (₡1 000)`, onInteract: () => {
      if (g.career.money < 1000) { g.ui.toast('No te alcanza.', 'warn'); return; }
      g.career.money -= 1000; g.player.stamina = 1; g.audio?.ui('cash'); g.audio?.say('¡Gracias, pura vida!'); g.ui.toast(`Compraste algo en ${v.name}. ¡Energía al máximo!`, 'good');
    } });
    // ---------- Arranque ----------
    g.missions.clearEventMissions();
    g.inventory.credential = null; g.missions.add('m_acred');
    this.setObjective();
    g.clock = ev.kickoff - (intro ? 34 : 26);
    if (intro) setTimeout(() => g.ui.hint('Primera cobertura', `Hoy es tu primera cobertura. Recogé tu acreditación y llegá al estadio.<br><br><kbd>W A S D</kbd>moverse · <kbd>Shift</kbd>correr · <kbd>${g.ui.key('interact')}</kbd>interactuar · <kbd>M</kbd>mapa · <kbd>Esc</kbd>pausa`, 14000), 600);
  }
  setObjective() {
    if (!this.ev) return;
    const g = this.game, s = this.stage, ko = formatClock(this.ev.kickoff);
    const T = {
      street: 'Recogé tu acreditación en el toldo azul de prensa (plaza del estadio).',
      credential: 'Andá al acceso de prensa del estadio y pasá el control de seguridad.',
      inside: `Cruzá el túnel y buscá a Don Álvaro detrás de la portería este. Saque inicial: ${ko}.`,
      field: 'Hablá con Don Álvaro en la zona de prensa este.',
      briefed: this.kickedOff ? 'Cubrí el partido: buscá las mejores jugadas.' : `Fotografiá el calentamiento. El partido inicia a las ${ko} (T: esperar el saque).`,
      match: 'Cubrí el partido. Anticipá las jugadas y respetá las zonas de prensa.',
      post: 'Partido terminado: andá a la sala de prensa y entregá tus fotos al editor.',
      done: 'Cobertura entregada.',
    };
    g.ui.setObjective(T[s] || '');
  }
  objectivePos() {
    const g = this.game, st = g.stadium;
    return { street: this.mariana?.pos, credential: st.spots.guard, inside: this.alvaro?.pos, field: this.alvaro?.pos, post: st.spots.laptop }[this.stage] || null;
  }
  async talkMariana() {
    const g = this.game, inv = g.inventory, ev = this.ev, M = { who: 'Mariana Quesada', role: 'Coordinadora de prensa', color: '#0b3d91', initials: 'MQ', pitch: 1.5, pos: this.mariana.pos.clone().setY(1.6) };
    this.mariana.playOnce('talk', 6);
    if (inv.credential && inv.credential.eventId === ev.id) {
      await g.ui.dialogue([{ ...M, text: pick([`Ya tenés tu acreditación, ${g.playerName}. El acceso de prensa está al fondo de la plaza.`, 'Recordá: nada de pisar la cancha. ¡Suerte!', `El partido arranca a las ${formatClock(ev.kickoff)}. ¡No te me atrasés!`]) }]);
      return;
    }
    const st = STADIUMS[ev.stadium];
    const lines = this.intro ? [
      { ...M, text: `¡Hola! Vos debés ser ${g.playerName}, el nuevo colaborador de Pura Vida Deportes. Soy Mariana Quesada, coordinadora de prensa de la Liga.` },
      { ...M, text: 'Dejame verificar en la lista… aquí estás. Esta es tu acreditación: es personal e intransferible.' },
      { ...M, text: 'Te da acceso al túnel, a la sala de prensa y a las zonas de fotógrafos pintadas en azul detrás de las porterías.' },
      { ...M, text: 'Reglas: nunca pisés la cancha y no entrés al área técnica mientras se juega. Si querés cambiar de lado, rodeá por la banda opuesta o por el pasillo detrás de los bancos. Tres faltas y seguridad te saca.' },
      { ...M, text: `El partido es ${g.teamName(ev.home)} contra ${g.teamName(ev.away)} a las ${formatClock(ev.kickoff)}. Don Álvaro te espera detrás de la portería este. ¡Mucha suerte en tu primera cobertura!`, options: [{ label: '¡Gracias, Mariana!', value: 1 }] },
    ] : [
      { ...M, text: `¡Qué dicha verte de nuevo, ${g.playerName}! Hoy cubrís ${g.teamName(ev.home)} vs ${g.teamName(ev.away)} en el ${st.name}.` },
      { ...M, text: `Aquí está tu acreditación. El encargo del editor es: «${ev.assignment.title}». ${ev.clasico ? 'Es clásico: seguridad está más estricta que nunca.' : 'Ya sabés las reglas.'}`, options: [{ label: 'Gracias', value: 1 }] },
    ];
    await g.ui.dialogue(lines);
    const d = new Date();
    inv.credential = { eventId: ev.id, event: `${ev.title} · ${g.team(ev.home).short} vs ${g.team(ev.away).short}`, home: ev.home, away: ev.away, stadium: st.name, date: d.toLocaleDateString('es-CR') + ' · ' + formatClock(ev.kickoff), number: `LT-26-${String(Math.floor(Math.random() * 9000) + 1000)}` };
    if (!inv.owned.credential) inv.owned.credential = 1;
    g.audio?.ui('mission');
    g.screens.credential(() => {
      this.stage = 'credential'; this.setObjective(); g.events.emit('story:credential'); g.missions.add('m_llegar');
      g.saves.save('auto'); g.ui.toast('Autoguardado', 'info', 1200);
    });
  }
  async security() {
    const g = this.game, st = g.stadium, inv = g.inventory;
    const G = { who: 'Oficial Brenes', role: 'Seguridad del estadio', color: '#2b2f3a', initials: 'OB', pitch: 0.8, pos: this.guard.pos.clone().setY(1.7) };
    this.guard.playOnce('talk', 4);
    if (!inv.credential || inv.credential.eventId !== this.ev.id) {
      await g.ui.dialogue([{ ...G, text: 'Buenas. Este es el acceso de prensa: sin acreditación no lo puedo dejar pasar. Las acreditaciones las entrega Mariana en el toldo azul de la plaza.' }]);
      return;
    }
    if (this.stage !== 'credential' && this.stage !== 'street') return;
    await g.ui.dialogue([
      { ...G, text: '¿Me permite su acreditación, por favor?' },
      { ...G, text: `${g.playerName}… Pura Vida Deportes… zona Foto · Campo, número ${inv.credential.number}. Todo en orden.` },
      { ...G, text: 'Ponga la mochila en la banda del escáner y pase por el arco detector, por favor.' },
    ]);
    // Secuencia de inspección real: la mochila viaja por la banda y el jugador cruza el arco
    g.cinematic = true; this.stage = 'security'; g.ui.setPrompt(null);
    const p = g.player, bp = p.avatar.backpack, bag = bp.clone(); bp.visible = false;
    const xin = st.spots.xrayIn, xout = st.spots.xrayOut; st.group.add(bag); bag.position.copy(xin); bag.rotation.set(Math.PI / 2, 0, 0); bag.scale.setScalar(1);
    g.audio?.ui('scanner');
    st.xrayScreen.material.color.set(0x1a6b3a);
    await this.tween(2.6, (t) => { bag.position.lerpVectors(xin, xout, t); st.xrayScreen.material.color.setHSL(0.33, 0.6, 0.15 + 0.2 * Math.abs(Math.sin(t * 20))); });
    st.xrayScreen.material.color.set(0x0a1a10);
    // Caminar a través del arco
    const a = st.spots.gateOutside.clone().setZ(st.gateZ + 4), b = st.spots.gateOutside.clone().setZ(st.gateZ + 1.2);
    p.place(a.x, a.z, Math.PI); g.follow.yaw = Math.PI; g.follow.snap(p);
    await this.tween(1.6, (t) => { p.pos.lerpVectors(a, b, t); p.root.position.copy(p.pos); p.avatar.update(1 / 60, 1.4); });
    st.detectorLight.material.color.set(0x33ff55); g.audio?.ui('beep');
    st.group.remove(bag); bp.visible = true;
    st.gate.open(); g.audio?.ui('door');
    g.cinematic = false;
    await g.ui.dialogue([{ ...G, text: 'Listo, adelante. Siga el pasillo y baje por el túnel. ¡Buen trabajo!' }]);
    this.stage = 'inside'; this.setObjective(); if (!this.gateHinted) { this.gateHinted = true; g.events.emit('story:gate'); } g.events.emit('story:security'); g.missions.add('m_cancha');
    g.saves.save('auto');
  }
  tween(dur, fn) { return new Promise((res) => { this.timers.push({ t: 0, dur, fn, res }); }); }
  async talkAlvaro() {
    const g = this.game, A = { who: 'Don Álvaro Jiménez', role: 'Fotógrafo veterano · mentor', color: '#4a5d23', initials: 'ÁJ', pitch: 0.85, pos: this.alvaro.pos.clone().setY(1.2) };
    if (this.stage === 'inside' || this.stage === 'field') {
      const first = !this.introDone && this.intro;
      const lines = first ? [
        { ...A, text: `¡Diay, mae! Vos sos ${g.playerName}, el nuevo. Álvaro Jiménez, treinta años sentado detrás de estas porterías. Bienvenido a la cancha.` },
        { ...A, text: `Primero lo primero: sacá la cámara con ${g.ui.key('equip')}. Con clic derecho levantás el visor y con la rueda del mouse hacés zoom.` },
        { ...A, text: `En fútbol la velocidad lo es todo: a 1/1000 o más rápido congelás a los jugadores. En el visor, ${g.ui.key('paramPrev')} y ${g.ui.key('paramNext')} eligen el parámetro; ${g.ui.key('paramDec')} y ${g.ui.key('paramInc')} lo cambian. Dejá el ISO en AUTO si la luz cambia.` },
        { ...A, text: `El enfoque AF-C sigue al jugador: cuando el cuadro se pone verde, está nítido. Con ${g.ui.key('autofocus')} reenfocás sobre lo que tengas en el centro. Con ${g.ui.key('driveMode')} pasás a ráfaga.` },
        { ...A, text: 'Y lo más importante: anticipá. No sigás el balón, seguí la jugada. Cuando un delantero entra al área, vos ya tenés que estar encuadrándolo.' },
        { ...A, text: 'Calentemos la mano: tomame cinco fotos buenas del calentamiento. Cuando arranque el partido, quedate de este lado o buscá la portería donde ataquen más.', options: [{ label: 'Entendido, Don Álvaro', value: 1 }] },
      ] : [
        { ...A, text: `${pick(['¡Qué hubo!', '¡Pura vida, mae!', '¡Llegó el profesional!'])} Hoy el encargo es «${this.ev.assignment.title}». ${pick(ALVARO_TIPS)}`, options: [{ label: 'Gracias por el consejo', value: 1 }] },
      ];
      this.alvaro.playOnce('talk', 5);
      await g.ui.dialogue(lines);
      this.stage = 'briefed'; this.briefed = true; this.setObjective(); g.events.emit('story:alvaro');
      if (this.intro) g.missions.add('m_calentamiento');
      for (const id of this.ev.missions) if (id !== 'm_entrega' && id !== 'm_calentamiento') g.missions.add(id);
      if (first) setTimeout(() => g.ui.hint('Modo fotografía', `<kbd>${g.ui.key('equip')}</kbd>equipar cámara<br><kbd>Clic der.</kbd>visor · <kbd>Clic</kbd>disparar · <kbd>Rueda</kbd>zoom<br><kbd>${g.ui.key('paramPrev')}</kbd>/<kbd>${g.ui.key('paramNext')}</kbd> parámetro · <kbd>${g.ui.key('paramDec')}</kbd>/<kbd>${g.ui.key('paramInc')}</kbd> valor<br><kbd>${g.ui.key('autofocus')}</kbd>autofoco · <kbd>${g.ui.key('driveMode')}</kbd>ráfaga · <kbd>${g.ui.key('crouch')}</kbd>arrodillarse<br><kbd>${g.ui.key('gallery')}</kbd>galería · <kbd>T</kbd>esperar el saque`, 20000), 400);
      return;
    }
    const opts = [{ label: 'Gracias', value: 0 }];
    if (!this.kickedOff) opts.unshift({ label: 'Estoy listo para el partido', value: 'ready' });
    const v = await g.ui.dialogue([{ ...A, text: this.stage === 'post' ? 'Buen partido. Ahora andá a la sala de prensa y escogé con cabeza fría: pocas y buenas.' : pick(ALVARO_TIPS), options: opts }]);
    if (v === 'ready') this.kickoffNow();
  }
  kickoffNow() { const g = this.game; if (!this.kickedOff) g.clock = Math.max(g.clock, this.ev.kickoff); }
  async laptop() {
    const g = this.game;
    if (this.stage !== 'post') {
      await g.ui.dialogue([{ who: 'Laptop de prensa', role: 'Pura Vida Deportes', color: '#0b3d91', initials: 'PV', voice: false, text: 'Sistema de envío de Pura Vida Deportes. Podrás entregar tus fotografías al editor cuando termine el partido. Mientras tanto, podés revisar tu galería con P.' }]);
      return;
    }
    const E = { who: 'Ricardo Solano', role: 'Editor deportivo · videollamada', color: '#c8102e', initials: 'RS', pitch: 0.9 };
    await g.ui.dialogue([{ ...E, text: `Buenas, ${g.playerName}. Mandame tus mejores fotos, máximo diez. El encargo era «${this.ev.assignment.title}». Las reviso de una vez.` }]);
    g.openDelivery();
  }
  update(dt) {
    const g = this.game, st = g.stadium, p = g.player.pos;
    // Animaciones scriptadas
    for (const t of this.timers.slice()) { t.t += dt; t.fn(Math.min(1, t.t / t.dur)); if (t.t >= t.dur) { this.timers.splice(this.timers.indexOf(t), 1); t.res(); } }
    // Disparadores por ubicación
    if (this.stage === 'credential' && p.z < st.gateZ + 14 && Math.abs(p.x) < 12 && !this.gateHinted) { this.gateHinted = true; g.ui.toast('Presentá tu acreditación al guardia de seguridad.', 'info'); g.events.emit('story:gate'); g.missions.add('m_seguridad'); }
    const inBowl = Math.abs(p.x) < 64 && Math.abs(p.z) < 43.6;
    if (inBowl && !this.inBowlOnce) { this.inBowlOnce = true; if (this.stage === 'inside') { this.stage = 'field'; this.setObjective(); } g.ui.toast(`Bienvenido al ${STADIUMS[this.ev.stadium].name}.`, 'info'); }
    // Reloj del día y saque inicial
    if (!this.kickedOff) {
      g.clock += dt / 4.2;
      if (inBowl && g.input.keyPressed('KeyT')) { this.kickoffNow(); }
      if (g.clock >= this.ev.kickoff) {
        this.kickedOff = true; g.match.startMatch();
        if (!this.inBowlOnce) { g.career.eventState.arrivedOnTime = false; g.ui.toast('¡El partido empezó y todavía no estás en la cancha! Llegaste tarde.', 'bad', 5000); }
        else g.ui.toast('¡Los equipos salen a la cancha!', 'info');
        if (this.stage === 'briefed') this.setObjective();
        g.missions.active.filter((m) => m.id === 'm_calentamiento' && m.status === 'active').forEach((m) => { m.status = 'failed'; g.ui.toast('El calentamiento terminó.', 'warn'); setTimeout(() => { g.missions.active = g.missions.active.filter((x) => x !== m); }, 2000); });
      }
    } else if (g.match) {
      g.clock = this.ev.kickoff + (g.match.phase === 'warmup' ? 0 : g.match.minute + (g.match.half === 2 ? 15 : 0));
    }
  }
  onMatchEnd() {
    const g = this.game; if (!this.ev || !g.inEvent) return;
    this.stage = 'post'; this.setObjective(); g.missions.add('m_entrega');
    g.ui.toast('¡Final del partido! Entregá tus fotos en la sala de prensa.', 'mission', 5000);
    g.saves.save('auto');
  }
}
