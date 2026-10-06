/* ==========================================================
   LE SCRIPTORIUM IMPÉRIAL — script commun
   - injecte l'en-tête et le pied de page sur chaque page
   - surligne le module actif
   - menu mobile, recherche du lexique, dé d100
   ========================================================== */

// Liste des modules : ajouter une ligne ici suffit pour qu'il apparaisse dans le menu.
const MODULES = [
  { href: "index.html",       label: "Accueil" },
  { href: "createur.html",    label: "Créateur" },
  { href: "regles.html",      label: "Règles" },
  { href: "creation.html",    label: "Création" },
  { href: "competences.html", label: "Compétences" },
  { href: "talents.html",     label: "Talents" },
  { href: "armurerie.html",   label: "Armurerie" },
  { href: "psy.html",         label: "Psykers" },
  { href: "factions.html",    label: "Factions" },
  { href: "secteur.html",     label: "Secteur" },
  { href: "xenos.html",       label: "Xenos" },
  { href: "lexique.html",     label: "Lexique" },
];

// Sceau du site (roue dentée + plume), dessin original.
const SEAL_SVG = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="sealGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e8c873"/>
      <stop offset="1" stop-color="#8f7333"/>
    </linearGradient>
  </defs>
  <g fill="url(#sealGold)">
    ${Array.from({ length: 12 }, (_, i) =>
      `<rect x="45" y="4" width="10" height="14" rx="1" transform="rotate(${i * 30} 50 50)"/>`
    ).join("")}
  </g>
  <circle cx="50" cy="50" r="36" fill="#14110e" stroke="url(#sealGold)" stroke-width="4"/>
  <circle cx="50" cy="50" r="28" fill="none" stroke="#8e1b1b" stroke-width="1.5"/>
  <path d="M63 30 C52 38 44 52 39 70 L42 71 C47 55 55 42 65 33 Z" fill="url(#sealGold)"/>
  <path d="M39 70 L37 76 L42 71 Z" fill="#c0392b"/>
  <path d="M34 66 H58" stroke="url(#sealGold)" stroke-width="2"/>
</svg>`;

function currentPage() {
  const file = location.pathname.split("/").pop();
  return file === "" ? "index.html" : file;
}

function buildHeader() {
  const page = currentPage();
  const links = MODULES.map(
    (m) => `<li><a href="${m.href}"${m.href === page ? ' class="active" aria-current="page"' : ""}>${m.label}</a></li>`
  ).join("");

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="index.html">
        <span class="brand-mark">${SEAL_SVG}</span>
        <span>Le Scriptorium Impérial</span>
      </a>
      <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav">MENU</button>
      <nav class="site-nav" id="site-nav"><ul>${links}</ul></nav>
    </div>`;
  document.body.prepend(header);

  const toggle = header.querySelector(".nav-toggle");
  const nav = header.querySelector(".site-nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
}

