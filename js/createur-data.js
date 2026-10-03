/* ==========================================================
   Données du créateur d'agent — Imperium Maledictum
   Résumé des règles de création du livre de base (noms français maison).
   ========================================================== */

const CARACS = [
  { id: "cc",  nom: "Capacité de Combat", ab: "CC" },
  { id: "ct",  nom: "Capacité de Tir",    ab: "CT" },
  { id: "f",   nom: "Force",              ab: "F" },
  { id: "e",   nom: "Endurance",          ab: "E" },
  { id: "ag",  nom: "Agilité",            ab: "Ag" },
  { id: "int", nom: "Intelligence",       ab: "Int" },
  { id: "per", nom: "Perception",         ab: "Per" },
  { id: "fm",  nom: "Force Mentale",      ab: "FM" },
  { id: "soc", nom: "Sociabilité",        ab: "Soc" },
];

const SKILLS = {
  ath: { nom: "Athlétisme",        c: "f",   specs: ["Escalade", "Puissance", "Monte", "Course", "Natation"] },
  vig: { nom: "Vigilance",         c: "per", specs: ["Ouïe", "Vue", "Odorat", "Goût", "Toucher", "Psyniscience"] },
  dex: { nom: "Dextérité",         c: "ag",  specs: ["Crochetage", "Vol à la tire", "Prestidigitation", "Désamorçage"] },
  dis: { nom: "Discipline",        c: "fm",  specs: ["Calme", "Peur", "Psychique"] },
  res: { nom: "Résistance",        c: "e",   specs: ["Endurance", "Douleur", "Poison"] },
  int: { nom: "Intuition",         c: "per", specs: ["Gens", "Environnement"] },
  lin: { nom: "Linguistique",      c: "int", specs: ["Chiffre", "Haut Gothique", "Interdit"] },
  log: { nom: "Logique",           c: "int", specs: ["Évaluation", "Investigation"] },
  sav: { nom: "Savoir",            c: "int", specs: ["Érudition", "Adeptus Terra", "Planète", "Secteur", "Théologie", "Interdit"] },
  med: { nom: "Médecine",          c: "int", specs: ["Animal", "Humain"] },
  mel: { nom: "Mêlée",             c: "cc",  specs: ["Pugilat", "Une main", "Deux mains"] },
  nav: { nom: "Navigation",        c: "int", specs: ["Surface", "Pistage", "Vide", "Warp"] },
  pre: { nom: "Présence",          c: "fm",  specs: ["Intimidation", "Commandement", "Interrogatoire"] },
  pil: { nom: "Pilotage",          c: "ag",  specs: ["Aéronautica", "Civil", "Militaire", "Petit vaisseau", "Grand vaisseau"] },
  psy: { nom: "Maîtrise psychique", c: "fm", specs: ["Biomancie", "Divination", "Pyromancie", "Télékinésie", "Télépathie"] },
  tir: { nom: "Tir",               c: "ct",  specs: ["Arme d'épaule", "Artillerie", "Pistolets", "Lancer"] },
  ent: { nom: "Entregent",         c: "soc", specs: ["Animaux", "Charme", "Tromperie", "Marchandage", "Renseignement"] },
  ref: { nom: "Réflexes",          c: "ag",  specs: ["Acrobaties", "Équilibre", "Esquive"] },
  dsc: { nom: "Discrétion",        c: "ag",  specs: ["Dissimulation", "Se cacher", "Déplacement silencieux"] },
  tec: { nom: "Technologie",       c: "int", specs: ["Augmétiques", "Ingénierie", "Sécurité"] },
};

// max = borne haute du d100
const ORIGINS = [
  { id: "agri",   nom: "Monde agricole",   max: 10,  fixe: "f",   choix: ["e", "ag", "fm"],    objet: "Outil de tranchée (piètre qualité)" },
  { id: "feral",  nom: "Monde féral",      max: 20,  fixe: "e",   choix: ["cc", "f", "per"],   objet: "Matériel de survie (piètre qualité)" },
  { id: "feodal", nom: "Monde féodal",     max: 30,  fixe: "cc",  choix: ["f", "fm", "soc"],   objet: "Nécessaire d'écriture (piètre qualité)" },
  { id: "forge",  nom: "Monde-forge",      max: 40,  fixe: "int", choix: ["ct", "e", "ag"],    objet: "Fiole d'onguents sacrés" },
  { id: "ruche",  nom: "Monde-ruche",      max: 70,  fixe: "ag",  choix: ["ct", "per", "soc"], objet: "Filtres respiratoires (laids)" },
  { id: "schola", nom: "Schola Progenium", max: 80,  fixe: "soc", choix: ["cc", "ct", "e"],    objet: "Chrono" },
  { id: "sanct",  nom: "Monde-sanctuaire", max: 90,  fixe: "fm",  choix: ["int", "per", "soc"], objet: "Icône sacrée" },
  { id: "vide",   nom: "Né du vide",       max: 100, fixe: "per", choix: ["ag", "int", "fm"],  objet: "Bottes magnétiques (piètre qualité)" },
];

