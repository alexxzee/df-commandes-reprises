// Fichier de la formation : ne pas modifier.
'use strict';

// Hook « avant l'action » commun à Copilot, Codex et Claude Code.
//   node scripts/hooks/proteger.js <chemin protégé> [<autre chemin protégé> ...]
// L'outil d'IA lance cette commande avant une action de son agent et lui passe
// l'action en JSON sur l'entrée standard. Si l'action écrit ou vise un chemin
// protégé, le script la refuse : code de sortie 2 et motif sur la sortie
// d'erreur. Toute autre action passe (code 0), y compris une entrée illisible,
// pour ne jamais bloquer l'outil par erreur.
// Les chemins protégés sont relatifs à la racine du dépôt ; aucun n'est écrit ici.

const fs = require('node:fs');
const path = require('node:path');

const RACINE = path.resolve(__dirname, '..', '..');

// Outils qui ne font que lire ou chercher : jamais refusés.
const LECTURE = /^(read|view|grep|glob|ls|list|search|find|fetch|web|codebase|read_file|file_search|grep_search|semantic_search|list_dir)/i;

function lireEvenement() {
  try {
    const texte = fs.readFileSync(0, 'utf8');
    const evenement = JSON.parse(texte);
    return evenement && typeof evenement === 'object' ? evenement : null;
  } catch {
    return null;
  }
}

// Copilot passe parfois les arguments sous forme de texte JSON.
function argumentsDe(evenement) {
  const args = evenement.tool_input ?? evenement.toolArgs ?? evenement.toolInput ?? {};
  if (typeof args !== 'string') return args;
  try {
    return JSON.parse(args);
  } catch {
    return args;
  }
}

function textes(valeur, sortie = []) {
  if (typeof valeur === 'string') sortie.push(valeur);
  else if (Array.isArray(valeur)) valeur.forEach((v) => textes(v, sortie));
  else if (valeur && typeof valeur === 'object') Object.values(valeur).forEach((v) => textes(v, sortie));
  return sortie;
}

function normaliser(texte) {
  const racine = RACINE.split(path.sep).join('/');
  return texte.split('\\').join('/').split(`${racine}/`).join('');
}

function echapper(texte) {
  return texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Le chemin protégé, isolé : précédé d'un début, d'un blanc, d'un guillemet,
// de « ./ », « = », « : » ou « > », et suivi d'aucun caractère de nom de fichier.
function vise(texte, chemin) {
  const motif = new RegExp(`(^|[\\s"'=:>(]|\\./)${echapper(chemin)}(?![\\w.-])`);
  return motif.test(normaliser(texte));
}

function cheminVise(evenement, proteges) {
  const outil = String(evenement.tool_name ?? evenement.toolName ?? '');
  if (LECTURE.test(outil)) return null;
  const morceaux = textes(argumentsDe(evenement));
  return proteges.find((chemin) => morceaux.some((texte) => vise(texte, chemin))) ?? null;
}

function principal() {
  const proteges = process.argv.slice(2).map((c) => c.split('\\').join('/').replace(/^\.\//, ''));
  const evenement = lireEvenement();
  if (proteges.length === 0 || evenement === null) return 0;
  const chemin = cheminVise(evenement, proteges);
  if (chemin === null) return 0;
  process.stderr.write(`${chemin} est protégé par le hook de l’équipe : aucun agent ne le modifie, demandez à un humain.\n`);
  return 2;
}

if (require.main === module) process.exit(principal());

module.exports = { cheminVise, vise };