function buildFooter() {
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div>Le Scriptorium Impérial — aide de jeu de fan, en français</div>
    <p class="legal">
      Site non officiel, sans but lucratif. Warhammer 40,000 et les éléments associés sont des marques
      de Games Workshop Ltd ; les jeux de rôle officiels sont édités par Cubicle 7. Les textes de ce site
      sont des résumés et des notes personnelles : pour les règles complètes, référez-vous aux livres officiels.
    </p>`;
  document.body.append(footer);
}

// Sceau dans le héros de l'accueil
function fillSeals() {
  document.querySelectorAll("[data-seal]").forEach((el) => (el.innerHTML = SEAL_SVG));
}

// Effet "cogitateur" : les lignes de la data-ardoise s'affichent une à une
function typeDataslate() {
  document.querySelectorAll(".dataslate[data-type]").forEach((slate) => {
    const lines = [...slate.querySelectorAll("p")];
    lines.forEach((p) => (p.style.visibility = "hidden"));
    lines.forEach((p, i) => setTimeout(() => (p.style.visibility = "visible"), 350 * (i + 1)));
  });
}

// Recherche dans le lexique
function initGlossarySearch() {
  const input = document.querySelector("#glossary-search");
  if (!input) return;
  const terms = [...document.querySelectorAll(".glossary dt")];
  const count = document.querySelector("#glossary-count");

  const update = () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    terms.forEach((dt) => {
      const dd = dt.nextElementSibling;
      const match = !q || (dt.textContent + " " + dd.textContent).toLowerCase().includes(q);
      dt.classList.toggle("hidden", !match);
      dd.classList.toggle("hidden", !match);
      if (match) shown++;
    });
    if (count) count.textContent = `${shown} entrée(s)`;
  };
  input.addEventListener("input", update);
  update();
}

// Simulateur de test d100 (module Règles) — règles d'Imperium Maledictum
// d100 = dé des dizaines + dé des unités ; "00" vaut 100.
const d100Value = (tens, units) => (tens === 0 && units === 0 ? 100 : tens * 10 + units);
const fmt = (v) => (v === 100 ? "00" : String(v).padStart(2, "0"));

function outcomeLabel(sl, success) {
  if (success) {
    if (sl >= 5) return "RÉUSSITE ÉCLATANTE";
    if (sl >= 3) return "BELLE RÉUSSITE";
    if (sl >= 1) return "RÉUSSITE";
    return "RÉUSSITE DE JUSTESSE";
  }
  if (sl <= -5) return "ÉCHEC CATASTROPHIQUE";
  if (sl <= -3) return "ÉCHEC CUISANT";
  if (sl <= -1) return "ÉCHEC";
  return "ÉCHEC DE JUSTESSE";
}

function initDice() {
  const btn = document.querySelector("#roll-btn");
  if (!btn) return;
  const target = document.querySelector("#roll-target");
  const modSel = document.querySelector("#roll-mod");
  const advSel = document.querySelector("#roll-adv");
  const out = document.querySelector("#roll-out");

  btn.addEventListener("click", () => {
    const skill = Math.max(1, Math.min(100, parseInt(target.value, 10) || 0));
    const mod = modSel ? parseInt(modSel.value, 10) : 0;
    const adv = advSel ? parseInt(advSel.value, 10) : 0;
    const t = skill + mod; // valeur cible modifiée (peut dépasser 100 ou tomber sous 1)

    const tens = Math.floor(Math.random() * 10);
    const units = Math.floor(Math.random() * 10);
    const raw = d100Value(tens, units);
    const swapped = d100Value(units, tens);

    let roll = raw;
    let note = "";
    if (adv === 1 && swapped < raw) { roll = swapped; note = ` (inversé depuis ${fmt(raw)} grâce à l'Avantage)`; }
    if (adv === -1 && swapped > raw) { roll = swapped; note = ` (inversé depuis ${fmt(raw)} à cause du Désavantage)`; }

    let success = roll <= t;
    let sl = Math.floor(t / 10) - Math.floor(roll / 10);
    let auto = "";
    if (roll <= 5) { success = true; if (sl < 0) sl = 0; auto = " — réussite automatique"; }
    if (roll >= 96) { success = false; if (sl > 0) sl = 0; auto = " — échec automatique"; }
    if (success && sl < 0) sl = 0;   // cas limite : succès toujours >= +0
    if (!success && sl > 0) sl = 0;  // échec toujours <= -0

    const slText = success ? `+${sl}` : (sl === 0 ? "−0" : `−${Math.abs(sl)}`);
    const rTens = roll === 100 ? 0 : Math.floor(roll / 10);
    const rUnits = roll % 10;
    const isDouble = rTens === rUnits;
    let dbl = "";
    if (roll === 99 || roll === 100) dbl = "<p>&gt; 99/00 : MALADRESSE automatique en combat.</p>";
    else if (isDouble) dbl = `<p>&gt; DOUBLE : ${success ? "CRITIQUE" : "MALADRESSE"} s'il s'agit d'une attaque.</p>`;

    out.innerHTML =
      `<p>&gt; VALEUR CIBLE : ${skill}${mod ? ` ${mod > 0 ? "+" : "−"} ${Math.abs(mod)} = ${t}` : ""}</p>` +
      `<p>&gt; JET : <strong>${fmt(roll)}</strong>${note}</p>` +
      `<p>&gt; RÉSULTAT : <strong>${outcomeLabel(sl, success)}</strong> (${slText} DR)${auto}</p>` +
      dbl;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  buildHeader();
  buildFooter();
  fillSeals();
  typeDataslate();
  initGlossarySearch();
  initDice();
});