// Équipement : texte simple, { one: [...] } = un au choix, { pick: n, options: [...] } = n au choix
const FACTIONS = [
  {
    id: "adm", nom: "Adeptus Administratum", fixe: "int", choix: ["per", "fm", "soc"],
    skills: ["dex", "lin", "log", "sav", "med", "nav"], talents: ["Fouineur de données"], influence: "Administratum",
    equip: ["Robes", "Data-ardoise", "Nécessaire d'écriture", { one: ["Auto-plume", "Trousse de chirurgien", "Enregistreur picte", "Vox-émetteur"] }],
    solars: "800",
    roll: { agri: 26, feodal: 26, feral: 14, forge: 20, ruche: 24, sanct: 14, schola: 20, vide: 14 },
  },
  {
    id: "tel", nom: "Adeptus Astra Telepathica", fixe: "fm", choix: ["int", "per", "e"],
    skills: ["vig", "dis", "int", "lin", "nav", "psy"], talents: [], influence: "Astra Telepathica (ou une autre faction, avec l'accord du MJ)",
    talentChoices: [["Psyker", "Psyker sanctionné"], ["Paria"], ["Condamner la sorcière", "Forteresse mentale"]],
    equip: ["Couteau (lame monomoléculaire)", "Robes", "Instrument de divination"],
    solars: "500",
    roll: { agri: 27, feodal: 27, feral: 15, forge: 21, ruche: 25, sanct: 15, schola: 21, vide: 24 },
  },
  {
    id: "mec", nom: "Adeptus Mechanicus", fixe: "int", choix: ["e", "ag", "per"],
    skills: ["dex", "log", "sav", "med", "pil", "tec"], talents: [], influence: "Adeptus Mechanicus",
    equip: ["Robes", "Data-ardoise", "Fiole d'onguents sacrés",
      { one: ["Matrice d'augures", "Implant vocal", "Système respiratoire augmétique", "Organe sensoriel augmétique"] },
      { one: ["Bras augmétique", "Chenilles/roues augmétiques", "Cœur augmétique"] }],
    solars: "100",
    roll: { agri: 37, feodal: 29, feral: 17, forge: 71, ruche: 37, sanct: 17, schola: 23, vide: 34 },
  },
  {
    id: "min", nom: "Adeptus Ministorum", fixe: "fm", choix: ["int", "per", "soc"],
    skills: ["dis", "int", "sav", "med", "pre", "ent"], talents: ["Fidèle (Culte impérial)"], influence: "Ministorum",
    equip: ["Robes", "Icône sacrée", "Bandoulières", { pick: 2, options: ["Plastron de carapace", "Épée tronçonneuse", "Trousse de chirurgien", "Porte-voix", "Bâton ornemental", "Robes ornementales"] }],
    solars: "600",
    roll: { agri: 51, feodal: 45, feral: 30, forge: 73, ruche: 49, sanct: 57, schola: 45, vide: 38 },
  },
  {
    id: "mil", nom: "Astra Militarum", fixe: "e", choix: ["cc", "ct", "f"],
    skills: ["ath", "dis", "res", "mel", "tir", "dsc"], talents: ["Aguerri"], influence: "Astra Militarum",
    equip: ["Couteau", "Armure flak de l'Astra Militarum", "Grenade frag", { pick: 2, options: ["Fusil laser", "Pistolet laser", "Carabine laser", "Outil de tranchée", "Cape caméléoline", "Épée tronçonneuse"] }],
    solars: "300",
    roll: { agri: 65, feodal: 79, feral: 82, forge: 74, ruche: 69, sanct: 71, schola: 67, vide: 52 },
  },
  {
    id: "flo", nom: "Flotte impériale", fixe: "ag", choix: ["f", "e", "per"],
    skills: ["vig", "log", "nav", "pil", "ref", "tec"], talents: ["Pied spatial"], influence: "Navis Imperialis",
    equip: [{ one: ["Pistolet laser", "Fusil à pompe"] }, { one: ["Combinaison du vide", "Gilet flak + bottes magnétiques"] }, { one: ["Découpeur laser", "Photo-visières"] }],
    solars: "500",
    roll: { agri: 77, feodal: 83, feral: 92, forge: 84, ruche: 79, sanct: 83, schola: 74, vide: 82 },
  },
  {
    id: "inf", nom: "Infractionnistes", fixe: "ag", choix: ["e", "per", "soc"],
    skills: ["ath", "dex", "res", "ent", "ref", "dsc"], talents: ["Prévoyant"], influence: "Infractionnistes",
    equip: ["Couteau", "Sac à dos", { one: ["Pistolet à balles", "Revolver"] }, { one: ["Cuirs légers", "Cuirs épais"] }, "Une arme ordinaire et un outil courant (piètre qualité, laids)"],
    solars: "5d10",
    roll: { agri: 96, feodal: 96, feral: 97, forge: 98, ruche: 96, sanct: 97, schola: 74, vide: 87 },
  },
  {
    id: "inq", nom: "Inquisition", fixe: "per", choix: ["e", "int", "fm"],
    skills: ["vig", "dis", "int", "log", "sav", "pre"], talents: ["Toujours vigilant"], influence: "Inquisition",
    equip: ["Pistolet laser", "Combinaison blindée", "Globe lumineux", "Menottes", { one: ["Auspex", "Perce-vox", "Enregistreur picte"] }],
    solars: "400",
    roll: { agri: 98, feodal: 98, feral: 99, forge: 99, ruche: 98, sanct: 99, schola: 94, vide: 89 },
  },
  {
    id: "rt", nom: "Dynastie de libre-marchand", fixe: "soc", choix: ["ag", "int", "per"],
    skills: ["int", "lin", "nav", "pre", "pil", "ent"], talents: ["Négociateur"], influence: "Dynastie de libre-marchand",
    equip: ["Combinaison blindée", "Multicompas"],
    solars: "1 200",
    roll: { agri: 100, feodal: 100, feral: 100, forge: 100, ruche: 100, sanct: 100, schola: 100, vide: 100 },
  },
];

