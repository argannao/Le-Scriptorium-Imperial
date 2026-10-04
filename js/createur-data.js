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

const PSY_MINOR = ["Call Vermin", "Combustion", "Dread Presence", "Dull Pain", "Float", "Ignite", "Ill Omen", "Jinx", "Luck", "Lull", "Nova", "Preternatural Senses", "Psychic Static", "Psychic Scrutiny", "Seal Wounds", "Sear", "Smite", "Soulsight", "Spasm", "Spectral Hands", "Scalding Glance"];
const PSY_DISCIPLINES = {
  "Biomancie":   ["Affliction", "Bio-Lightning", "Cleanse", "Ferrocrete Flesh", "Haemorrhage", "Iron Limb", "Life Leech", "Metabolic Overdrive", "Wither", "Shape Flesh"],
  "Divination":  ["Armour Bane", "Dowsing", "Forewarning", "Perfect Timing", "Prescience", "Question the Warp", "Psychometry", "Scrying Gaze", "Twist Fate", "Watchward"],
  "Pyromancie":  ["Cauterise", "Command Flames", "Fire Storm", "Inferno", "Molten Beam", "Plasma Torch", "Pyrelight", "Smouldercloud", "Sunburst", "Thermal Shroud"],
  "Télékinésie": ["Abjuration Mechanicum", "Breach", "Crush", "Deflection", "Gate of Infinity", "Gravity Well", "Impel", "Psychic Barrier", "Psychic Maelstrom", "Vortex of Doom"],
  "Télépathie":  ["Beacon", "Compel", "Dominate", "Erasure", "Mental Interrogation", "Nightshroud", "Psychic Fortitude", "Psychic Shriek", "Telepathic Link", "Terrifying Visions"],
};

