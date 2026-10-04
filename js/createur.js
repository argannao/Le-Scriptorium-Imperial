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
    name: "", notes: "",
    car: { mode: "hasard", values: null, rolls: 0, swapped: false, swapSel: null, points: Object.fromEntries(CARACS.map((c) => [c.id, 10])) },
    origin: { id: "", rolled: false, choix: "" },
    faction: { id: "", rolled: false, choix: "", adv: {}, talentPick: 0, equip: {} },
    role: { id: "", rolled: false, talents: [], adv: {}, specs: {}, equip: {} },
    psy: { discipline: "", minor: [], powers: [] },
    xp: blankXp(),
  });
  function blankXp() { return { car: {}, skill: {}, spec: {}, talents: [], minor: [], powers: [] }; }

  let S = load() || blank();

  function load() {
    try { const raw = localStorage.getItem(STORE_KEY); return raw ? normalize(JSON.parse(raw)) : null; } catch (e) { return null; }
  }
  function normalize(obj) {
    const st = Object.assign(blank(), obj);
    st.xp = Object.assign(blankXp(), obj.xp || {});
    return st;
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* stockage indisponible : on continue sans */ }
  }

  /* ---------- Calculs ---------- */

  const faction = () => byId(FACTIONS, S.faction.id);
  const role = () => byId(ROLES, S.role.id);
  const origin = () => byId(ORIGINS, S.origin.id);

  function baseCaracs() {
    if (S.car.mode === "repartition") return Object.fromEntries(CARACS.map((c) => [c.id, 20 + (S.car.points[c.id] || 0)]));
    return S.car.values ? { ...S.car.values } : null;
  }

  function finalCaracs() {
    const b = creationCaracs();
    if (!b) return null;
    CARACS.forEach((c) => { b[c.id] += S.xp.car[c.id] || 0; });
    return b;
  }

  function creationCaracs() {
    const b = baseCaracs();
    if (!b) return null;
    const o = origin(), f = faction();
    if (o) { b[o.fixe] += 5; if (S.origin.choix) b[S.origin.choix] += 5; }
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
  const isPsyker = () => psykerFromFaction() || (role() && role().psyker);

  function allTalents() {
    const list = [...factionTalents()];
    const r = role();
    if (r && r.psyker && !list.includes("Psyker")) list.push("Psyker");
    S.role.talents.forEach((t) => { if (!list.includes(t)) list.push(t); });
    S.xp.talents.forEach((t) => { if (!list.includes(t)) list.push(t); });
    return list;
  }

  function powerCounts() {
    if (!isPsyker()) return { minor: 0, disc: 0 };
    const both = psykerFromFaction() && role() && role().psyker;
    return { minor: both ? 2 : 1, disc: both ? 2 : 1 };
  }

  const advTotal = (sk) => (S.faction.adv[sk] || 0) + (S.role.adv[sk] || 0);   // niveaux obtenus à la création
  const advAll = (sk) => advTotal(sk) + (S.xp.skill[sk] || 0);                   // + niveaux achetés en XP
  const specAll = (key) => (S.role.specs[key] || 0) + (S.xp.spec[key] || 0);

  /* Coûts en XP (livre de base, p. 90) */
  const CAR_COSTS = [[25, 20], [30, 25], [35, 30], [40, 40], [45, 60], [50, 80], [55, 110], [60, 140], [65, 180], [70, 220], [75, 270], [80, 320]];
  const carCost = (newValue) => (CAR_COSTS.find(([max]) => newValue <= max) || [0, 9999])[1];
  const levelCost = (level) => 50 * level;   // niveau 1 = 50, 2 = 100, 3 = 150, 4 = 200

  function spent() {
    let x = 0;
    const cc = creationCaracs();
    if (cc) CARACS.forEach((c) => { for (let i = 1; i <= (S.xp.car[c.id] || 0); i++) x += carCost(cc[c.id] + i); });
    Object.entries(S.xp.skill).forEach(([sk, n]) => { for (let i = 1; i <= n; i++) x += levelCost(advTotal(sk) + i); });
    Object.entries(S.xp.spec).forEach(([k, n]) => { for (let i = 1; i <= n; i++) x += levelCost((S.role.specs[k] || 0) + i); });
    x += 100 * S.xp.talents.length + 60 * S.xp.minor.length + 100 * S.xp.powers.length;
    return x;
  }
  const remaining = () => xp() - spent();
  const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);

  function xp() {
    let x = 0;
    if (S.car.mode === "hasard" && S.car.rolls === 1) x += S.car.swapped ? 25 : 50;
    if (S.origin.rolled) x += 25;
    if (S.faction.rolled) x += 75;
    if (S.role.rolled) x += 50;
    return x;
  }

  function roleSpecOptions() {
    const r = role();
    if (!r) return [];
    if (r.specList) return r.specList;
    return r.specSkills.flatMap((sk) => SKILLS[sk].specs.map((sp) => `${sk}:${sp}`));
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
    const f = FACTIONS.find((x) => r <= x.roll[S.origin.id]);
    S.faction = { id: f.id, rolled: true, choix: "", adv: {}, talentPick: 0, equip: {} };
    resetRoleIfBlocked();
    return r;
  }
  function rollRole() {
    const options = ROLES.filter((r) => !(r.psyker && isBlank()));
    const r = options[Math.floor(Math.random() * options.length)];
    S.role = { id: r.id, rolled: true, talents: [], adv: {}, specs: {}, equip: {} };
    S.psy = { discipline: "", minor: [], powers: [] };
  }
  function resetFaction() { S.faction = { id: "", rolled: false, choix: "", adv: {}, talentPick: 0, equip: {} }; resetRoleIfBlocked(); }
  function resetRoleIfBlocked() {
    // les niveaux de compétence ne doivent pas dépasser 2 au total
    Object.keys(S.role.adv).forEach((sk) => { while (advTotal(sk) > 2 && S.role.adv[sk] > 0) S.role.adv[sk]--; });
    if (role() && role().psyker && isBlank()) S.role = { id: "", rolled: false, talents: [], adv: {}, specs: {}, equip: {} };
    if (!isPsyker()) { S.psy = { discipline: "", minor: [], powers: [] }; S.xp.minor = []; S.xp.powers = []; delete S.xp.skill.psy;
      Object.keys(S.xp.spec).forEach((k) => { if (k.startsWith("psy:")) delete S.xp.spec[k]; }); }
    S.xp.talents = S.xp.talents.filter((t) => !factionTalents().includes(t) && !S.role.talents.includes(t));
    Object.keys(S.xp.skill).forEach((sk) => { while (advAll(sk) > 4 && S.xp.skill[sk] > 0) S.xp.skill[sk]--; });
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
    if (S.car.mode === "hasard") {
      car += `<p><button class="btn" type="button" data-act="roll-car">${S.car.values ? "Relancer" : "Lancer les dés"}</button>
        <span class="hint">${S.car.rolls === 0 ? "Garder le premier jet : +50 XP. Réarranger : +25 XP. Relancer : pas d'XP."
          : S.car.rolls > 1 ? "Relancé : pas d'XP bonus." : S.car.swapped ? "Réarrangé : +25 XP." : "Premier jet gardé tel quel : +50 XP."}</span></p>`;
      if (base) {
        car += `<p class="hint">Pour échanger deux valeurs, cliquez sur l'une puis sur l'autre.</p><div class="carac-grid">${CARACS.map((c) =>
          `<button type="button" class="carac ${S.car.swapSel === c.id ? "sel" : ""}" data-act="swap" data-c="${c.id}"><span>${c.ab}</span><strong>${base[c.id]}</strong></button>`).join("")}</div>`;
      }
    } else {
      const used = sum(S.car.points);
      car += `<p class="hint">Chaque caractéristique part de 20. Répartissez 90 points (4 à 18 par caractéristique). Reste : <strong>${90 - used}</strong></p>
        <div class="carac-grid">${CARACS.map((c) => {
          const v = S.car.points[c.id];
          return `<div class="carac"><span>${c.ab}</span><strong>${20 + v}</strong>
            <span class="stepper"><button type="button" data-act="pt-" data-c="${c.id}" ${v <= 4 ? "disabled" : ""}>−</button>
            <button type="button" data-act="pt+" data-c="${c.id}" ${v >= 18 || used >= 90 ? "disabled" : ""}>+</button></span></div>`;
        }).join("")}</div>`;
    }
    $("#step-car").innerHTML = car;

    // --- 2. Origine
    let org = `${cards("origin", "org", ORIGINS, S.origin.id, "origin")}
      <div class="row"><button class="btn" type="button" data-act="roll-origin">Lancer 1d100 (+25 XP)</button></div>`;
    if (o) {
      org += `<p>${S.origin.rolled ? "<span class='tag'>Tirée au sort</span> " : ""}<strong>+5 ${carNom(o.fixe)}</strong>, et +5 au choix :</p>
        <div class="seg">${o.choix.map((c) => `<label><input type="radio" name="ochoix" value="${c}" data-act="ochoix" ${S.origin.choix === c ? "checked" : ""}> ${carNom(c)}</label>`).join("")}</div>
        <p class="hint">Objet : <span class="tipped"${tip("item", o.objet)}>${esc(o.objet)}</span>${info("item", o.objet)}</p>`;
    }
    $("#step-origin").innerHTML = org;

    // --- 3. Faction
    let fac = "";
    if (!o) fac = `<p class="hint">Choisissez d'abord une origine (la table de faction en dépend).</p>`;
    else {
      fac = `${cards("faction", "fac", FACTIONS, S.faction.id, "faction")}
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
          fac += `<h4>Talent(s)</h4><div class="seg col">${f.talentChoices.map((t, i) =>
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
    let rol = `${cards("role", "rol", ROLES, S.role.id, "role", (x) => x.psyker && isBlank())}
      ${isBlank() ? `<p class="hint">Un Paria ne peut pas être Mystique.</p>` : ""}
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
        <p class="hint">Détails des talents : <a href="talents.html" target="_blank">Archive IX</a>.</p>
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
    let xps = `<div class="xp-bar ${rest < 0 ? "over" : ""}">Budget <strong>${budget}</strong> XP · dépensé <strong>${spent()}</strong> · reste <strong>${rest}</strong></div>`;
    if (!budget && !spent()) {
      xps += `<p class="hint">Vous n'avez pas d'XP bonus : ils s'obtiennent en laissant le hasard décider aux étapes 1 à 4. Vous pourrez aussi revenir ici après vos premières parties.</p>`;
    }
    if (rest < 0) xps += `<p class="warn-txt">Vous avez dépensé plus que votre budget (une étape précédente a peut-être changé). Retirez des achats ou réinitialisez.</p>`;
    if (!fcx) xps += `<p class="hint">Déterminez d'abord les caractéristiques.</p>`;
    else {
      xps += `<h4>Caractéristiques <span class="hint">(+1 par achat ; 60 maximum)</span></h4><div class="adv-list">${CARACS.map((c) => {
        const n = S.xp.car[c.id] || 0, v = fcx[c.id], cost = carCost(v + 1);
        const can = v < 60 && cost <= rest;
        return `<div class="adv"><span>${c.nom} <small>${v}${n ? ` (+${n})` : ""} · prochain : ${v < 60 ? cost + " XP" : "max"}</small></span>
          <span class="stepper"><button type="button" data-act="xc-" data-c="${c.id}" ${n ? "" : "disabled"}>−</button><span class="val">${n}</span>
          <button type="button" data-act="xc+" data-c="${c.id}" ${can ? "" : "disabled"}>+</button></span></div>`;
      }).join("")}</div>`;

      xps += `<h4>Compétences <span class="hint">(4 niveaux maximum au total)</span></h4><div class="adv-list">${Object.entries(SKILLS).map(([sk, sd]) => {
        const n = S.xp.skill[sk] || 0, lvl = advAll(sk), cost = levelCost(lvl + 1);
        const locked = sk === "psy" && !isPsyker();
        const can = !locked && lvl < 4 && cost <= rest;
        return `<div class="adv"><span>${sd.nom} <small>niv. ${lvl}${n ? ` (+${n})` : ""} · ${lvl < 4 ? cost + " XP" : "max"}</small></span>
          <span class="stepper"><button type="button" data-act="xs-" data-sk="${sk}" ${n ? "" : "disabled"}>−</button><span class="val">${n}</span>
          <button type="button" data-act="xs+" data-sk="${sk}" ${can ? "" : "disabled"}>+</button></span></div>`;
      }).join("")}</div>`;

      const specKeys = [...new Set([...Object.keys(S.role.specs), ...Object.keys(S.xp.spec)])];
      xps += `<h4>Spécialisations <span class="hint">(4 niveaux maximum chacune)</span></h4>`;
      if (specKeys.length) xps += `<div class="adv-list">${specKeys.map((k) => {
        const [sk, sp] = k.split(":"); const n = S.xp.spec[k] || 0, lvl = specAll(k), cost = levelCost(lvl + 1);
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
      if (S.xp.talents.length) xps += `<div class="chips">${S.xp.talents.map((t) => `<span class="chip on"${tip("talent", t)}>${esc(t)} <button type="button" class="x" data-act="xt-del" data-t="${esc(t)}" aria-label="Retirer">×</button></span>`).join("")}</div>`;
      xps += `<div class="row"><select class="select" id="xp-tal-select"><option value="">— Choisir un talent —</option>${buyable.map((t) =>
        `<option value="${esc(t.nom)}">${esc(t.nom)}${t.req && t.req !== "—" ? " — " + esc(t.req) : ""}</option>`).join("")}</select>
        <button class="btn ghost" type="button" data-act="xt-add" ${rest >= 100 ? "" : "disabled"}>Acheter (100 XP)</button></div>
        <div class="preview" data-preview-for="xp-tal-select" data-kind="talent"></div>
        <p class="hint">Le site ne vérifie pas les prérequis à votre place : relisez-les dans <a href="talents.html" target="_blank">l'Archive IX</a>. Psyker, Paria, Prédestiné, Héritier et Psyker sanctionné ne s'achètent pas ici.</p>`;

      if (isPsyker()) {
        const knownMinor = [...S.psy.minor, ...S.xp.minor];
        const knownPow = [...S.psy.powers, ...S.xp.powers];
        xps += `<h4>Pouvoirs psychiques <span class="hint">(mineur 60 XP, discipline 100 XP)</span></h4>`;
        const bought = [...S.xp.minor.map((p) => [p, "m"]), ...S.xp.powers.map((p) => [p, "d"])];
        if (bought.length) xps += `<div class="chips">${bought.map(([p, t]) => `<span class="chip on"${tip("power", p)}>${p} <button type="button" class="x" data-act="xpw-del" data-p="${p}" data-t="${t}" aria-label="Retirer">×</button></span>`).join("")}</div>`;
        xps += `<div class="row"><select class="select" id="xp-minor-select"><option value="">— Pouvoir mineur —</option>${PSY_MINOR.filter((p) => !knownMinor.includes(p)).map((p) => `<option>${p}</option>`).join("")}</select>
          <button class="btn ghost" type="button" data-act="xpm-add" ${rest >= 60 ? "" : "disabled"}>Apprendre (60 XP)</button></div>
          <div class="preview" data-preview-for="xp-minor-select" data-kind="power"></div>`;
        if (S.psy.discipline) xps += `<div class="row"><select class="select" id="xp-power-select"><option value="">— Pouvoir de ${S.psy.discipline} —</option>${PSY_DISCIPLINES[S.psy.discipline].filter((p) => !knownPow.includes(p)).map((p) => `<option>${p}</option>`).join("")}</select>
          <button class="btn ghost" type="button" data-act="xpd-add" ${rest >= 100 ? "" : "disabled"}>Apprendre (100 XP)</button></div>
          <div class="preview" data-preview-for="xp-power-select" data-kind="power"></div>`;
      }
      if (spent()) xps += `<p><button class="btn ghost" type="button" data-act="xp-reset">Annuler toutes les dépenses</button></p>`;
    }
    $("#step-xp").innerHTML = xps;

    // indicateurs de progression
    const done = {
      car: !!base && (S.car.mode === "hasard" || sum(S.car.points) === 90),
      origin: !!o && !!S.origin.choix,
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
    if (o) out.push(o.objet);
    const collect = (items, picks) => items.forEach((it, i) => {
      if (typeof it === "string") out.push(it);
      else if (it.one) out.push(picks[i] || `[${it.one.join(" / ")}]`);
      else (picks[i] && picks[i].length ? picks[i] : [`[${it.pick} au choix]`]).forEach((x) => out.push(x));
    });
    if (f) collect(f.equip, S.faction.equip);
    if (r) collect(r.equip, S.role.equip);
    return out;
  }

  function renderSheet() {
    const fc = finalCaracs();
    const o = origin(), f = faction(), r = role();
    const talents = allTalents();
    const fate = 3 + (talents.includes("Prédestiné") ? 1 : 0);

    let h = `<div class="sheet-head">
      <div class="sheet-name">${esc(S.name) || "Agent sans nom"}</div>
      <div class="sheet-sub">${[o && o.nom, f && f.nom, r && r.nom].filter(Boolean).join(" · ") || "Origine · Faction · Rôle"}</div>
    </div>`;

    h += `<div class="sheet-caracs">${CARACS.map((c) => `<div><span>${c.ab}</span><strong>${fc ? fc[c.id] : "—"}</strong><small>${fc ? "B" + bonus(fc[c.id]) : ""}</small></div>`).join("")}</div>`;

    if (fc) {
      const B = (id) => bonus(fc[id]);
      const wounds = B("f") + 2 * B("e") + B("fm");
      const sanctioned = talents.includes("Psyker sanctionné");
      h += `<div class="sheet-derived">
        <div><span>Blessures</span><strong>${wounds}</strong></div>
        <div><span>Critiques max</span><strong>${B("e")}</strong></div>
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
      const specs = [...new Set([...Object.keys(S.role.specs), ...Object.keys(S.xp.spec)])].filter((k) => specAll(k) && k.startsWith(sk + ":"));
      const specTxt = specs.map((k) => `<div class="spec">↳ ${esc(k.split(":")[1])} <strong>${base !== null ? val + 5 * specAll(k) : "—"}</strong></div>`).join("");
      return `<tr class="${a || specs.length ? "trained" : ""}"><td>${s.nom} <small>(${carNom(s.c)})</small>${specTxt}</td><td>${"●".repeat(a)}${"○".repeat(Math.max(0, 4 - a))}</td><td><strong>${val}</strong></td></tr>`;
    }).join("")}</tbody></table>`;

    h += `<h4>Talents</h4><p>${talents.length ? talents.map((t) => `<span class="tipped"${tip("talent", t)}>${esc(t)}</span>`).join(" · ") : "<span class='hint'>—</span>"}</p>`;

    if (isPsyker()) {
      const pw = [...S.psy.minor, ...S.xp.minor].map((p) => [p, "mineur"]).concat([...S.psy.powers, ...S.xp.powers].map((p) => [p, S.psy.discipline]));
      h += `<h4>Pouvoirs psychiques</h4><p>${pw.length ? pw.map(([p, d]) => `<span class="tipped"${tip("power", p)}>${esc(p)}</span> <small>(${esc(d)})</small>`).join(" · ") : "<span class='hint'>à choisir</span>"}</p>`;
    }

    h += `<h4>Influence</h4><p>${f ? `+1 ${esc(f.influence)}` : "—"}</p>`;
    h += `<h4>Équipement</h4><p>${equipList().map((x) => x.startsWith("[") ? esc(x) : `<span class="tipped"${tip("item", x)}>${esc(x)}</span>`).join(" · ") || "—"}${f ? ` · <strong>${esc(f.solars)} solars</strong>` : ""}</p>`;
    h += `<h4>Expérience</h4><p>Gagnés : <strong>${xp()}</strong> · dépensés : <strong>${spent()}</strong> · <strong style="color:${remaining() < 0 ? "var(--crimson-bright)" : "inherit"}">restants : ${remaining()} XP</strong></p>`;
    if (S.notes) h += `<h4>Notes</h4><p class="notes">${esc(S.notes).replace(/\n/g, "<br>")}</p>`;

    $("#sheet").innerHTML = h;
  }

  function renderAll() {
    // un talent obtenu par la faction ou le rôle n'a plus à être acheté en XP
    S.xp.talents = S.xp.talents.filter((t) => !factionTalents().includes(t) && !S.role.talents.includes(t));
    renderSteps(); renderSheet(); save();
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
    else if (act === "pt-") S.car.points[b.dataset.c]--;
    else if (act === "roll-origin") rollOrigin();
    else if (act === "roll-faction") rollFaction();
    else if (act === "roll-role") rollRole();
    else if (act === "adv+" || act === "adv-") {
      const tgt = b.dataset.scope === "faction" ? S.faction.adv : S.role.adv;
      const sk = b.dataset.sk;
      tgt[sk] = Math.max(0, (tgt[sk] || 0) + (act === "adv+" ? 1 : -1));
    }
    else if (act === "xc+" || act === "xc-") { const c = b.dataset.c; S.xp.car[c] = Math.max(0, (S.xp.car[c] || 0) + (act === "xc+" ? 1 : -1)); }
    else if (act === "xs+" || act === "xs-") { const k = b.dataset.sk; S.xp.skill[k] = Math.max(0, (S.xp.skill[k] || 0) + (act === "xs+" ? 1 : -1)); if (!S.xp.skill[k]) delete S.xp.skill[k]; }
    else if (act === "xp+" || act === "xp-") { const k = b.dataset.k; S.xp.spec[k] = Math.max(0, (S.xp.spec[k] || 0) + (act === "xp+" ? 1 : -1)); if (!S.xp.spec[k]) delete S.xp.spec[k]; }
    else if (act === "xp-spec-add") { const k = $("#xp-spec-select").value; if (!k) return; S.xp.spec[k] = (S.xp.spec[k] || 0) + 1; }
    else if (act === "xt-add") { const t = $("#xp-tal-select").value; if (!t) return; S.xp.talents.push(t); }
    else if (act === "xt-del") { S.xp.talents = S.xp.talents.filter((t) => t !== b.dataset.t); }
    else if (act === "xpm-add") { const v = $("#xp-minor-select").value; if (!v) return; S.xp.minor.push(v); }
    else if (act === "xpd-add") { const v = $("#xp-power-select").value; if (!v) return; S.xp.powers.push(v); }
    else if (act === "xpw-del") { const key = b.dataset.t === "m" ? "minor" : "powers"; S.xp[key] = S.xp[key].filter((x) => x !== b.dataset.p); }
    else if (act === "xp-reset") { S.xp = blankXp(); }
    else if (act === "reset") { if (confirm("Effacer cet agent et recommencer ?")) S = blank(); }
    else if (act === "print") { window.print(); return; }
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
    else if (act === "psy-disc") { S.psy.discipline = el.value; S.psy.powers = []; S.xp.powers = []; }
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
    if (e.key === "Escape") hideTip();
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