const ROLES = [
  {
    id: "interlocuteur", nom: "Interlocuteur", desc: "Le spécialiste de la parole.",
    skills: ["vig", "dis", "int", "lin", "pre", "ent"], specSkills: ["int", "pre", "ent"],
    talents: { n: 4, list: ["Air d'autorité", "Corrupteur", "Négociateur", "Agaçant", "Humour noir", "Charabia gothique", "Lèche-bottes", "Contremaître"] },
    equip: ["Couteau", { one: ["Pistolet laser", "Revolver"] }, "Matériel de survie", "Micro-vox", { one: ["Porte-voix", "Enregistreur picte", "Vox-émetteur"] }],
  },
  {
    id: "mystique", nom: "Mystique", desc: "Celui qui comprend les mystères du Warp.", psyker: true,
    skills: ["vig", "dis", "int", "sav", "nav", "psy"],
    specList: ["dis:Peur", "lin:Interdit", "sav:Interdit", "vig:Psyniscience", "psy:Biomancie", "psy:Divination", "psy:Pyromancie", "psy:Télékinésie", "psy:Télépathie"],
    talents: { n: 2, list: ["Condamner la sorcière", "Prédestiné", "Savoir interdit", "Forteresse mentale", "Psyker sanctionné"] },
    equip: [{ one: ["Couteau", "Bâton"] }, { one: ["Pistolet laser", "Revolver"] }, "Matériel de survie", "Micro-vox", { one: ["Focus psychique", "Auspex"] }],
  },
  {
    id: "penombre", nom: "Pénombre", desc: "L'expert de la discrétion et des coups tordus.",
    skills: ["ath", "vig", "dex", "tir", "ref", "dsc"], specSkills: ["tir", "ref", "dsc"],
    talents: { n: 2, list: ["Cambrioleur", "Terrain familier", "Lecture labiale", "Double identité", "Fileur", "Anonyme"] },
    equip: ["2 couteaux", { one: ["Pistolet automatique", "Pistolet laser"] }, { one: ["Long-las", "Fusil de précision"] }, "Silencieux", "Grenade fumigène", "Matériel de survie", "Micro-vox",
      { pick: 2, options: ["Auspex", "Perce-vox", "Kit de déguisement", "Grappin et corde", "Magnoculaires", "Passe-partout", "Enregistreur picte", "Photo-visières", "Brouilleur"] }],
  },
  {
    id: "savant", nom: "Savant", desc: "L'érudit du groupe.",
    skills: ["log", "sav", "med", "nav", "pil", "tec"], specSkills: ["sav", "med", "tec"],
    talents: { n: 2, list: ["Artiste", "Assistant attentif", "Chirurgien", "Fouineur de données", "Mémoire eidétique", "Juriste"] },
    equip: ["Couteau", { one: ["Pistolet laser", "Revolver"] }, "Bandoulières", "Data-ardoise", "Matériel de survie", "Micro-vox",
      { pick: 2, options: ["Auspex", "Auto-plume", "Outils de chirurgien", "Outil combiné", "Diagnostor", "Multicompas", "Passe-partout"] }],
  },
  {
    id: "guerrier", nom: "Guerrier", desc: "Celui qu'on envoie quand la discussion est finie.",
    skills: ["ath", "res", "med", "mel", "tir", "ref"], specSkills: ["mel", "tir", "ref"],
    talents: { n: 2, list: ["Tireur d'élite", "Désarmement", "Aguerri", "Duelliste", "Mouvement tactique", "Taille à deux mains"] },
    equip: ["Couteau", { one: ["Arme de mêlée ordinaire", "Épée tronçonneuse"] }, { one: ["Pistolet laser", "Revolver"] }, { one: ["Fusil laser", "Fusil à pompe de combat"] }, "Grenade frag", { one: ["Plaques de récupération", "Veste flak"] }, "Sac à dos", "Matériel de survie", "Micro-vox"],
  },
  {
    id: "zelote", nom: "Zélote", desc: "Un agent animé par une conviction fanatique.",
    skills: ["dis", "res", "lin", "sav", "mel", "pre"], specSkills: ["dis", "sav", "mel"],
    talents: { n: 2, list: ["Fidèle (Culte impérial)", "Flagellant", "Frénésie", "Haine", "Porte-icône", "Martyre"] },
    equip: ["Couteau", { one: ["Grande arme", "Épée tronçonneuse"] }, { one: ["Pistolet laser", "Lance-flammes de poing"] }, { one: ["Cuirs épais", "Robes"] }, "Icône sacrée", "Micro-vox", { one: ["Porte-voix", "Nécessaire d'écriture"] }],
  },
];