// Talents (nom, prérequis, effet résumé) — repris de talents.html
const TALENTS = [{"nom": "Sens aiguisé", "en": "Acute Sense", "req": "—", "cat": "divers", "eff": "Un des cinq sens est hors norme : on peut percevoir des détails normalement indétectables.", "creation": false}, {"nom": "Poussée d'adrénaline", "en": "Adrenaline Acceleration", "req": "—", "cat": "divers", "eff": "Blessé gravement, on court plus vite et on a l'Avantage pour fuir ou poursuivre.", "creation": false}, {"nom": "Attaques agiles", "en": "Agile Attacks", "req": "Ag 45, Mêlée 2", "cat": "combat", "eff": "Le BAg remplace le BF pour les dégâts des armes discrètes.", "creation": false}, {"nom": "Air d'autorité", "en": "Air of Authority", "req": "Présence 2", "cat": "social", "eff": "À la première rencontre avec un groupe, un test réussi donne +1 Influence auprès de lui pour la mission.", "creation": false}, {"nom": "Ambidextre", "en": "Ambidextrous", "req": "—", "cat": "combat", "eff": "Pas de pénalité avec la main non dominante ; arme de mêlée et pistolet en même temps sans malus.", "creation": false}, {"nom": "Anatomie appliquée", "en": "Applied Anatomy", "req": "Médecine 2", "cat": "savoir", "eff": "Rend plus graves les blessures critiques qu'on inflige, selon ses niveaux en Médecine.", "creation": false}, {"nom": "Artiste", "en": "Artistic", "req": "—", "cat": "divers", "eff": "+2 DR aux tests liés à un art (littérature, peinture, musique, théâtre). Cumulable, un art à chaque fois.", "creation": false}, {"nom": "Assistant attentif", "en": "Attentive Assistant", "req": "—", "cat": "savoir", "eff": "Peut aider sans connaître la compétence ; s'il la connaît, l'aidé gagne +1 DR.", "creation": false}, {"nom": "Paria", "en": "Blank", "req": "Création seulement ; jamais Psyker", "cat": "psy", "eff": "Aucune présence dans le Warp : immunisé à la possession et à la corruption, perturbe psykers et démons… mais met tout le monde mal à l'aise.", "creation": true}, {"nom": "Briseur d'os", "en": "Bone Breaker", "req": "Médecine (spécialisation) 2", "cat": "savoir", "eff": "Peut briser un os d'une cible immobilisée.", "creation": false}, {"nom": "Corrupteur", "en": "Briber", "req": "Intuition (Gens) 2", "cat": "social", "eff": "Sent qui est achetable et réduit le prix des pots-de-vin selon son talent de marchandage.", "creation": false}, {"nom": "Rempart", "en": "Bulwark", "req": "Réflexes 3", "cat": "combat", "eff": "Avec un bouclier, protège un allié de plus, ou un allié et toute sa zone.", "creation": false}, {"nom": "Cambrioleur", "en": "Burglar", "req": "Athlétisme 1, Discrétion 1", "cat": "discretion", "eff": "Avantage pour s'introduire quelque part : escalader, briser une vitre, ouvrir une serrure.", "creation": false}, {"nom": "Chirurgien", "en": "Chirurgeon", "req": "Médecine 2", "cat": "savoir", "eff": "Peut opérer, amputer et soigner des critiques hors de portée des autres ; Avantage pour soigner en combat.", "creation": false}, {"nom": "Discipline rapprochée", "en": "Close Quarters Discipline", "req": "Discipline 2, Tir 2", "cat": "combat", "eff": "Un ennemi au contact ne gêne plus les tirs.", "creation": false}, {"nom": "Maître d'armes", "en": "Combat Master", "req": "Mêlée 2", "cat": "combat", "eff": "Compte pour deux combattants pour le surnombre.", "creation": false}, {"nom": "Condamner la sorcière", "en": "Condemn the Witch", "req": "FM 40, Psyker (ou accord du MJ)", "cat": "psy", "eff": "Quand on contre un pouvoir, le psyker adverse subit des Blessures égales à sa Valeur Warp.", "creation": false}, {"nom": "Contorsionniste", "en": "Contortionist", "req": "—", "cat": "discretion", "eff": "Passe dans des espaces minuscules ; Avantage pour se libérer de liens ou d'une prise.", "creation": false}, {"nom": "Contre-attaque", "en": "Counter Attack", "req": "Mêlée 3", "cat": "combat", "eff": "En gagnant l'opposition en défense, on inflige des dégâts comme si on attaquait. Cumulable.", "creation": false}, {"nom": "Fouineur de données", "en": "Data Delver", "req": "Logique (Investigation) 2", "cat": "savoir", "eff": "Avantage pour fouiller archives et documents, et lecture deux fois plus rapide.", "creation": false}, {"nom": "Négociateur", "en": "Dealmaker", "req": "Intuition (Gens) 1, Entregent (Marchandage) 1", "cat": "social", "eff": "En négociation, un test réussi révèle ce qui ferait céder l'autre ou donne un autre avantage.", "creation": false}, {"nom": "Tireur d'élite", "en": "Deadeye", "req": "Tir 1", "cat": "combat", "eff": "+1 DR en visant ; repris, Avantage pour viser une localisation.", "creation": false}, {"nom": "Expert en démolition", "en": "Demolition Specialist", "req": "Tir (Artillerie) 2 ou Dextérité (Désamorçage) 2", "cat": "combat", "eff": "Peut stabiliser un explosif et règle mieux ses retardateurs.", "creation": false}, {"nom": "Serviteur dévoué", "en": "Devoted Servant", "req": "—", "cat": "divers", "eff": "Avantage dans un métier honnête au choix (agriculteur, agent d'entretien, artiste, chasseur…).", "creation": false}, {"nom": "Frappes dirigées", "en": "Directed Strikes", "req": "Mêlée 3", "cat": "combat", "eff": "Viser une localisation en mêlée sans Désavantage.", "creation": false}, {"nom": "Coups bas", "en": "Dirty Fighting", "req": "Mêlée (Pugilat) 2", "cat": "combat", "eff": "Un coup qui blesse peut aveugler ou assourdir ; avec +3 DR, étourdir.", "creation": false}, {"nom": "Désarmement", "en": "Disarm", "req": "Mêlée 2", "cat": "combat", "eff": "Au lieu de blesser, fait lâcher son arme à un adversaire de taille égale ou inférieure.", "creation": false}, {"nom": "Voix dérangeante", "en": "Disturbing Voice", "req": "—", "cat": "social", "eff": "+2 DR pour intimider ou interroger, mais −2 DR auprès de ceux que la voix met mal à l'aise.", "creation": false}, {"nom": "Agaçant", "en": "Distracting", "req": "—", "cat": "social", "eff": "Une fois par scène, une interruption bien sentie impose le Désavantage au test d'un autre.", "creation": false}, {"nom": "Aguerri", "en": "Drilled", "req": "Discipline 1", "cat": "combat", "eff": "Avantage contre la peur, et +1 DR en Discipline par allié aguerri dans la zone.", "creation": false}, {"nom": "Combat à deux armes", "en": "Dual Wielder", "req": "Ambidextre, Mêlée (Une main) 2", "cat": "combat", "eff": "Attaquer avec deux armes de mêlée sans Désavantage.", "creation": false}, {"nom": "Duelliste", "en": "Duellist", "req": "Mêlée (Une main) 2", "cat": "combat", "eff": "Les armes à une main deviennent défensives ; repris, donne des bottes de duelliste (feinte, etc.).", "creation": false}, {"nom": "Mémoire eidétique", "en": "Eidetic Memory", "req": "—", "cat": "savoir", "eff": "Se souvient parfaitement de tout ce qu'il a vu, sans test.", "creation": false}, {"nom": "Toujours vigilant", "en": "Ever Vigilant", "req": "Vigilance 2", "cat": "discretion", "eff": "+1 DR pour repérer les ennemis cachés et dort d'un œil.", "creation": false}, {"nom": "Exploiter la faiblesse", "en": "Exploit Vulnerability", "req": "Intuition (Gens) 2", "cat": "combat", "eff": "Après avoir étudié l'ennemi, choisit la localisation de sa première attaque réussie.", "creation": false}, {"nom": "Proprioception étendue", "en": "Extended Proprioception", "req": "Pilotage (spécialisation) 3", "cat": "divers", "eff": "Ressent le véhicule piloté comme son propre corps : taille, position, passages possibles.", "creation": false}, {"nom": "Fidèle (Culte impérial)", "en": "Faithful (Imperial Cult)", "req": "Ministorum, ou +2 Influence Ministorum, ou Savoir (Théologie) 2", "cat": "foi", "eff": "Un vrai croyant, capable de manifester sa foi par de petits miracles en dépensant ou brûlant du Destin.", "creation": false}, {"nom": "Fausse retraite", "en": "False Retreat", "req": "Entregent (Tromperie) 3", "cat": "discretion", "eff": "Fait semblant de fuir puis réapparaît ailleurs, au prix d'1 Supériorité.", "creation": false}, {"nom": "Terrain familier", "en": "Familiar Terrain", "req": "—", "cat": "discretion", "eff": "Dans un type de milieu choisi : Avantage en Discrétion et meilleur couvert. Cumulable.", "creation": false}, {"nom": "Prédestiné", "en": "Fated", "req": "Création seulement", "cat": "divers", "eff": "+1 point de Destin. Une seule fois.", "creation": true}, {"nom": "Médecin de terrain", "en": "Field Medicae", "req": "Médecine 2", "cat": "savoir", "eff": "Les tests de soin ne sont jamais plus durs que Normal.", "creation": false}, {"nom": "Flagellant", "en": "Flagellant", "req": "—", "cat": "foi", "eff": "La douleur est une prière : Avantage pour résister à la souffrance et aux interrogatoires.", "creation": false}, {"nom": "Tir de flanc", "en": "Flanking Fire", "req": "Tir 2", "cat": "combat", "eff": "Une cible dans la zone d'un allié profite moins de son couvert.", "creation": false}, {"nom": "La chair est faible", "en": "Flesh is Weak", "req": "Technologie (Augmétiques) 2", "cat": "divers", "eff": "Le nombre maximum d'augmétiques passe à deux fois le BE.", "creation": false}, {"nom": "Savoir interdit", "en": "Forbidden Knowledge", "req": "Création, ou accord du MJ", "cat": "savoir", "eff": "Débloque une spécialisation interdite (langues, savoirs…). Dangereux si l'Inquisition l'apprend.", "creation": false}, {"nom": "Faussaire", "en": "Forger", "req": "Linguistique 2, Savoir 2", "cat": "social", "eff": "Fabrique de faux documents qui donnent de l'Influence auprès d'une faction.", "creation": false}, {"nom": "Fanatique du tir automatique", "en": "Full-Auto Fanatic", "req": "Tir 3", "cat": "combat", "eff": "Peut vider deux fois plus de munitions en tir rapide pour arroser une zone plus large.", "creation": false}, {"nom": "Frénésie", "en": "Frenzy", "req": "—", "cat": "combat", "eff": "Entre en rage : +1 BF, insensible à la peur, mais doit charger l'ennemi le plus proche.", "creation": false}, {"nom": "Humour noir", "en": "Gallows Humour", "req": "Entregent (Charme) 2", "cat": "social", "eff": "Une blague au bon moment remonte le moral d'un allié épuisé ou terrifié.", "creation": false}, {"nom": "Charabia gothique", "en": "Gothic Gibberish", "req": "Linguistique 1", "cat": "social", "eff": "Noie quelqu'un sous un flot de jargon pour le désorienter.", "creation": false}, {"nom": "Gardien", "en": "Guardian", "req": "Réflexes 3", "cat": "combat", "eff": "Protège un allié choisi pendant tout le combat et peut s'interposer.", "creation": false}, {"nom": "Pistolero", "en": "Gunslinger", "req": "Ambidextre, Tir (Pistolets) 2", "cat": "combat", "eff": "Tirer avec deux armes sans Désavantage.", "creation": false}, {"nom": "Haine", "en": "Hatred", "req": "—", "cat": "foi", "eff": "Haine d'un type d'ennemi (xenos, hérétiques…) : s'il cède à sa rage, bonus contre la peur et +1 DR pour l'attaquer, mais doit le détruire à tout prix.", "creation": false}, {"nom": "Frapper et filer", "en": "Hit and Run", "req": "Réflexes (Acrobaties) 3", "cat": "combat", "eff": "Après avoir blessé, peut se désengager et changer de zone gratuitement.", "creation": false}, {"nom": "Cache secrète", "en": "Holdout Expert", "req": "—", "cat": "discretion", "eff": "Dissimule un petit objet sur soi, très difficile à trouver lors d'une fouille.", "creation": false}, {"nom": "Hypno-endoctrinement", "en": "Hypno-Indoctrination", "req": "—", "cat": "divers", "eff": "Un conditionnement oublié se réveille : deux talents aléatoires. Une seule fois.", "creation": false}, {"nom": "Porte-icône", "en": "Icon Bearer", "req": "Savoir (Théologie) 1, Présence 1", "cat": "foi", "eff": "Brandie, son icône sacrée profite à tous les alliés qui la voient.", "creation": false}, {"nom": "L'ignorance est mon bouclier", "en": "Ignorance is My Shield", "req": "Int < 30, aucun savoir interdit", "cat": "foi", "eff": "+4 DR pour résister à la corruption, aux pouvoirs et aux démons, mais −4 DR pour tout savoir sur eux.", "creation": false}, {"nom": "Présence inspirante", "en": "Inspiring Presence", "req": "Présence (Commandement) 2", "cat": "social", "eff": "Les alliés de la zone qui le voient ont l'Avantage en Discipline.", "creation": false}, {"nom": "Héritier", "en": "Inheritor", "req": "Création seulement", "cat": "social", "eff": "Descendant d'une lignée notable : +1 Influence, et parfois un héritage… avec ses fardeaux.", "creation": true}, {"nom": "Juriste", "en": "Lawbringer", "req": "Savoir (Adeptus Terra) 2", "cat": "social", "eff": "Brandir la loi impériale aide à faire pression sur quelqu'un qui l'a enfreinte.", "creation": false}, {"nom": "Lèche-bottes", "en": "Lickspittle", "req": "—", "cat": "social", "eff": "Avantage pour flatter un supérieur.", "creation": false}, {"nom": "Martyre", "en": "Martyrdom", "req": "Résistance 2", "cat": "foi", "eff": "Avec une blessure critique reçue au service de l'Empereur, bonus de DR pour affronter l'ennemi.", "creation": false}, {"nom": "Médecin non conventionnel", "en": "Medicae Maverick", "req": "Une spécialisation Médecine interdite", "cat": "savoir", "eff": "Des techniques interdites qui réparent une fracture en urgence.", "creation": false}, {"nom": "Forteresse mentale", "en": "Mental Fortress", "req": "Discipline (Psychique) 2", "cat": "psy", "eff": "Esprit illisible par la télépathie, et dégâts psychiques réduits du BFM.", "creation": false}, {"nom": "Imitateur", "en": "Mimic", "req": "Vigilance (Ouïe) 2, Entregent (Tromperie) 2", "cat": "discretion", "eff": "Imite la voix de quelqu'un après l'avoir écouté une heure.", "creation": false}, {"nom": "Contremaître", "en": "Overseer", "req": "Présence (Commandement) 2", "cat": "social", "eff": "Guide un allié : il utilise votre compétence à la place de la sienne pour son prochain test.", "creation": false}, {"nom": "Médecin légiste", "en": "Pathologist", "req": "Médecine (Humain) 2", "cat": "savoir", "eff": "Avantage aux autopsies.", "creation": false}, {"nom": "Saigneur", "en": "Phlebotomist", "req": "Médecine 3", "cat": "savoir", "eff": "Analyse le sang ; en mêlée, peut faire saigner au lieu de blesser.", "creation": false}, {"nom": "Porteur", "en": "Porter", "req": "Résistance (Endurance) 2", "cat": "divers", "eff": "L'encombrement max devient deux fois le BF + le BE.", "creation": false}, {"nom": "Châtiment psychique", "en": "Psychic Castigation", "req": "Psyker", "cat": "psy", "eff": "Quand on résiste à un pouvoir, son auteur subit des Blessures.", "creation": false}, {"nom": "Déferlement psychique", "en": "Psychic Flood", "req": "Psyker", "cat": "psy", "eff": "Prend volontairement de la Charge Warp pour renforcer un pouvoir.", "creation": false}, {"nom": "Psyker", "en": "Psyker", "req": "Jamais Paria", "cat": "psy", "eff": "Accès au Warp et aux pouvoirs psychiques, avec tous les risques qui vont avec.", "creation": false}, {"nom": "Dégaine rapide", "en": "Quickdraw", "req": "Tir (Pistolets) 2, Réflexes 2", "cat": "combat", "eff": "Dégaine et tire au pistolet avant tout le monde au début du combat.", "creation": false}, {"nom": "Rechargement rapide", "en": "Rapid Reload", "req": "Dextérité 2, Tir 2", "cat": "combat", "eff": "Recharge gratuitement un type d'arme. Cumulable.", "creation": false}, {"nom": "Lecture labiale", "en": "Read Lips", "req": "Vigilance (Vue) 1, Linguistique 1", "cat": "discretion", "eff": "Comprend ce que disent les gens rien qu'en regardant leurs lèvres.", "creation": false}, {"nom": "Marchand patenté", "en": "Registered Trader", "req": "Logique (Évaluation) 2, Entregent (Marchandage) 2", "cat": "social", "eff": "Revend son matériel au prix fort.", "creation": false}, {"nom": "Psyker sanctionné", "en": "Sanctioned Psyker", "req": "Psyker ; création seulement", "cat": "psy", "eff": "Formé et autorisé par l'Imperium : Seuil Warp doublé (2 × BFM) et un symbole officiel de son statut.", "creation": true}, {"nom": "Double identité", "en": "Secret Identity", "req": "Accord du MJ", "cat": "discretion", "eff": "Se fait passer pour membre d'une autre faction : +1 Influence auprès d'elle tant que la couverture tient.", "creation": false}, {"nom": "Assaut éclair", "en": "Shock Assault", "req": "Ag 45, Discrétion 3", "cat": "combat", "eff": "Deux actions pendant le round de surprise.", "creation": false}, {"nom": "Fileur", "en": "Skulker", "req": "Navigation 1, Discrétion 1", "cat": "discretion", "eff": "Suit quelqu'un sans avoir à tester sa Discrétion.", "creation": false}, {"nom": "Insaisissable", "en": "Slippery", "req": "Réflexes 2", "cat": "combat", "eff": "Désavantage pour qui l'attaque quand il se désengage ; repris, se désengage gratuitement.", "creation": false}, {"nom": "Commandant supérieur", "en": "Superior Commander", "req": "Présence (Commandement) 4", "cat": "combat", "eff": "Donne des ordres : autant d'alliés que la Supériorité agissent ou bougent immédiatement.", "creation": false}, {"nom": "Tir de suppression", "en": "Suppressing Fire", "req": "Tir 2", "cat": "combat", "eff": "En tir rapide, cloue l'ennemi sur place au lieu de le blesser.", "creation": false}, {"nom": "Pied sûr", "en": "Sure-Footed", "req": "Athlétisme 1, Résistance 1, Réflexes 1", "cat": "combat", "eff": "Rapide avec de la Supériorité, difficile à renverser, se relève gratuitement.", "creation": false}, {"nom": "Mouvement tactique", "en": "Tactical Movement", "req": "Athlétisme 1, Discipline 1", "cat": "combat", "eff": "Se met à couvert gratuitement.", "creation": false}, {"nom": "Tenace", "en": "Tenacious", "req": "—", "cat": "divers", "eff": "Peut se remettre immédiatement d'un étourdissement.", "creation": false}, {"nom": "Taille à deux mains", "en": "Two-handed Cleave", "req": "Mêlée (Deux mains) 2", "cat": "combat", "eff": "Les armes à deux mains gagnent Dispersion. Cumulable.", "creation": false}, {"nom": "Présence inébranlable", "en": "Unflinching Presence", "req": "Présence (Commandement) 3", "cat": "combat", "eff": "Un test réussi empêche le groupe de perdre de la Supériorité.", "creation": false}, {"nom": "Anonyme", "en": "Unremarkable", "req": "Aucun niveau en Présence", "cat": "discretion", "eff": "Bien habillé, se fond dans la foule impériale sans test.", "creation": false}, {"nom": "Pied spatial", "en": "Void Legs", "req": "—", "cat": "divers", "eff": "Insensible au mal de l'espace et à l'apesanteur. Cumulable pour d'autres bonus de voyageur du vide.", "creation": false}, {"nom": "Prévoyant", "en": "Well-Prepared", "req": "—", "cat": "divers", "eff": "Une fois par mission, sort de son sac le petit objet dont on a besoin (en le payant après coup).", "creation": false}];
