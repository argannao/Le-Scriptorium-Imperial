/* ==========================================================
   Créateur d'agent — logique
   Dépend de js/createur-data.js
   ========================================================== */
(() => {
  const STORE_KEY = "scriptorium-agent-v1";
  const $ = (sel, root = document) => root.querySelector(sel);
  const d10 = () => Math.floor(Math.random() * 10) + 1;
  const d100 = () => Math.floor(Math.random() * 100) + 1;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const carNom = (id) => CARACS.find((c) => c.id === id).ab;
  const byId = (list, id) => list.find((x) => x.id === id);

  const blank = () => ({
    name: "", notes: "", species: "humain",
    car: { mode: "hasard", values: null, rolls: 0, swapped: false, swapSel: null, points: Object.fromEntries(CARACS.map((c) => [c.id, 10])) },
    origin: { id: "", rolled: false, choix: "" },
    faction: { id: "", rolled: false, choix: "", adv: {}, talentPick: 0, equip: {} },
    role: { id: "", rolled: false, talents: [], adv: {}, specs: {}, equip: {} },
    psy: { discipline: "", minor: [], powers: [] },
    xp: blankXp(),
    levels: [], maxLevel: 20, view: 0,     // niveaux 2+ (un par mission) · niveau max · niveau consulté (0 = actuel)
  });
  function blankXp() { return { car: {}, skill: {}, spec: {}, talents: [], minor: [], powers: [] }; }

  /* ---------- Niveaux : niveau 1 = création (S.xp), puis un « seau » d'achats par mission ---------- */
  let VIEW = 0;                                           // niveau pris en compte par les calculs (0 = tous)
  const allBuckets = () => [S.xp, ...S.levels];
  const buckets = () => (VIEW ? allBuckets().slice(0, VIEW) : allBuckets());
  const level = () => 1 + S.levels.length;
  const E = () => S.levels.length ? S.levels[S.levels.length - 1] : S.xp;   // niveau en cours d'achat
  const eachBucket = (fn) => allBuckets().forEach(fn);
  function X() {
    const m = blankXp();
    buckets().forEach((b) => {
      ["car", "skill", "spec"].forEach((k) => Object.entries(b[k] || {}).forEach(([id, n]) => { m[k][id] = (m[k][id] || 0) + n; }));
      ["talents", "minor", "powers"].forEach((k) => m[k].push(...(b[k] || [])));
    });
    return m;
  }
  function at(n, fn) { const old = VIEW; VIEW = n; try { return fn(); } finally { VIEW = old; } }

  let S = load() || blank();

  function load() {
    try { const raw = localStorage.getItem(STORE_KEY); return raw ? normalize(JSON.parse(raw)) : null; } catch (e) { return null; }
  }
  function normalize(obj) {
    const st = Object.assign(blank(), obj);
    st.xp = Object.assign(blankXp(), obj.xp || {});
    st.levels = (obj.levels || []).map((l) => Object.assign(blankXp(), { xp: 100 }, l));
    return st;
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible : on continue sans */ }
  }

  /* ---------- Calculs ---------- */

  const faction = () => byId(FACTIONS, S.faction.id);
  const role = () => byId(ROLES, S.role.id);
  const origin = () => byId(ORIGINS, S.origin.id);
  const species = () => byId(SPECIES, S.species) || SPECIES[0];
  const xenosOrigin = () => !!species().remplaceOrigine;           // l'espèce tient lieu d'origine
  const factionAllowed = (id) => !species().factions || species().factions.includes(id);

  function baseCaracs() {
    if (S.car.mode === "repartition") return Object.fromEntries(CARACS.map((c) => [c.id, 20 + (S.car.points[c.id] || 0)]));
    return S.car.values ? { ...S.car.values } : null;
  }

  function finalCaracs() {
    const b = creationCaracs();
    if (!b) return null;
    const x = X(); CARACS.forEach((c) => { b[c.id] += x.car[c.id] || 0; });
    return b;
  }

  function creationCaracs() {
    const b = baseCaracs();
    if (!b) return null;
    const o = origin(), f = faction();
    Object.entries(species().mods || {}).forEach(([c, v]) => { b[c] += v; });
    if (o && !xenosOrigin()) { b[o.fixe] += 5; if (S.origin.choix) b[S.origin.choix] += 5; }
    if (f) { b[f.fixe] += 5; if (S.faction.choix) b[S.faction.choix] += 5; }
    return b;
  }
  const bonus = (v) => Math.floor(v / 10);

  function factionTalents() {
    const f = faction();
    if (!f) return [];
    if (f.talentChoices) return f.talentChoices[S.faction.talentPick] || [];
    return f.talents;
  }
  const isBlank = () => factionTalents().includes("Paria");
  const psykerFromFaction = () => factionTalents().includes("Psyker");
  const isPsyker = () => species().psyker !== false && (psykerFromFaction() || (role() && role().psyker));

  function allTalents() {
    const list = [...(species().talents || []), ...factionTalents().filter((t) => !(species().psyker === false && t.startsWith("Psyker")))];
    const r = role();
    if (r && r.psyker && !list.includes("Psyker")) list.push("Psyker");
    S.role.talents.forEach((t) => { if (!list.includes(t)) list.push(t); });
    X().talents.forEach((t) => { if (!list.includes(t)) list.push(t); });
    return list;
  }

  function powerCounts() {
    if (!isPsyker()) return { minor: 0, disc: 0 };
    const both = psykerFromFaction() && role() && role().psyker;
    return { minor: both ? 2 : 1, disc: both ? 2 : 1 };
  }

  const advTotal = (sk) => (S.faction.adv[sk] || 0) + (S.role.adv[sk] || 0);   // niveaux obtenus à la création
  const advAll = (sk) => advTotal(sk) + (X().skill[sk] || 0);                   // + niveaux achetés en XP
  const specAll = (key) => (S.role.specs[key] || 0) + (X().spec[key] || 0);

  /* Coûts en XP (livre de base, p. 90) */
  const CAR_COSTS = [[25, 20], [30, 25], [35, 30], [40, 40], [45, 60], [50, 80], [55, 110], [60, 140], [65, 180], [70, 220], [75, 270], [80, 320]];
  const carCost = (newValue) => (CAR_COSTS.find(([max]) => newValue <= max) || [0, 9999])[1];
  const levelCost = (level) => 50 * level;   // niveau 1 = 50, 2 = 100, 3 = 150, 4 = 200

  function spent() {
    let x = 0;
    const cc = creationCaracs(), m = X();
    if (cc) CARACS.forEach((c) => { for (let i = 1; i <= (m.car[c.id] || 0); i++) x += carCost(cc[c.id] + i); });
    Object.entries(m.skill).forEach(([sk, n]) => { for (let i = 1; i <= n; i++) x += levelCost(advTotal(sk) + i); });
    Object.entries(m.spec).forEach(([k, n]) => { for (let i = 1; i <= n; i++) x += levelCost((S.role.specs[k] || 0) + i); });
    x += 100 * m.talents.length + 60 * m.minor.length + 100 * m.powers.length;
    return x;
  }
  const remaining = () => xp() - spent();
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);

  function xp() {
    let x = 0;
    if (S.car.mode === "hasard" && S.car.rolls === 1) x += S.car.swapped ? 25 : 50;
    if (S.origin.rolled && !xenosOrigin()) x += 25;
    if (S.faction.rolled) x += 75;
    if (S.role.rolled) x += 50;
    S.levels.slice(0, VIEW ? VIEW - 1 : undefined).forEach((l) => { x += +l.xp || 0; });
    return x;
  }

  function roleSpecOptions() {
    const r = role();
    if (!r) return [];
    if (r.specList) return r.specList;
    return r.specSkills.flatMap((sk) => SKILLS[sk].specs.map((sp) => `${sk}:${sp}`));
  }

  /* ---------- Recommandations de caractéristiques ---------- */
  // Pondération : compétences du rôle ×2, de la faction ×1, plus un socle de survie (E pour les Blessures, Ag et Per pour l'Initiative)
  const ROLE_WHY = {
    interlocuteur: "parler, convaincre et lire les gens",
    mystique: "manifester et contrôler les pouvoirs psychiques",
    penombre: "se faufiler, tirer et réagir vite",
    savant: "savoir, soigner et réparer",
    guerrier: "frapper, tirer et encaisser",
    zelote: "tenir bon, frapper et inspirer par la foi",
  };
  function recoCaracs() {
    const w = Object.fromEntries(CARACS.map((c) => [c.id, 0]));
    const r = role(), f = faction();
    // ce que chaque rôle fait vraiment en jeu : 3 priorités puis 2 caractéristiques utiles
    const ROLE_CARACS = {
      interlocuteur: ["soc", "fm", "per", "int", "ag"],
      mystique:      ["fm", "per", "int", "e", "ag"],
      penombre:      ["ag", "ct", "per", "f", "e"],
      savant:        ["int", "per", "ag", "fm", "e"],
      guerrier:      ["cc", "ct", "e", "f", "ag"],
      zelote:        ["fm", "cc", "e", "f", "soc"],
    };
    if (r) ROLE_CARACS[r.id].forEach((c, i) => { w[c] += [6, 5, 4, 2.5, 2][i]; });
    if (f) { f.skills.forEach((sk) => { w[SKILLS[sk].c] += 0.4; }); w[f.fixe] += 1; }
    w.e += 1.5; w.ag += 0.5; w.per += 0.5;              // Blessures (2 × BE) et Initiative
    Object.entries(species().mods || {}).forEach(([c, v]) => { w[c] += v / 10; }); // jouer avec les forces de l'espèce
    const ordre = CARACS.map((c) => c.id).sort((a, b) => w[b] - w[a]);
    return { ordre, prio: ordre.slice(0, 3), utile: ordre.slice(3, 5), base: !r && !f };
  }
  function recoTexte() {
    const { prio, utile, base } = recoCaracs();
    const r = role(), f = faction();
    const pour = [r && r.nom, f && f.nom].filter(Boolean).join(" · ");
    const why = r ? ` (pour ${ROLE_WHY[r.id]})` : "";
    return `<div class="reco"><div class="reco-head">Recommandations ${base ? "générales" : `pour <strong>${esc(pour)}</strong>`}</div>
      <p><span class="reco-chip p1">Priorité</span> ${prio.map(carNom).join(", ")}${why}
      · <span class="reco-chip p2">Utile</span> ${utile.map(carNom).join(", ")}</p>
      <p class="hint">${base ? "Choisissez un rôle (étape 5) ou un archétype pour des conseils adaptés. " : ""}L'Endurance compte double dans les Blessures ; Perception et Agilité font l'Initiative. Un bonus (chiffre des dizaines) ne monte qu'à chaque dizaine franchie : 39 et 31 donnent le même bonus.</p></div>`;
  }

  /* ---------- Actions ---------- */

  function rollCaracs() {
    S.car.values = Object.fromEntries(CARACS.map((c) => [c.id, d10() + d10() + 20]));
    S.car.rolls += 1; S.car.swapped = false; S.car.swapSel = null;
  }
  function rollOrigin() {
    const r = d100();
    const o = ORIGINS.find((x) => r <= x.max);
    S.origin = { id: o.id, rolled: true, choix: "" };
    resetFaction();
    return r;
  }
  function rollFaction() {
    const r = d100();
    // un xenos tire au sort parmi les factions qui l'acceptent
    const f = xenosOrigin() || !S.origin.id
      ? (() => { const ok = FACTIONS.filter((x) => factionAllowed(x.id)); return ok[Math.floor(Math.random() * ok.length)]; })()
      : FACTIONS.find((x) => r <= x.roll[S.origin.id]);
    S.faction = { id: f.id, rolled: true, choix: "", adv: {}, talentPick: 0, equip: {} };
    resetRoleIfBlocked();
    return r;
  }
  function rollRole() {
    const options = ROLES.filter((r) => !(r.psyker && (isBlank() || species().psyker === false)));
    const r = options[Math.floor(Math.random() * options.length)];
    S.role = { id: r.id, rolled: true, talents: [], adv: {}, specs: {}, equip: {} };
    S.psy = { discipline: "", minor: [], powers: [] };
  }
  function resetFaction() { S.faction = { id: "", rolled: false, choix: "", adv: {}, talentPick: 0, equip: {} }; resetRoleIfBlocked(); }
  function resetRoleIfBlocked() {
    // les niveaux de compétence ne doivent pas dépasser 2 au total
    Object.keys(S.role.adv).forEach((sk) => { while (advTotal(sk) > 2 && S.role.adv[sk] > 0) S.role.adv[sk]--; });
    if (S.faction.id && !factionAllowed(S.faction.id)) S.faction = { id: "", rolled: false, choix: "", adv: {}, talentPick: 0, equip: {} };
    if (role() && role().psyker && (isBlank() || species().psyker === false)) S.role = { id: "", rolled: false, talents: [], adv: {}, specs: {}, equip: {} };
    if (!isPsyker()) { S.psy = { discipline: "", minor: [], powers: [] };
      eachBucket((b) => { b.minor = []; b.powers = []; delete b.skill.psy; Object.keys(b.spec).forEach((k) => { if (k.startsWith("psy:")) delete b.spec[k]; }); }); }
    eachBucket((b) => { b.talents = b.talents.filter((t) => !factionTalents().includes(t) && !S.role.talents.includes(t)); });
    [...allBuckets()].reverse().forEach((b) => Object.keys(b.skill).forEach((sk) => { while (advAll(sk) > 4 && b.skill[sk] > 0) b.skill[sk]--; }));
  }

  /* ---------- Rendu des étapes ---------- */

  function stepper(scope, sk, val, canPlus) {
    return `<span class="stepper">
      <button type="button" data-act="adv-" data-scope="${scope}" data-sk="${sk}" ${val <= 0 ? "disabled" : ""} aria-label="Retirer">−</button>
      <span class="val">${val}</span>
      <button type="button" data-act="adv+" data-scope="${scope}" data-sk="${sk}" ${canPlus ? "" : "disabled"} aria-label="Ajouter">+</button>
    </span>`;
  }

  // attribut de pop-up + petite icône « i » (utile au toucher)
  const tip = (kind, key) => ` data-tip="${esc(kind + "|" + key)}"`;
  const info = (kind, key) => `<span class="info"${tip(kind, key)} role="button" tabindex="0" aria-label="Voir la fiche">i</span>`;

  // un groupe de cartes radio, avec pop-up
  function cards(act, name, list, cur, kind, disabled = () => false) {
    return `<div class="chips cards">${list.map((x) => {
      const on = cur === x.id, dis = disabled(x);
      return `<label class="chip card ${on ? "on" : ""} ${dis ? "dis" : ""}"${tip(kind, x.id)}><input type="radio" name="${name}" data-act="${act}" value="${x.id}" ${on ? "checked" : ""} ${dis ? "disabled" : ""}>${esc(x.nom)}${info(kind, x.id)}</label>`;
    }).join("")}</div>`;
  }

  function equipPicker(scope, items, picks) {
    return items.map((it, i) => {
      if (typeof it === "string") return `<li><span class="tipped"${tip("item", it)}>${esc(it)}</span>${info("item", it)}</li>`;
      if (it.one) {
        const cur = picks[i] ?? "";
        return `<li>1 au choix :<div class="chips">${it.one.map((o) =>
          `<label class="chip ${cur === o ? "on" : ""}"${tip("item", o)}><input type="radio" name="eq-${scope}-${i}" data-act="equip-one" data-scope="${scope}" data-i="${i}" value="${esc(o)}" ${cur === o ? "checked" : ""}>${esc(o)}${info("item", o)}</label>`).join("")}</div></li>`;
      }
      const cur = picks[i] || [];
      return `<li>${it.pick} au choix :<div class="chips">${it.options.map((o) => {
        const on = cur.includes(o);
        const dis = !on && cur.length >= it.pick;
        return `<label class="chip ${on ? "on" : ""} ${dis ? "dis" : ""}"${tip("item", o)}><input type="checkbox" data-act="equip-pick" data-scope="${scope}" data-i="${i}" value="${esc(o)}" ${on ? "checked" : ""} ${dis ? "disabled" : ""}>${esc(o)}${info("item", o)}</label>`;
      }).join("")}</div></li>`;
    }).join("");
  }

  function renderSteps() {
    const o = origin(), f = faction(), r = role();
    const base = baseCaracs();

    // --- 1. Caractéristiques
    let car = `<div class="seg">
        <label><input type="radio" name="carmode" value="hasard" data-act="carmode" ${S.car.mode === "hasard" ? "checked" : ""}> Au hasard (2d10 + 20)</label>
        <label><input type="radio" name="carmode" value="repartition" data-act="carmode" ${S.car.mode === "repartition" ? "checked" : ""}> Répartition de 90 points</label>
      </div>`;
    const reco = recoCaracs();
    const rk = (id) => (reco.prio.includes(id) ? " reco-1" : reco.utile.includes(id) ? " reco-2" : "");
    car += recoTexte();
    if (S.car.mode === "hasard") {
      car += `<p><button class="btn" type="button" data-act="roll-car">${S.car.values ? "Relancer" : "Lancer les dés"}</button>
        <span class="hint">${S.car.rolls === 0 ? "Garder le premier jet : +50 XP. Réarranger : +25 XP. Relancer : pas d'XP."
          : S.car.rolls > 1 ? "Relancé : pas d'XP bonus." : S.car.swapped ? "Réarrangé : +25 XP." : "Premier jet gardé tel quel : +50 XP."}</span></p>`;
      if (base) {
        car += `<p class="hint">Pour échanger deux valeurs, cliquez sur l'une puis sur l'autre.
          <button class="btn ghost small" type="button" data-act="reco-sort">Placer mes meilleurs jets selon les recommandations</button>
          <span class="hint">(compte comme un réarrangement : +25 XP au lieu de 50)</span></p><div class="carac-grid">${CARACS.map((c) =>
          `<button type="button" class="carac${rk(c.id)} ${S.car.swapSel === c.id ? "sel" : ""}" data-act="swap" data-c="${c.id}"><span>${c.ab}</span><strong>${base[c.id]}</strong></button>`).join("")}</div>`;
      }
    } else {
      const used = sum(S.car.points);
      car += `<p class="hint">Chaque caractéristique part de 20. Répartissez 90 points (4 à 18 par caractéristique). Reste : <strong>${90 - used}</strong>
          <button class="btn ghost small" type="button" data-act="reco-points">Répartition conseillée</button>
          <button class="btn ghost small" type="button" data-act="reco-even">Tout à égalité</button></p>
        <div class="carac-grid">${CARACS.map((c) => {
          const v = S.car.points[c.id];
          return `<div class="carac${rk(c.id)}"><span>${c.ab}</span><strong>${20 + v}</strong>
            <span class="stepper"><button type="button" data-act="pt-" data-c="${c.id}" ${v <= 4 ? "disabled" : ""}>−</button>
            <button type="button" data-act="pt+" data-c="${c.id}" ${v >= 18 || used >= 90 ? "disabled" : ""}>+</button></span></div>`;
        }).join("")}</div>`;
    }
    $("#step-car").innerHTML = car;

    // --- Démarrage rapide par archétype
    const arch = byId(ARCHETYPES, S.archetype);
    let qs = `<p class="hint">Le tableau « Je veux jouer… » du livre propose une combinaison origine + faction + rôle pour chaque concept. Choisissez-en un : tout se remplit (caractéristiques conseillées, origine, faction, rôle, niveaux de compétence, spécialisations, talents, équipement et pouvoirs). Vous pouvez ensuite tout ajuster étape par étape.</p>
      <div class="row"><select class="select" id="arch-select"><option value="">— Choisir un archétype —</option>${ARCHETYPES.map((a) =>
        `<option value="${a.id}" ${S.archetype === a.id ? "selected" : ""}>${esc(a.nom)}</option>`).join("")}</select>
      <button class="btn" type="button" data-act="arch-apply">Appliquer</button></div>
      <div class="preview" data-preview-for="arch-select" data-kind="archetype">${arch ? tipContent("archetype", arch.id) : ""}</div>`;
    $("#step-archetype").innerHTML = qs;

    // --- Espèce
    const sp = species();
    let spc = `${cards("species", "spc", SPECIES, sp.id, "species")}
      <p class="hint">Les espèces xenos sont une <strong>règle maison</strong> du Scriptorium : Imperium Maledictum ne prévoit pas d'agents xenos. Validez-les avec votre MJ. Voir <a href="xenos.html#jouer">Jouer un xenos</a>.</p>`;
    if (sp.id !== "humain") {
      const mods = Object.entries(sp.mods).map(([c, v]) => `${v > 0 ? "+" : "−"}${Math.abs(v)} ${carNom(c)}`).join(", ");
      spc += `<p><em>${esc(sp.desc)}</em></p><p>Caractéristiques : <strong>${mods}</strong></p>
        <h4>Traits d'espèce</h4><div class="chips">${sp.traits.map((t) => `<span class="chip on"${tip("trait", sp.id + "|" + t.nom)}>${esc(t.nom)}${info("trait", sp.id + "|" + t.nom)}</span>`).join("")}</div>
        ${sp.talents.length ? `<p>Talent offert : ${sp.talents.map((x) => `<strong class="tipped"${tip("talent", x)}>${esc(x)}</strong>${info("talent", x)}`).join(", ")}</p>` : ""}
        ${sp.equip.length ? `<p>Équipement d'espèce : ${sp.equip.map((x) => `<span class="tipped"${tip("item", x)}>${esc(x)}</span>${info("item", x)}`).join(", ")}</p>` : ""}
        <p>Factions possibles : <strong>${sp.factions ? sp.factions.map((id) => byId(FACTIONS, id).nom).join(", ") : "toutes"}</strong>${sp.psyker === false ? " · ne peut pas être psyker" : ""}</p>
        <p>Relations : ${esc(sp.relations)}</p>`;
    }
    $("#step-species").innerHTML = spc;

    // --- 2. Origine
    let org = "";
    if (xenosOrigin()) org = `<p>Un xenos n'a pas d'origine impériale : <strong>l'espèce en tient lieu</strong> (pas de bonus d'origine, pas de tirage).</p><p><em>${esc(sp.remplaceOrigine)}</em></p>`;
    else org = `${cards("origin", "org", ORIGINS, S.origin.id, "origin")}
      <div class="row"><button class="btn" type="button" data-act="roll-origin">Lancer 1d100 (+25 XP)</button></div>`;
    if (o && !xenosOrigin()) {
      org += `<p>${S.origin.rolled ? "<span class='tag'>Tirée au sort</span> " : ""}<strong>+5 ${carNom(o.fixe)}</strong>, et +5 au choix :</p>
        <div class="seg">${o.choix.map((c) => `<label><input type="radio" name="ochoix" value="${c}" data-act="ochoix" ${S.origin.choix === c ? "checked" : ""}> ${carNom(c)}</label>`).join("")}</div>
        <p class="hint">Objet : <span class="tipped"${tip("item", o.objet)}>${esc(o.objet)}</span>${info("item", o.objet)}</p>`;
    }
    $("#step-origin").innerHTML = org;

    // --- 3. Faction
    let fac = "";
    if (!o && !xenosOrigin()) fac = `<p class="hint">Choisissez d'abord une origine (la table de faction en dépend).</p>`;
    else {
      fac = `${cards("faction", "fac", FACTIONS, S.faction.id, "faction", (x) => !factionAllowed(x.id))}
        ${species().factions ? `<p class="hint">Seules les factions qui acceptent un ${esc(species().nom.split(" (")[0])} sont disponibles.</p>` : ""}
        <div class="row"><button class="btn" type="button" data-act="roll-faction">Lancer 1d100 (+75 XP)</button></div>`;
      if (f) {
        const used = sum(S.faction.adv);
        fac += `<p>${S.faction.rolled ? "<span class='tag'>Tirée au sort</span> " : ""}<strong>+5 ${carNom(f.fixe)}</strong>, et +5 au choix :</p>
          <div class="seg">${f.choix.map((c) => `<label><input type="radio" name="fchoix" value="${c}" data-act="fchoix" ${S.faction.choix === c ? "checked" : ""}> ${carNom(c)}</label>`).join("")}</div>
          <h4>5 niveaux de compétence <span class="hint">(reste ${5 - used} ; 2 maximum par compétence)</span></h4>
          <div class="adv-list">${f.skills.map((sk) => {
            const v = S.faction.adv[sk] || 0;
            const locked = sk === "psy" && !isPsyker();
            return `<div class="adv"><span>${SKILLS[sk].nom}${locked ? " <small>(psyker requis)</small>" : ""}</span>${stepper("faction", sk, v, !locked && used < 5 && advTotal(sk) < 2)}</div>`;
          }).join("")}</div>`;
        if (f.talentChoices) {
          fac += `<h4>Talent(s)</h4><div class="seg col">${f.talentChoices.filter((t) => !(species().psyker === false && t.includes("Psyker"))).map((t) =>
            [t, f.talentChoices.indexOf(t)]).map(([t, i]) =>
            `<label><input type="radio" name="tpick" value="${i}" data-act="tpick" ${S.faction.talentPick === i ? "checked" : ""}> ${t.map((x) => `<span class="tipped"${tip("talent", x)}>${esc(x)}</span>${info("talent", x)}`).join(" + ")}</label>`).join("")}</div>`;
        } else if (f.talents.length) {
          fac += `<p>Talent : ${f.talents.map((x) => `<strong class="tipped"${tip("talent", x)}>${esc(x)}</strong>${info("talent", x)}`).join(", ")}</p>`;
        } else {
          fac += `<p class="hint">Pas de talent de faction : l'Adeptus Mechanicus donne deux augmétiques (voir l'équipement).</p>`;
        }
        fac += `<p>Influence : <strong>+1 ${esc(f.influence)}</strong></p>
          <h4>Équipement de faction</h4><ul class="equip">${equipPicker("faction", f.equip, S.faction.equip)}<li>${esc(f.solars)} solars</li></ul>`;
      }
    }
    $("#step-faction").innerHTML = fac;

    // --- 4. Rôle
    let rol = `${cards("role", "rol", ROLES, S.role.id, "role", (x) => x.psyker && (isBlank() || species().psyker === false))}
      ${isBlank() ? `<p class="hint">Un Paria ne peut pas être Mystique.</p>` : species().psyker === false ? `<p class="hint">Cette espèce ne peut pas être Mystique.</p>` : ""}
      <div class="row"><button class="btn" type="button" data-act="roll-role">Laisser le patron choisir (+50 XP)</button></div>`;
    if (r) {
      const owned = factionTalents();
      const used = sum(S.role.adv);
      const specUsed = sum(S.role.specs);
      rol += `<p>${S.role.rolled ? "<span class='tag'>Choisi par le patron</span> " : ""}<em>${esc(r.desc)}</em></p>`;
      if (r.psyker) rol += `<p>Talent : <strong>Psyker</strong>${psykerFromFaction() ? " (déjà acquis : un pouvoir mineur et un pouvoir de discipline en plus)" : ""}</p>`;
      rol += `<h4>Talents : ${r.talents.n} au choix <span class="hint">(${S.role.talents.length}/${r.talents.n})</span></h4>
        <div class="chips">${r.talents.list.map((t) => {
          const has = owned.includes(t);
          const on = S.role.talents.includes(t);
          const dis = has || (!on && S.role.talents.length >= r.talents.n);
          return `<label class="chip ${on ? "on" : ""} ${dis ? "dis" : ""}"${tip("talent", t)}><input type="checkbox" data-act="rtalent" value="${esc(t)}" ${on ? "checked" : ""} ${dis ? "disabled" : ""}>${esc(t)}${has ? " ✓" : ""}${info("talent", t)}</label>`;
        }).join("")}</div>
        <p class="hint">Détails des talents : <a href="talents.html" target="_blank">Archive IV</a>.</p>
        <h4>3 niveaux de compétence <span class="hint">(reste ${3 - used} ; 2 maximum par compétence au total)</span></h4>
        <div class="adv-list">${r.skills.map((sk) => {
          const v = S.role.adv[sk] || 0;
          return `<div class="adv"><span>${SKILLS[sk].nom} <small>(total ${advTotal(sk)})</small></span>${stepper("role", sk, v, used < 3 && advTotal(sk) < 2)}</div>`;
        }).join("")}</div>
        <h4>2 niveaux de spécialisation <span class="hint">(reste ${2 - specUsed} ; 1 maximum par spécialisation)</span></h4>
        <div class="chips">${roleSpecOptions().map((key) => {
          const [sk, sp] = key.split(":");
          const on = !!S.role.specs[key];
          const dis = !on && specUsed >= 2;
          return `<label class="chip ${on ? "on" : ""} ${dis ? "dis" : ""}"><input type="checkbox" data-act="rspec" value="${esc(key)}" ${on ? "checked" : ""} ${dis ? "disabled" : ""}>${SKILLS[sk].nom} (${esc(sp)})</label>`;
        }).join("")}</div>
        <h4>Équipement de rôle</h4><ul class="equip">${equipPicker("role", r.equip, S.role.equip)}</ul>`;
    }
    $("#step-role").innerHTML = rol;

    // --- 5. Pouvoirs psychiques
    const pc = powerCounts();
    let psy = "";
    if (!pc.minor) psy = `<p class="hint">Cette étape concerne uniquement les psykers (faction Astra Telepathica avec le talent Psyker, ou rôle Mystique).</p>`;
    else {
      psy = `<p>Choisissez une discipline, puis <strong>${pc.minor}</strong> pouvoir(s) mineur(s) et <strong>${pc.disc}</strong> pouvoir(s) de cette discipline. <a href="psy.html" target="_blank">Règles psychiques</a>.</p>
        <div class="row"><select class="select" data-act="psy-disc"><option value="">— Discipline —</option>${Object.keys(PSY_DISCIPLINES).map((d) =>
          `<option ${S.psy.discipline === d ? "selected" : ""}>${d}</option>`).join("")}</select></div>
        <h4>Pouvoirs mineurs <span class="hint">(${S.psy.minor.length}/${pc.minor})</span></h4>
        <div class="chips">${PSY_MINOR.map((p) => {
          const on = S.psy.minor.includes(p); const dis = !on && S.psy.minor.length >= pc.minor;
          return `<label class="chip ${on ? "on" : ""} ${dis ? "dis" : ""}"${tip("power", p)}><input type="checkbox" data-act="psy-minor" value="${p}" ${on ? "checked" : ""} ${dis ? "disabled" : ""}>${p}${info("power", p)}</label>`;
        }).join("")}</div>`;
      if (S.psy.discipline) {
        psy += `<h4>Pouvoirs de ${S.psy.discipline} <span class="hint">(${S.psy.powers.length}/${pc.disc})</span></h4>
          <div class="chips">${PSY_DISCIPLINES[S.psy.discipline].map((p) => {
            const on = S.psy.powers.includes(p); const dis = !on && S.psy.powers.length >= pc.disc;
            return `<label class="chip ${on ? "on" : ""} ${dis ? "dis" : ""}"${tip("power", p)}><input type="checkbox" data-act="psy-power" value="${p}" ${on ? "checked" : ""} ${dis ? "disabled" : ""}>${p}${info("power", p)}</label>`;
          }).join("")}</div>`;
      }
    }
    $("#step-psy").innerHTML = psy;

    // --- 6. Dépense des XP
    const budget = xp(), rest = remaining();
    const fc0 = creationCaracs(), fcx = finalCaracs();
    let xps = progressionHTML();
    xps += `<h4 class="lvl-buy">Achats du niveau ${level()}</h4>`;
    xps += `<div class="xp-bar ${rest < 0 ? "over" : ""}">Budget <strong>${budget}</strong> XP · dépensé <strong>${spent()}</strong> · reste <strong>${rest}</strong></div>`;
    if (!budget && !spent()) {
      xps += `<p class="hint">Vous n'avez pas d'XP bonus : ils s'obtiennent en laissant le hasard décider aux étapes 1 à 4. Après votre première mission, passez au niveau 2 ci-dessus.</p>`;
    }
    if (rest < 0) xps += `<p class="warn-txt">Vous avez dépensé plus que votre budget (une étape précédente a peut-être changé). Retirez des achats ou réinitialisez.</p>`;
    if (!fcx) xps += `<p class="hint">Déterminez d'abord les caractéristiques.</p>`;
    else {
      xps += `<h4>Caractéristiques <span class="hint">(+1 par achat ; 60 maximum)</span></h4><div class="adv-list">${CARACS.map((c) => {
        const n = E().car[c.id] || 0, v = fcx[c.id], cost = carCost(v + 1);
        const can = v < 60 && cost <= rest;
        return `<div class="adv"><span>${c.nom} <small>${v}${n ? ` (+${n})` : ""} · prochain : ${v < 60 ? cost + " XP" : "max"}</small></span>
          <span class="stepper"><button type="button" data-act="xc-" data-c="${c.id}" ${n ? "" : "disabled"}>−</button><span class="val">${n}</span>
          <button type="button" data-act="xc+" data-c="${c.id}" ${can ? "" : "disabled"}>+</button></span></div>`;
      }).join("")}</div>`;

      xps += `<h4>Compétences <span class="hint">(4 niveaux maximum au total)</span></h4><div class="adv-list">${Object.entries(SKILLS).map(([sk, sd]) => {
        const n = E().skill[sk] || 0, lvl = advAll(sk), cost = levelCost(lvl + 1);
        const locked = sk === "psy" && !isPsyker();
        const can = !locked && lvl < 4 && cost <= rest;
        return `<div class="adv"><span>${sd.nom} <small>niv. ${lvl}${n ? ` (+${n})` : ""} · ${lvl < 4 ? cost + " XP" : "max"}</small></span>
          <span class="stepper"><button type="button" data-act="xs-" data-sk="${sk}" ${n ? "" : "disabled"}>−</button><span class="val">${n}</span>
          <button type="button" data-act="xs+" data-sk="${sk}" ${can ? "" : "disabled"}>+</button></span></div>`;
      }).join("")}</div>`;

      const specKeys = [...new Set([...Object.keys(S.role.specs), ...Object.keys(X().spec)])];
      xps += `<h4>Spécialisations <span class="hint">(4 niveaux maximum chacune)</span></h4>`;
      if (specKeys.length) xps += `<div class="adv-list">${specKeys.map((k) => {
        const [sk, sp] = k.split(":"); const n = E().spec[k] || 0, lvl = specAll(k), cost = levelCost(lvl + 1);
        return `<div class="adv"><span>${SKILLS[sk].nom} (${esc(sp)}) <small>niv. ${lvl} · ${lvl < 4 ? cost + " XP" : "max"}</small></span>
          <span class="stepper"><button type="button" data-act="xp-" data-k="${esc(k)}" ${n ? "" : "disabled"}>−</button><span class="val">${n}</span>
          <button type="button" data-act="xp+" data-k="${esc(k)}" ${lvl < 4 && cost <= rest ? "" : "disabled"}>+</button></span></div>`;
      }).join("")}</div>`;
      xps += `<div class="row"><select class="select" id="xp-spec-select"><option value="">— Nouvelle spécialisation —</option>${Object.entries(SKILLS)
        .filter(([sk]) => sk !== "psy" || isPsyker())
        .map(([sk, sd]) => `<optgroup label="${sd.nom}">${sd.specs.filter((sp) => !specKeys.includes(`${sk}:${sp}`)).map((sp) => `<option value="${sk}:${esc(sp)}">${sd.nom} (${esc(sp)})</option>`).join("")}</optgroup>`).join("")}</select>
        <button class="btn ghost" type="button" data-act="xp-spec-add" ${rest >= 50 ? "" : "disabled"}>Ajouter (50 XP)</button></div>`;

      const owned = allTalents();
      const buyable = TALENTS.filter((t) => !t.creation && t.nom !== "Psyker" && !owned.includes(t.nom) && !(t.nom === "Psyker" && isBlank()));
      xps += `<h4>Talents <span class="hint">(100 XP chacun ; vérifiez les prérequis)</span></h4>`;
      if (E().talents.length) xps += `<div class="chips">${E().talents.map((t) => `<span class="chip on"${tip("talent", t)}>${esc(t)} <button type="button" class="x" data-act="xt-del" data-t="${esc(t)}" aria-label="Retirer">×</button></span>`).join("")}</div>`;
      xps += `<div class="row"><select class="select" id="xp-tal-select"><option value="">— Choisir un talent —</option>${buyable.map((t) =>
        `<option value="${esc(t.nom)}">${esc(t.nom)}${t.req && t.req !== "—" ? " — " + esc(t.req) : ""}</option>`).join("")}</select>
        <button class="btn ghost" type="button" data-act="xt-add" ${rest >= 100 ? "" : "disabled"}>Acheter (100 XP)</button></div>
        <div class="preview" data-preview-for="xp-tal-select" data-kind="talent"></div>
        <p class="hint">Le site ne vérifie pas les prérequis à votre place : relisez-les dans <a href="talents.html" target="_blank">l'Archive IV</a>. Psyker, Paria, Prédestiné, Héritier et Psyker sanctionné ne s'achètent pas ici.</p>`;

      if (isPsyker()) {
        const knownMinor = [...S.psy.minor, ...X().minor];
        const knownPow = [...S.psy.powers, ...X().powers];
        xps += `<h4>Pouvoirs psychiques <span class="hint">(mineur 60 XP, discipline 100 XP)</span></h4>`;
        const bought = [...E().minor.map((p) => [p, "m"]), ...E().powers.map((p) => [p, "d"])];
        if (bought.length) xps += `<div class="chips">${bought.map(([p, t]) => `<span class="chip on"${tip("power", p)}>${p} <button type="button" class="x" data-act="xpw-del" data-p="${p}" data-t="${t}" aria-label="Retirer">×</button></span>`).join("")}</div>`;
        xps += `<div class="row"><select class="select" id="xp-minor-select"><option value="">— Pouvoir mineur —</option>${PSY_MINOR.filter((p) => !knownMinor.includes(p)).map((p) => `<option>${p}</option>`).join("")}</select>
          <button class="btn ghost" type="button" data-act="xpm-add" ${rest >= 60 ? "" : "disabled"}>Apprendre (60 XP)</button></div>
          <div class="preview" data-preview-for="xp-minor-select" data-kind="power"></div>`;
        if (S.psy.discipline) xps += `<div class="row"><select class="select" id="xp-power-select"><option value="">— Pouvoir de ${S.psy.discipline} —</option>${PSY_DISCIPLINES[S.psy.discipline].filter((p) => !knownPow.includes(p)).map((p) => `<option>${p}</option>`).join("")}</select>
          <button class="btn ghost" type="button" data-act="xpd-add" ${rest >= 100 ? "" : "disabled"}>Apprendre (100 XP)</button></div>
          <div class="preview" data-preview-for="xp-power-select" data-kind="power"></div>`;
      }
      if (bucketCost(level())) xps += `<p><button class="btn ghost" type="button" data-act="xp-reset">Annuler les achats du niveau ${level()}</button></p>`;
    }
    $("#step-xp").innerHTML = xps;

    // indicateurs de progression
    const done = {
      car: !!base && (S.car.mode === "hasard" || sum(S.car.points) === 90),
      species: true,
      origin: xenosOrigin() || (!!o && !!S.origin.choix),
      faction: !!f && !!S.faction.choix && sum(S.faction.adv) === 5,
      role: !!r && S.role.talents.length === r.talents.n && sum(S.role.adv) === 3 && sum(S.role.specs) === 2,
      psy: pc.minor === 0 || (S.psy.minor.length === pc.minor && S.psy.powers.length === pc.disc),
      xp: xp() > 0 && remaining() >= 0 && remaining() < 20,
    };
    Object.entries(done).forEach(([k, v]) => { const el = document.querySelector(`[data-step="${k}"]`); if (el) el.classList.toggle("done", v); });
  }

  /* ---------- Rendu de la fiche ---------- */

  function equipList() {
    const out = [];
    const o = origin(), f = faction(), r = role();
    if (o && !xenosOrigin()) out.push(o.objet);
    (species().equip || []).forEach((x) => out.push(x));
    const collect = (items, picks) => items.forEach((it, i) => {
      if (typeof it === "string") out.push(it);
      else if (it.one) out.push(picks[i] || `[${it.one.join(" / ")}]`);
      else (picks[i] && picks[i].length ? picks[i] : [`[${it.pick} au choix]`]).forEach((x) => out.push(x));
    });
    if (f) collect(f.equip, S.faction.equip);
    if (r) collect(r.equip, S.role.equip);
    return out;
  }

  function renderSheet() { at(S.view && S.view < level() ? S.view : 0, renderSheetAt); }
  function renderSheetAt() {
    const fc = finalCaracs();
    const o = origin(), f = faction(), r = role();
    const talents = allTalents();
    const fate = 3 + (talents.includes("Prédestiné") ? 1 : 0);

    let h = `<div class="sheet-head">
      <div class="sheet-name">${esc(S.name) || "Agent sans nom"}</div>
      <div class="sheet-sub">${[species().id !== "humain" && species().nom, !xenosOrigin() && o && o.nom, f && f.nom, r && r.nom].filter(Boolean).join(" · ") || "Origine · Faction · Rôle"}</div>
      <div class="sheet-lvl">Niveau ${VIEW || level()}${VIEW ? ` <em>(consultation — actuel : ${level()})</em>` : ""}</div>
    </div>`;

    h += `<div class="sheet-caracs">${CARACS.map((c) => `<div><span>${c.ab}</span><strong>${fc ? fc[c.id] : "—"}</strong><small>${fc ? "B" + bonus(fc[c.id]) : ""}</small></div>`).join("")}</div>`;

    if (fc) {
      const B = (id) => bonus(fc[id]);
      const wounds = B("f") + 2 * B("e") + B("fm") + (species().bonusBlessures || 0);
      const sanctioned = talents.includes("Psyker sanctionné");
      h += `<div class="sheet-derived">
        <div><span>Blessures</span><strong>${wounds}</strong></div>
        <div><span>Critiques max</span><strong>${B("e") + (species().bonusCritiques || 0)}</strong></div>
        <div><span>Initiative</span><strong>${B("per") + B("ag")}</strong></div>
        <div><span>Encombrement</span><strong>${B("f") + B("e")}</strong></div>
        <div><span>Destin</span><strong>${fate}</strong></div>
        ${isPsyker() ? `<div><span>Seuil Warp</span><strong>${B("fm") * (sanctioned ? 2 : 1)}</strong></div>` : ""}
      </div>`;
    }

    // compétences
    h += `<h4>Compétences</h4><table class="sheet-skills"><tbody>${Object.entries(SKILLS).map(([sk, s]) => {
      const a = advAll(sk);
      const base = fc ? fc[s.c] : null;
      const val = base !== null ? base + 5 * a : "—";
      const specs = [...new Set([...Object.keys(S.role.specs), ...Object.keys(X().spec)])].filter((k) => specAll(k) && k.startsWith(sk + ":"));
      const specTxt = specs.map((k) => `<div class="spec">↳ ${esc(k.split(":")[1])} <strong>${base !== null ? val + 5 * specAll(k) : "—"}</strong></div>`).join("");
      return `<tr class="${a || specs.length ? "trained" : ""}"><td>${s.nom} <small>(${carNom(s.c)})</small>${specTxt}</td><td>${"●".repeat(a)}${"○".repeat(Math.max(0, 4 - a))}</td><td><strong>${val}</strong></td></tr>`;
    }).join("")}</tbody></table>`;

    if (species().traits.length) h += `<h4>Traits d'espèce</h4><p>${species().traits.map((t) => `<span class="tipped"${tip("trait", species().id + "|" + t.nom)}>${esc(t.nom)}</span>`).join(" · ")}</p>`;
    h += `<h4>Talents</h4><p>${talents.length ? talents.map((t) => `<span class="tipped"${tip("talent", t)}>${esc(t)}</span>`).join(" · ") : "<span class='hint'>—</span>"}</p>`;

    if (isPsyker()) {
      const pw = [...S.psy.minor, ...X().minor].map((p) => [p, "mineur"]).concat([...S.psy.powers, ...X().powers].map((p) => [p, S.psy.discipline]));
      h += `<h4>Pouvoirs psychiques</h4><p>${pw.length ? pw.map(([p, d]) => `<span class="tipped"${tip("power", p)}>${esc(p)}</span> <small>(${esc(d)})</small>`).join(" · ") : "<span class='hint'>à choisir</span>"}</p>`;
    }

    h += `<h4>Influence</h4><p>${f ? `+1 ${esc(f.influence)}` : "—"}${species().relations ? `<br><small>${esc(species().relations)}</small>` : ""}</p>`;
    h += `<h4>Équipement</h4><p>${equipList().map((x) => x.startsWith("[") ? esc(x) : `<span class="tipped"${tip("item", x)}>${esc(x)}</span>`).join(" · ") || "—"}${f ? ` · <strong>${esc(f.solars)} solars</strong>` : ""}</p>`;
    h += `<h4>Expérience</h4><p>Gagnés : <strong>${xp()}</strong> · dépensés : <strong>${spent()}</strong> · <strong style="color:${remaining() < 0 ? "var(--crimson-bright)" : "inherit"}">restants : ${remaining()} XP</strong></p>`;
    if (S.notes) h += `<h4>Notes</h4><p class="notes">${esc(S.notes).replace(/\n/g, "<br>")}</p>`;

    $("#sheet").innerHTML = h;
  }


  /* ---------- Dossier d'agent : terminal de cogitateur (imprimable sur listing) ---------- */

  function hashStr(t) { let h = 2166136261; for (const ch of t) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function imperialDate() {
    // datation impériale : n° de contrôle · fraction de l'année · année du millénaire · M42
    const d = new Date(), start = new Date(d.getFullYear(), 0, 1);
    const frac = Math.floor(((d - start) / 864e5 / 365.25) * 1000);
    return `0.${String(frac).padStart(3, "0")}.${String(d.getFullYear() % 1000).padStart(3, "0")}.M42`;
  }
  const firstSentence = (t) => (t || "").split(/(?<=\.)\s/)[0];
  const dots = (label, w = 22) => esc(label) + `<span class="tm-lead" aria-hidden="true">${" .".repeat(Math.max(1, Math.ceil((w - label.length) / 2)))}</span>`;

  // empreinte génétique : motif symétrique tiré du nom
  function genePrint(seed) {
    let x = seed || 1; const rnd = () => ((x = Math.imul(x ^ (x >>> 15), 2246822507) ^ (x + 0x9e3779b9)) >>> 0) / 4294967296;
    let r = "";
    for (let row = 0; row < 11; row++) for (let col = 0; col < 5; col++) {
      if (rnd() < 0.5) { r += `<rect x="${col}" y="${row}" width="1" height="1"/>`; if (col < 4) r += `<rect x="${8 - col}" y="${row}" width="1" height="1"/>`; }
    }
    return `<svg viewBox="-1 -1 11 13" class="tm-gene" aria-hidden="true">${r}</svg>`;
  }

  // piste cliquable (cocher les blessures, le destin dépensé, etc.), mémorisée avec l'agent
  function track(key, n, cls = "") {
    S.track = S.track || {};
    const used = Math.min(S.track[key] || 0, n);
    return `<span class="tm-track ${cls}">${Array.from({ length: Math.max(0, n) }, (_, i) =>
      `<button type="button" class="${i < used ? "on" : ""}" data-act="trk" data-t="${key}" data-i="${i}" aria-label="${key} ${i + 1}"></button>`).join("")}</span>`;
  }

  const THOUGHTS = [
    "Un esprit curieux est un esprit vulnérable.",
    "Le doute est la première fissure dans l'armure.",
    "Ce que l'on ignore ne peut pas vous trahir.",
    "Le silence est un serment que l'on renouvelle chaque jour.",
    "Aucun dossier n'est jamais vraiment clos.",
    "L'esprit-machine se souvient de ce que la chair oublie.",
  ];

  function renderDossier() { at(S.view && S.view < level() ? S.view : 0, renderDossierAt); }
  function renderDossierAt() {
    const fc = finalCaracs();
    const o = origin(), f = faction(), r = role(), sp = species();
    const talents = allTalents();
    const B = (id) => (fc ? bonus(fc[id]) : null);
    const name = S.name || "Agent sans nom";
    const h = hashStr(name + (f ? f.id : "") + (r ? r.id : ""));
    const ref = "IM-" + (h % 1e6).toString().padStart(6, "0");
    const arch = S.archetype && byId(ARCHETYPES, S.archetype);
    const wounds = fc ? B("f") + 2 * B("e") + B("fm") + (sp.bonusBlessures || 0) : 0;
    const crits = fc ? B("e") + (sp.bonusCritiques || 0) : 0;
    const fate = 3 + (talents.includes("Prédestiné") ? 1 : 0);
    const warp = fc && isPsyker() ? B("fm") * (talents.includes("Psyker sanctionné") ? 2 : 1) : null;
    const [classif, tone] = isBlank() ? ["SCEAU DU SILENCE", "red"] : isPsyker() ? ["PSYKANA // SOUS SURVEILLANCE", "amber"] : sp.id !== "humain" ? ["XENOS // ACCÈS RESTREINT", "red"] : ["VERMILLON", "ok"];
    const hex = (n, w = 4) => "0x" + (n >>> 0).toString(16).toUpperCase().padStart(w, "0").slice(-w);
    const thought = THOUGHTS[h % THOUGHTS.length];

    const ident = [
      ["ESPÈCE", sp.nom], ["ORIGINE", xenosOrigin() ? "—" : o && o.nom], ["FACTION", f && f.nom],
      ["RÔLE", r && r.nom], ["ARCHÉTYPE", arch && arch.nom], ["NIVEAU", `${VIEW || level()}${VIEW ? ` (archive — actuel ${level()})` : ""}`], ["PATRON", ""],
    ];

    const caracRows = CARACS.map((c) => {
      const val = fc ? fc[c.id] : 0, cells = 20, full = Math.round(Math.min(val, 100) / 100 * cells);
      return `<div class="tm-car${val >= 40 ? " hi" : ""}">
        <span class="tm-car-ab">${esc(c.ab.toUpperCase())}</span>
        <span class="tm-bar" aria-hidden="true">${Array.from({ length: cells }, (_, i) => `<i class="${i < full ? "on" : ""}"></i>`).join("")}</span>
        <strong>${fc ? String(val).padStart(2, "0") : "--"}</strong><em>B${fc ? bonus(val) : "-"}</em>
        <small>${esc(c.nom)}</small></div>`;
    }).join("");

    const skillRows = Object.entries(SKILLS).map(([sk, s]) => {
      const a = advAll(sk), base = fc ? fc[s.c] : null, val = base !== null ? base + 5 * a : "--";
      const specs = [...new Set([...Object.keys(S.role.specs), ...Object.keys(X().spec)])].filter((k) => specAll(k) && k.startsWith(sk + ":"));
      const lv = (n) => `<span class="tm-lv">[${"◆".repeat(n)}${"◇".repeat(Math.max(0, 4 - n))}]</span>`;
      return `<div class="tm-sk${a || specs.length ? " on" : ""}">
        <span class="tm-sk-n">${dots(s.nom.toUpperCase(), 17)}</span><span class="tm-sk-c">${esc(CARACS.find((c) => c.id === s.c).ab)}</span>${lv(a)}<strong>${val}</strong>
        ${specs.map((k) => `<span class="tm-spec"><span>└─ ${esc(k.split(":")[1])}</span>${lv(specAll(k))}<strong>${base !== null ? val + 5 * specAll(k) : "--"}</strong></span>`).join("")}
      </div>`;
    }).join("");

    const entry = (tag, title, txt, cls = "") => `<div class="tm-entry ${cls}"><div class="tm-entry-t"><span class="tm-tag">${tag}</span>${esc(title)}</div>${txt ? `<p>${esc(txt)}</p>` : ""}</div>`;
    const talentList = talents.map((t) => { const T = TALENTS.find((x) => x.nom === t); return entry("TAL", t, T && T.eff); }).join("") || `<p class="tm-dim">&gt; aucune entrée</p>`;
    const traitList = (sp.traits || []).map((t) => entry("GEN", t.nom, firstSentence(t.d), "xeno")).join("");
    const powers = isPsyker() ? [...S.psy.minor, ...X().minor].map((p) => [p, "mineur"]).concat([...S.psy.powers, ...X().powers].map((p) => [p, S.psy.discipline])) : [];
    const powerList = powers.map(([p, d]) => entry("PSY", `${p} — ${d || ""}`, firstSentence((POWER_INFO[p] || {}).d), "warp")).join("");

    const equip = equipList().map((x, i) => {
      const n = String(i + 1).padStart(2, "0");
      if (x.startsWith("[")) return `<li class="tm-dim"><span class="tm-idx">${n}</span><span>${esc(x)} <i>// en attente d'attribution</i></span></li>`;
      const it = ITEM_INFO[x];
      return `<li><span class="tm-idx">${n}</span><span>${esc(x)}${it && it.s && it.s !== "—" ? `<small>${esc(it.s)}</small>` : ""}</span></li>`;
    }).join("");

    const notes = S.notes ? esc(S.notes).replace(/\n/g, "<br>&gt; ") : "";
    const bin = Array.from({ length: 34 }, (_, i) => ((h >>> (i % 31)) & 0xff ^ (i * 37)).toString(2).padStart(8, "0")).join(" ");

    const doc = $("#dossier-doc");
    doc.className = "dossier-doc tm";
    doc.innerHTML = `
      <div class="tm-noise" aria-hidden="true">${bin}</div>
      <div class="tm-page">
      <div class="tm-topbar">
        <span><i class="tm-led"></i>COGITATOR MK.IX</span><span class="tm-hide-s">NŒUD 7-ALPHA</span><span>CANAL CRYPTÉ ${hex(h, 4)}</span>
      </div>
      <div class="tm-boot">
        <div>&gt; ++ RITE DE CONSULTATION INITIÉ ++</div>
        <div>&gt; Bénédiction de l'esprit-machine<span class="tm-lead"> . . . . . . </span><span class="tm-ok">[ACCORDÉE]</span></div>
        <div>&gt; Déchiffrement du dossier ${ref}<span class="tm-lead"> . . . . . . </span><span class="tm-ok">[OK]</span></div>
        <div>&gt; Vérification de l'accréditation<span class="tm-lead"> . . . . . . </span><span class="tm-${tone}">[${classif}]</span></div>
      </div>

      <header class="tm-head">
        <pre class="tm-ascii" aria-hidden="true">╔════════════════════════════════════════╗
║   D O S S I E R   D ' A G E N T        ║
╚════════════════════════════════════════╝</pre>
        <h2 class="tm-title">Dossier d'agent</h2>
        <div class="tm-meta"><span>RÉF ${ref}</span><span>DATE ${imperialDate()}</span><span>SECTEUR MACHARIEN</span></div>
      </header>

      <section class="tm-box tm-id">
        <div class="tm-box-t">┤ IDENTIFICATION ├</div>
        <div class="tm-id-grid">
          <figure class="tm-pict">${genePrint(h)}<figcaption>EMPREINTE<br>GÉNÉTIQUE</figcaption></figure>
          <div class="tm-id-main">
            <div class="tm-name">${esc(name.toUpperCase())}<span class="tm-cursor"></span></div>
            <dl>${ident.map(([k, v]) => `<div><dt>${k}</dt><dd>${v ? esc(v) : "<span class='tm-blank'></span>"}</dd></div>`).join("")}</dl>
          </div>
          <div class="tm-stamp tm-${tone}">${esc(classif)}</div>
        </div>
      </section>

      <section class="tm-box">
        <div class="tm-box-t">┤ PROFIL PHYSIOLOGIQUE &amp; MENTAL ├</div>
        <div class="tm-cars">${caracRows}</div>
      </section>

      <section class="tm-box">
        <div class="tm-box-t">┤ ÉTAT VITAL <span class="tm-dim tm-noprint">— touchez une case pour la cocher</span> ├</div>
        <div class="tm-vitals">
          <div class="tm-v wide"><span>BLESSURES</span><strong>${fc ? wounds : "--"}</strong>${fc ? track("w", wounds) : ""}</div>
          <div class="tm-v"><span>CRITIQUES</span><strong>${fc ? crits : "--"}</strong>${fc ? track("c", crits, "red") : ""}</div>
          <div class="tm-v"><span>DESTIN</span><strong>${fate}</strong>${track("d", fate, "round")}</div>
          <div class="tm-v"><span>CORRUPTION</span><strong>${isBlank() ? "Ø" : (S.track && S.track.k) || 0}</strong>${isBlank() ? `<em class="tm-dim">PARIA // IMMUNISÉ</em>` : track("k", 10, "amber")}</div>
          ${warp !== null ? `<div class="tm-v"><span>SEUIL WARP</span><strong>${warp}</strong>${track("p", warp, "violet")}</div>` : ""}
          <div class="tm-v"><span>INITIATIVE</span><strong>${fc ? B("per") + B("ag") : "--"}</strong></div>
          <div class="tm-v"><span>ENCOMBREMENT</span><strong>${fc ? B("f") + B("e") : "--"}</strong></div>
        </div>
      </section>

      <section class="tm-box">
        <div class="tm-box-t">┤ COMPÉTENCES <span class="tm-dim">— valeur = carac. + 5 × niveau</span> ├</div>
        <div class="tm-skills">${skillRows}</div>
      </section>

      </div>
      <div class="tm-page">
      <div class="tm-cols">
        <section class="tm-box">
          <div class="tm-box-t">┤ TALENTS ├</div>
          ${talentList}
          ${traitList ? `<div class="tm-sub">// TRAITS D'ESPÈCE</div>${traitList}` : ""}
          ${isPsyker() ? `<div class="tm-sub">// POUVOIRS PSYCHIQUES</div>${powerList || `<p class="tm-dim">&gt; à choisir</p>`}` : ""}
        </section>
        <div>
          <section class="tm-box">
            <div class="tm-box-t">┤ INVENTAIRE ├</div>
            <ul class="tm-equip">${equip || "<li class='tm-dim'>&gt; vide</li>"}</ul>
            <div class="tm-kv"><span>SOLARS</span><strong>${f ? esc(String(f.solars)) : "--"}</strong></div>
          </section>
          <section class="tm-box">
            <div class="tm-box-t">┤ INFLUENCE ├</div>
            <p>${f ? `+1 &gt;&gt; ${esc(f.influence)}` : "--"}</p>
            ${sp.relations ? `<p class="tm-dim">${esc(sp.relations)}</p>` : ""}
          </section>
          <section class="tm-box">
            <div class="tm-box-t">┤ EXPÉRIENCE ├</div>
            <div class="tm-xp"><div><span>GAGNÉE</span><strong>${xp()}</strong></div><div><span>DÉPENSÉE</span><strong>${spent()}</strong></div><div class="${remaining() < 0 ? "neg" : ""}"><span>RESTANTE</span><strong>${remaining()}</strong></div></div>
          </section>
        </div>
      </div>

      ${(VIEW || level()) > 1 ? `<section class="tm-box">
        <div class="tm-box-t">┤ JOURNAL DE PROGRESSION ├</div>
        <ol class="tm-log">${levelLog().filter((l) => l.n <= (VIEW || level())).map((l) => `<li><span class="tm-tag">NIV ${String(l.n).padStart(2, "0")}</span>
          <span>${l.n === 1 ? "Création" : `Mission · +${l.gain} XP`} <span class="tm-dim">— dépensé ${l.cost} XP</span><br><span class="tm-dim">&gt; ${l.items.length ? l.items.map(esc).join(" · ") : "aucun achat"}</span></span></li>`).join("")}</ol>
      </section>` : ""}

      <section class="tm-box">
        <div class="tm-box-t">┤ JOURNAL DE L'ENQUÊTEUR ├</div>
        <div class="tm-notes">${notes ? "&gt; " + notes : ""}<span class="tm-cursor"></span></div>
      </section>

      <footer class="tm-foot">
        <div>++ FIN DE TRANSMISSION ++ <span class="tm-dim">CHECKSUM ${hex(h * 2654435761, 8)}</span></div>
        <div class="tm-thought">PENSÉE DU JOUR : « ${esc(thought)} »</div>
        <div class="tm-dim">Toute consultation non autorisée sera signalée à l'Ordo compétent.</div>
      </footer>
      </div>`;
  }

  function openDossier() {
    try { $("#dossier").dataset.ph = localStorage.getItem("scriptorium-phosphor") || ""; $("#dossier").dataset.paper = localStorage.getItem("scriptorium-paper") || ""; } catch (e) { /* stockage indisponible */ }
    paperLabel();
    renderDossier();
    const doc = $("#dossier-doc");
    doc.classList.add("boot"); clearTimeout(openDossier.t); openDossier.t = setTimeout(() => doc.classList.remove("boot"), 2200);
    $("#dossier").hidden = false; $("#dossier").scrollTop = 0; document.body.classList.add("dossier-open");
  }
  function paperLabel() { const b = $("#paper-btn"); if (b) b.textContent = $("#dossier").dataset.paper === "listing" ? "PDF : listing papier" : "PDF : écran"; }
  function closeDossier() { $("#dossier").hidden = true; document.body.classList.remove("dossier-open"); }


  /* ---------- Archétype : tout remplir (choix, niveaux, spécialisations, talents, équipement, pouvoirs) ---------- */
  function applyKit(a) {
    const k = (typeof ARCH_KITS !== "undefined" && ARCH_KITS[a.id]) || {};
    const o = origin(), f = faction(), r = role();
    if (S.car.mode === "repartition") { const pts = [16, 16, 16, 12, 12, 5, 5, 4, 4]; recoCaracs().ordre.forEach((id, i) => { S.car.points[id] = pts[i]; }); }
    const reco = recoCaracs().ordre, rank = (c) => reco.indexOf(c);
    const best = (opts) => [...opts].sort((x, y) => rank(x) - rank(y))[0];
    if (o && !xenosOrigin() && !S.origin.choix) S.origin.choix = best(o.choix);
    if (f && !S.faction.choix) S.faction.choix = best(f.choix);

    // niveaux : on remplit une à une la compétence la mieux classée (2 maximum par compétence, création comprise)
    const prio = (list) => (sk) => { const i = list.indexOf(sk); return (i < 0 ? 0 : 20 - 4 * i) + (9 - rank(SKILLS[sk].c)); };
    function place(tgt, skills, n, score) {
      const sc = Object.fromEntries(skills.map((sk) => [sk, score(sk)]));
      for (let i = 0; i < n; i++) {
        const sk = skills.filter((x) => advTotal(x) < 2 && (tgt[x] || 0) < 2).sort((x, y) => sc[y] - sc[x])[0];
        if (!sk) break; tgt[sk] = (tgt[sk] || 0) + 1; sc[sk] -= 6;
      }
    }
    const sk = k.sk || [];
    if (f && !a.duty) place(S.faction.adv, f.skills, 5, prio(k.fsk || [...sk, ...(r ? r.skills : [])]));
    if (r) place(S.role.adv, r.skills, 3, prio(sk));

    // spécialisations (2, une par spécialisation)
    if (r) {
      const opts = roleSpecOptions();
      const wanted = (k.sp || []).filter((x) => opts.includes(x));
      const rest = opts.filter((x) => !wanted.includes(x)).sort((x, y) => prio(sk)(y.split(":")[0]) - prio(sk)(x.split(":")[0]));
      [...wanted, ...rest].slice(0, 2).forEach((x) => { S.role.specs[x] = 1; });
    }

    // talents de rôle, sans doublon avec ceux de la faction
    if (r) {
      const owned = factionTalents(), ok = (t) => !owned.includes(t) && !S.role.talents.includes(t);
      [...(k.rt || []), ...r.talents.list].forEach((t) => { if (S.role.talents.length < r.talents.n && r.talents.list.includes(t) && ok(t)) S.role.talents.push(t); });
    }

    // équipement : choix du kit, sinon les premières options
    const fill = (items, picks, want = {}) => items.forEach((it, i) => {
      if (typeof it === "string") return;
      if (it.one) picks[i] = it.one.includes(want[i]) ? want[i] : it.one[0];
      else { const w = [].concat(want[i] || []).filter((x) => it.options.includes(x)); picks[i] = [...w, ...it.options.filter((x) => !w.includes(x))].slice(0, it.pick); }
    });
    if (f) fill(f.equip, S.faction.equip, k.f);
    if (r) fill(r.equip, S.role.equip, k.r);

    // pouvoirs psychiques
    if (isPsyker()) {
      const pc = powerCounts(), d = k.d && PSY_DISCIPLINES[k.d] ? k.d : "Divination";
      S.psy.discipline = d;
      S.psy.minor = [...(k.mi || []), "Smite", "Psychic Scrutiny", "Soulsight", "Luck"].filter((x, i, l) => PSY_MINOR.includes(x) && l.indexOf(x) === i).slice(0, pc.minor);
      S.psy.powers = [...(k.pw || []), ...PSY_DISCIPLINES[d]].filter((x, i, l) => PSY_DISCIPLINES[d].includes(x) && l.indexOf(x) === i).slice(0, pc.disc);
    }
  }


  /* ---------- Progression par niveau ---------- */
  const bucketCost = (n) => at(n, spent) - (n > 1 ? at(n - 1, spent) : 0);
  function bucketSummary(b) {
    const parts = [];
    Object.entries(b.car).forEach(([c, n]) => n && parts.push(`${carNom(c)} +${n}`));
    Object.entries(b.skill).forEach(([sk, n]) => n && parts.push(`${SKILLS[sk].nom} +${n}`));
    Object.entries(b.spec).forEach(([k, n]) => n && parts.push(`${SKILLS[k.split(":")[0]].nom} (${k.split(":")[1]}) +${n}`));
    b.talents.forEach((t) => parts.push(`Talent : ${t}`));
    b.minor.forEach((p) => parts.push(`Pouvoir : ${p}`));
    b.powers.forEach((p) => parts.push(`Pouvoir : ${p}`));
    return parts;
  }
  function levelLog() {
    return allBuckets().map((b, i) => {
      const n = i + 1;
      return { n, gain: n === 1 ? at(1, xp) : +b.xp || 0, cost: bucketCost(n), items: bucketSummary(b), left: at(n, remaining) };
    });
  }
  function progressionHTML() {
    const L = level(), log = levelLog();
    const lastXp = S.levels.length ? S.levels[S.levels.length - 1].xp : 100;
    return `<div class="lvl-box">
      <div class="lvl-head">
        <div class="lvl-badge"><small>Niveau</small><strong>${L}</strong><small>/ ${S.maxLevel}</small></div>
        <p class="hint">Un niveau = une mission. À chaque niveau, l'agent reçoit l'XP de la mission et la dépense ci-dessous ; l'XP non dépensée est gardée pour plus tard.</p>
      </div>
      <ol class="lvl-log">${log.map((l) => `<li class="${l.n === L ? "cur" : ""}">
        <span class="lvl-n">Niv. ${l.n}</span>
        <span class="lvl-gain">${l.n === 1 ? `Création <small>(+${l.gain} XP bonus)</small>` : `Mission <input class="lvl-in" type="number" min="0" step="5" value="${l.gain}" data-act="lvl-xp" data-l="${l.n}" aria-label="XP du niveau ${l.n}"> XP`}</span>
        <span class="lvl-items">${l.items.length ? l.items.map(esc).join(" · ") : `<em class="hint">aucun achat</em>`}</span>
        <span class="lvl-cost">−${l.cost} XP <small>reste ${l.left}</small></span>
      </li>`).join("")}</ol>
      <div class="lvl-actions">
        <label>XP de la prochaine mission <input class="lvl-in" type="number" id="lvl-new-xp" min="0" step="5" value="${lastXp}"></label>
        <button class="btn" type="button" data-act="lvl-up" ${L >= S.maxLevel ? "disabled" : ""}>Passer au niveau ${L + 1}</button>
        <button class="btn ghost" type="button" data-act="lvl-undo" ${L > 1 ? "" : "disabled"}>Annuler le niveau ${L}</button>
      </div>
      <div class="lvl-actions">
        <label>Voir l'agent au niveau <select class="select lvl-sel" data-act="lvl-view">${log.map((l) => `<option value="${l.n === L ? 0 : l.n}" ${(S.view || L) === l.n ? "selected" : ""}>${l.n}${l.n === L ? " (actuel)" : ""}</option>`).join("")}</select></label>
        <label>Niveau max <input class="lvl-in" type="number" min="${L}" max="99" value="${S.maxLevel}" data-act="lvl-max"></label>
      </div>
    </div>`;
  }

  function renderAll() {
    // un talent obtenu par la faction ou le rôle n'a plus à être acheté en XP
    eachBucket((b) => { b.talents = b.talents.filter((t) => !factionTalents().includes(t) && !S.role.talents.includes(t)); });
    if (S.view >= level()) S.view = 0;
    renderSteps(); renderSheet(); save();
    if (!$("#dossier").hidden) renderDossier();
  }

  /* ---------- Événements ---------- */

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || b.tagName === "INPUT" || b.tagName === "SELECT") return;
    const act = b.dataset.act;
    if (act === "roll-car") rollCaracs();
    else if (act === "swap" && S.car.values) {
      const c = b.dataset.c;
      if (!S.car.swapSel) S.car.swapSel = c;
      else if (S.car.swapSel === c) S.car.swapSel = null;
      else {
        const a = S.car.swapSel; [S.car.values[a], S.car.values[c]] = [S.car.values[c], S.car.values[a]];
        S.car.swapSel = null; S.car.swapped = true;
      }
    }
    else if (act === "pt+") S.car.points[b.dataset.c]++;
    else if (act === "reco-points") {
      // 3 priorités à 16, 2 utiles à 12, le reste à 5/5/4/4 : total 90, dans les bornes 4–18
      const { ordre } = recoCaracs(), pts = [16, 16, 16, 12, 12, 5, 5, 4, 4];
      ordre.forEach((id, i) => { S.car.points[id] = pts[i]; });
    }
    else if (act === "reco-even") { CARACS.forEach((c) => { S.car.points[c.id] = 10; }); }
    else if (act === "reco-sort" && S.car.values) {
      const tri = Object.values(S.car.values).sort((a, b) => b - a);
      recoCaracs().ordre.forEach((id, i) => { S.car.values[id] = tri[i]; });
      S.car.swapped = true; S.car.swapSel = null;
    }
    else if (act === "pt-") S.car.points[b.dataset.c]--;
    else if (act === "roll-origin") rollOrigin();
    else if (act === "roll-faction") rollFaction();
    else if (act === "roll-role") rollRole();
    else if (act === "adv+" || act === "adv-") {
      const tgt = b.dataset.scope === "faction" ? S.faction.adv : S.role.adv;
      const sk = b.dataset.sk;
      tgt[sk] = Math.max(0, (tgt[sk] || 0) + (act === "adv+" ? 1 : -1));
    }
    else if (act === "arch-apply") {
      const a = byId(ARCHETYPES, $("#arch-select").value); if (!a) return;
      S.archetype = a.id; S.species = "humain";
      S.origin = { id: a.origin, rolled: false, choix: "" };
      S.faction = { id: a.faction, rolled: false, choix: a.duty?.choix || "", adv: { ...(a.duty?.adv || {}) }, talentPick: a.duty?.talentPick || 0, equip: {} };
      S.role = { id: a.role, rolled: false, talents: [], adv: {}, specs: {}, equip: {} };
      S.psy = { discipline: "", minor: [], powers: [] };
      resetRoleIfBlocked();
      applyKit(a);
    }
    else if (act === "xc+" || act === "xc-") { const c = b.dataset.c; E().car[c] = Math.max(0, (E().car[c] || 0) + (act === "xc+" ? 1 : -1)); }
    else if (act === "xs+" || act === "xs-") { const k = b.dataset.sk; E().skill[k] = Math.max(0, (E().skill[k] || 0) + (act === "xs+" ? 1 : -1)); if (!E().skill[k]) delete E().skill[k]; }
    else if (act === "xp+" || act === "xp-") { const k = b.dataset.k; E().spec[k] = Math.max(0, (E().spec[k] || 0) + (act === "xp+" ? 1 : -1)); if (!E().spec[k]) delete E().spec[k]; }
    else if (act === "xp-spec-add") { const k = $("#xp-spec-select").value; if (!k) return; E().spec[k] = (E().spec[k] || 0) + 1; }
    else if (act === "xt-add") { const t = $("#xp-tal-select").value; if (!t) return; E().talents.push(t); }
    else if (act === "xt-del") { E().talents = E().talents.filter((t) => t !== b.dataset.t); }
    else if (act === "xpm-add") { const v = $("#xp-minor-select").value; if (!v) return; E().minor.push(v); }
    else if (act === "xpd-add") { const v = $("#xp-power-select").value; if (!v) return; E().powers.push(v); }
    else if (act === "xpw-del") { const key = b.dataset.t === "m" ? "minor" : "powers"; E()[key] = E()[key].filter((x) => x !== b.dataset.p); }
    else if (act === "xp-reset") { const e = E(); Object.assign(e, blankXp(), { xp: e.xp }); }
    else if (act === "lvl-up") {
      if (level() >= S.maxLevel) return;
      const v = Math.max(0, parseInt($("#lvl-new-xp").value, 10) || 0);
      S.levels.push(Object.assign(blankXp(), { xp: v })); S.view = 0;
    }
    else if (act === "lvl-undo") { if (!S.levels.length || !confirm(`Annuler le niveau ${level()} et tous ses achats ?`)) return; S.levels.pop(); S.view = 0; }
    else if (act === "reset") { if (confirm("Effacer cet agent et recommencer ?")) S = blank(); }
    else if (act === "print") { openDossier(); setTimeout(() => window.print(), 60); return; }
    else if (act === "dossier-open") { openDossier(); return; }
    else if (act === "trk") { S.track = S.track || {}; const k = b.dataset.t, i = +b.dataset.i + 1; S.track[k] = S.track[k] === i ? i - 1 : i; }
    else if (act === "paper") { const d = $("#dossier"); d.dataset.paper = d.dataset.paper === "listing" ? "" : "listing"; paperLabel(); try { localStorage.setItem("scriptorium-paper", d.dataset.paper); } catch (e) {} return; }
    else if (act === "phosphor") { const d = $("#dossier"); d.dataset.ph = d.dataset.ph === "amber" ? "" : "amber"; try { localStorage.setItem("scriptorium-phosphor", d.dataset.ph); } catch (e) {} return; }
    else if (act === "dossier-close") { closeDossier(); return; }
    else if (act === "export") { exportJSON(); return; }
    else if (act === "import") { $("#import-file").click(); return; }
    else return;
    renderAll();
  });

  document.addEventListener("change", (e) => {
    const el = e.target;
    const act = el.dataset.act;
    if (!act) return;
    if (act === "carmode") { S.car.mode = el.value; }
    else if (act === "species") {
      S.species = el.value;
      if (xenosOrigin()) S.origin = { id: "", rolled: false, choix: "" };
      resetRoleIfBlocked();
    }
    else if (act === "origin") { S.origin = { id: el.value, rolled: false, choix: "" }; resetFaction(); }
    else if (act === "ochoix") S.origin.choix = el.value;
    else if (act === "faction") { S.faction = { id: el.value, rolled: false, choix: "", adv: {}, talentPick: 0, equip: {} }; resetRoleIfBlocked(); }
    else if (act === "fchoix") S.faction.choix = el.value;
    else if (act === "tpick") { S.faction.talentPick = +el.value; if (!psykerFromFaction()) delete S.faction.adv.psy; resetRoleIfBlocked(); }
    else if (act === "role") { S.role = { id: el.value, rolled: false, talents: [], adv: {}, specs: {}, equip: {} }; resetRoleIfBlocked(); }
    else if (act === "rtalent") { S.role.talents = el.checked ? [...S.role.talents, el.value] : S.role.talents.filter((t) => t !== el.value); }
    else if (act === "rspec") { if (el.checked) S.role.specs[el.value] = 1; else delete S.role.specs[el.value]; }
    else if (act === "equip-one") { (el.dataset.scope === "faction" ? S.faction.equip : S.role.equip)[el.dataset.i] = el.value; }
    else if (act === "equip-pick") {
      const store = el.dataset.scope === "faction" ? S.faction.equip : S.role.equip;
      const cur = store[el.dataset.i] || [];
      store[el.dataset.i] = el.checked ? [...cur, el.value] : cur.filter((x) => x !== el.value);
    }
    else if (act === "psy-disc") { S.psy.discipline = el.value; S.psy.powers = []; eachBucket((b) => { b.powers = []; }); }
    else if (act === "lvl-max") { S.maxLevel = Math.max(level(), Math.min(99, parseInt(el.value, 10) || 20)); }
    else if (act === "lvl-xp") { const l = S.levels[+el.dataset.l - 2]; if (l) l.xp = Math.max(0, parseInt(el.value, 10) || 0); }
    else if (act === "lvl-view") { S.view = +el.value; }
    else if (act === "psy-minor") { S.psy.minor = el.checked ? [...S.psy.minor, el.value] : S.psy.minor.filter((x) => x !== el.value); }
    else if (act === "psy-power") { S.psy.powers = el.checked ? [...S.psy.powers, el.value] : S.psy.powers.filter((x) => x !== el.value); }
    else return;
    renderAll();
  });

  // Champs texte : on ne redessine que la fiche pour garder le focus
  document.addEventListener("input", (e) => {
    if (e.target.id === "agent-name") { S.name = e.target.value; renderSheet(); save(); }
    if (e.target.id === "agent-notes") { S.notes = e.target.value; renderSheet(); save(); }
  });

  function exportJSON() {
    const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (S.name || "agent").replace(/[^\w\-À-ÿ ]/g, "").trim().replace(/\s+/g, "_") + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  $("#import-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    file.text().then((txt) => {
      try { S = normalize(JSON.parse(txt)); syncTextFields(); renderAll(); }
      catch (err) { alert("Fichier illisible : ce n'est pas un agent exporté depuis le Scriptorium."); }
    });
    e.target.value = "";
  });

  function syncTextFields() { $("#agent-name").value = S.name || ""; $("#agent-notes").value = S.notes || ""; }


  /* ---------- Fiches descriptives (pop-ups) ---------- */

  const field = (label, val) => (val ? `<div class="tt-row"><span>${label}</span><strong>${val}</strong></div>` : "");
  const plusCar = (fixe, choix) => `+5 ${carNom(fixe)} ; +5 ${choix.map(carNom).join(", ")} au choix`;
  const skillNames = (list) => list.map((sk) => SKILLS[sk].nom).join(", ");
  const equipText = (items) => items.map((it) => typeof it === "string" ? it : it.one ? it.one.join(" ou ") : `${it.pick} parmi : ${it.options.join(", ")}`).join(" · ");
  function disciplineOf(p) {
    if (PSY_MINOR.includes(p)) return "Pouvoir mineur";
    const d = Object.keys(PSY_DISCIPLINES).find((k) => PSY_DISCIPLINES[k].includes(p));
    return d || "";
  }

  function tipContent(kind, key) {
    if (kind === "archetype") {
      const a = byId(ARCHETYPES, key); if (!a) return "";
      return `<div class="tt-kicker">Archétype du livre</div><div class="tt-title">${esc(a.nom)}</div>
        ${field("Origine", esc(byId(ORIGINS, a.origin).nom))}${field("Faction", esc(byId(FACTIONS, a.faction).nom))}${field("Rôle", esc(byId(ROLES, a.role).nom))}
        ${a.duty ? field("Devoir de faction", esc(a.duty.nom) + " (pré-rempli)") : ""}${a.note ? `<p>${esc(a.note)}</p>` : ""}`;
    }
    if (kind === "species") {
      const sp = byId(SPECIES, key); if (!sp) return "";
      const mods = Object.entries(sp.mods).map(([c, v]) => `${v > 0 ? "+" : "−"}${Math.abs(v)} ${carNom(c)}`).join(", ");
      return `<div class="tt-kicker">Espèce${sp.id !== "humain" ? " · règle maison" : ""}</div><div class="tt-title">${esc(sp.nom)}</div><p>${esc(sp.desc)}</p>
        ${field("Caractéristiques", mods || "aucun modificateur")}${sp.traits.length ? field("Traits", esc(sp.traits.map((t) => t.nom).join(", "))) : ""}
        ${field("Factions", sp.factions ? esc(sp.factions.map((id) => byId(FACTIONS, id).nom).join(", ")) : "toutes")}
        ${sp.relations ? field("Relations", esc(sp.relations)) : ""}`;
    }
    if (kind === "trait") {
      const [sid, ...rest] = key.split("|"); const nom = rest.join("|");
      const sp = byId(SPECIES, sid), t = sp && sp.traits.find((x) => x.nom === nom);
      if (!t) return "";
      return `<div class="tt-kicker">Trait d'espèce · ${esc(sp.nom)}</div><div class="tt-title">${esc(t.nom)}</div><p>${esc(t.d)}</p>`;
    }
    if (kind === "origin") {
      const o = byId(ORIGINS, key); if (!o) return "";
      return `<div class="tt-kicker">Origine</div><div class="tt-title">${esc(o.nom)}</div>
        <p>${esc(ORIGIN_DESC[o.id] || "")}</p>${field("Bonus", plusCar(o.fixe, o.choix))}${field("Objet", esc(o.objet))}`;
    }
    if (kind === "faction") {
      const f = byId(FACTIONS, key); if (!f) return "";
      const tal = f.talentChoices ? f.talentChoices.map((t) => t.join(" + ")).join(" ou ") : (f.talents.join(", ") || "aucun (deux augmétiques)");
      return `<div class="tt-kicker">Faction</div><div class="tt-title">${esc(f.nom)}</div>
        <p>${esc(FACTION_DESC[f.id] || "")}</p>${field("Bonus", plusCar(f.fixe, f.choix))}
        ${field("Compétences (5 niveaux)", skillNames(f.skills))}${field("Talent", esc(tal))}${field("Influence", "+1 " + esc(f.influence))}
        ${field("Équipement", esc(equipText(f.equip)) + " · " + esc(f.solars) + " solars")}`;
    }
    if (kind === "role") {
      const r = byId(ROLES, key); if (!r) return "";
      const specs = r.specList ? r.specList.map((k) => { const [sk, sp] = k.split(":"); return `${SKILLS[sk].nom} (${sp})`; }).join(", ")
                               : "toutes celles de " + skillNames(r.specSkills);
      return `<div class="tt-kicker">Rôle</div><div class="tt-title">${esc(r.nom)}</div>
        <p>${esc(r.desc)}${r.psyker ? " Donne le talent Psyker." : ""}</p>
        ${field(`Talents (${r.talents.n} au choix)`, esc(r.talents.list.join(", ")))}
        ${field("Compétences (3 niveaux)", skillNames(r.skills))}${field("Spécialisations (2 niveaux)", esc(specs))}
        ${field("Équipement", esc(equipText(r.equip)))}`;
    }
    if (kind === "talent") {
      const t = TALENTS.find((x) => x.nom === key);
      if (!t) return `<div class="tt-kicker">Talent</div><div class="tt-title">${esc(key)}</div><p class="hint">Pas de fiche détaillée.</p>`;
      return `<div class="tt-kicker">Talent${t.creation ? " · création seulement" : ""}</div><div class="tt-title">${esc(t.nom)}</div>
        <div class="tt-en">${esc(t.en)}</div><p>${t.eff}</p>${field("Prérequis", t.req && t.req !== "—" ? esc(t.req) : "aucun")}
        ${field("Coût", t.creation ? "uniquement à la création" : "100 XP")}`;
    }
    if (kind === "power") {
      const pw = POWER_INFO[key] || {};
      return `<div class="tt-kicker">${esc(disciplineOf(key))}${pw.m ? " · manifeste" : ""}</div><div class="tt-title">${esc(key)}</div>
        ${pw.d ? `<p>${esc(pw.d)}</p>` : `<p class="hint">Pas de fiche détaillée.</p>`}
        <div class="tt-grid">${field("Valeur Warp", pw.vw)}${field("Difficulté", pw.diff)}${field("Portée", pw.po)}${field("Durée", pw.du)}</div>
        ${field("Coût", PSY_MINOR.includes(key) ? "60 XP" : "100 XP")}`;
    }
    if (kind === "item") {
      const it = ITEM_INFO[key];
      if (!it) return `<div class="tt-kicker">Équipement</div><div class="tt-title">${esc(key)}</div><p class="hint">Pas de fiche détaillée.</p>`;
      return `<div class="tt-kicker">${esc(it.t)}</div><div class="tt-title">${esc(key)}</div><p>${esc(it.d)}</p>${field("En jeu", esc(it.s))}`;
    }
    return "";
  }

  const tt = document.createElement("div");
  tt.id = "tooltip"; tt.setAttribute("role", "tooltip"); tt.hidden = true;
  document.body.append(tt);
  let pinned = null;

  function showTip(el, x, y) {
    const [kind, ...rest] = el.dataset.tip.split("|");
    const html = tipContent(kind, rest.join("|"));
    if (!html) return hideTip();
    tt.innerHTML = html; tt.hidden = false;
    const r = el.getBoundingClientRect();
    const w = tt.offsetWidth, h = tt.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
    let left = x !== undefined ? x + 14 : r.left;
    let top = y !== undefined ? y + 16 : r.bottom + 8;
    if (left + w > vw - 8) left = Math.max(8, (x !== undefined ? x - w - 14 : r.right - w));
    if (top + h > vh - 8) top = Math.max(8, (y !== undefined ? y - h - 12 : r.top - h - 8));
    tt.style.left = left + "px"; tt.style.top = top + "px";
  }
  function hideTip() { tt.hidden = true; pinned = null; tt.classList.remove("pinned"); }

  // Survol à la souris
  let mx = -1, my = -1;
  function tipAt(x, y) {
    if (pinned) return;
    const under = document.elementFromPoint(x, y);
    const el = under && under.closest("[data-tip]");
    if (el) showTip(el, x, y); else if (!tt.hidden) tt.hidden = true;
  }
  document.addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; tipAt(mx, my); });
  // Clic / toucher sur le « i » : épingle la fiche (sans cocher la case)
  document.addEventListener("click", (e) => {
    const i = e.target.closest(".info");
    if (i) {
      e.preventDefault(); e.stopPropagation();
      if (pinned === i) return hideTip();
      showTip(i); pinned = i; tt.classList.add("pinned"); return;
    }
    if (pinned && !e.target.closest("#tooltip")) hideTip();
  }, true);
  // Clavier : la fiche suit le focus
  document.addEventListener("focusin", (e) => { const el = e.target.closest("[data-tip]"); if (el) showTip(el); });
  document.addEventListener("focusout", () => { if (!pinned) tt.hidden = true; });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { hideTip(); if (!$("#dossier").hidden) closeDossier(); }
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("info")) { e.preventDefault(); e.target.click(); }
  });
  // au défilement, la fiche suit ce qui se trouve sous le curseur
  window.addEventListener("scroll", () => { if (mx >= 0) tipAt(mx, my); }, { passive: true });

  // Aperçu sous les listes déroulantes de l'étape XP
  document.addEventListener("change", (e) => {
    const box = document.querySelector(`.preview[data-preview-for="${e.target.id}"]`);
    if (!box) return;
    box.innerHTML = e.target.value ? tipContent(box.dataset.kind, e.target.value) : "";
  });

  syncTextFields();
  renderAll();
})();