const PSY_MINOR = ["Call Vermin", "Combustion", "Dread Presence", "Dull Pain", "Float", "Ignite", "Ill Omen", "Jinx", "Luck", "Lull", "Nova", "Preternatural Senses", "Psychic Static", "Psychic Scrutiny", "Seal Wounds", "Sear", "Smite", "Soulsight", "Spasm", "Spectral Hands"];
const PSY_DISCIPLINES = {
  "Biomancie":   ["Affliction", "Bio-Lightning", "Cleanse", "Ferrocrete Flesh", "Haemorrhage", "Iron Limb", "Life Leech", "Metabolic Overdrive", "Wither", "Shape Flesh"],
  "Divination":  ["Armour Bane", "Dowsing", "Forewarning", "Perfect Timing", "Prescience", "Question the Warp", "Psychometry", "Scrying Gaze", "Twist Fate", "Watchward"],
  "Pyromancie":  ["Cauterise", "Command Flames", "Fire Storm", "Inferno", "Molten Beam", "Plasma Torch", "Pyrelight", "Smouldercloud", "Sunburst", "Thermal Shroud"],
  "Télékinésie": ["Abjuration Mechanicum", "Crush", "Deflection", "Gravity Well", "Impel", "Psychic Barrier", "Psychic Maelstrom", "Vortex of Doom"],
  "Télépathie":  ["Beacon", "Compel", "Erasure", "Psychic Fortitude", "Psychic Shriek", "Telepathic Link", "Terrifying Visions"],
};
