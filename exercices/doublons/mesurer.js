// Fichier de la formation : ne pas modifier.
'use strict';

// Mesure une version de trouverDoublons sur les mêmes 20 000 références à chaque
// lancement, puis compare son résultat à celui de la version d'origine.
//   npm run doublons -- origine
//   npm run doublons -- proposition-1
//   npm run doublons -- proposition-2

const fs = require('node:fs');
const path = require('node:path');

const VERSIONS = ['origine', 'proposition-1', 'proposition-2'];
const nom = process.argv[2];

if (!VERSIONS.includes(nom)) {
  console.log(`Version inconnue : ${nom || '(aucune)'}. Tapez l'une de ces commandes :`);
  for (const version of VERSIONS) console.log(`  npm run doublons -- ${version}`);
  process.exit(1);
}

// Générateur pseudo-aléatoire à graine fixe : la même liste à chaque lancement.
function generateur(graine) {
  let etat = graine >>> 0;
  return () => {
    etat = (etat * 1664525 + 1013904223) >>> 0;
    return etat / 2 ** 32;
  };
}

// 20 000 références de catalogue : certaines une fois, d'autres plusieurs fois,
// mélangées.
function references() {
  const liste = [];
  let numero = 10000;
  const ajouter = (combien, fois) => {
    for (let k = 0; k < combien; k++) {
      numero += 1;
      for (let f = 0; f < fois; f++) liste.push(`REF-${numero}`);
    }
  };
  ajouter(10500, 1);
  ajouter(4000, 2);
  ajouter(500, 3);
  const hasard = generateur(20261022);
  for (let i = liste.length - 1; i > 0; i--) {
    const j = Math.floor(hasard() * (i + 1));
    [liste[i], liste[j]] = [liste[j], liste[i]];
  }
  return liste;
}

function charger(version) {
  const fichier = path.join(__dirname, `${version}.js`);
  if (!fs.existsSync(fichier)) {
    console.log(`Fichier exercices/doublons/${version}.js introuvable.`);
    process.exit(1);
  }
  return require(fichier).trouverDoublons;
}

function milliers(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function mesurer(fonction, donnees, fois) {
  fonction(donnees);
  const mesures = [];
  for (let k = 0; k < fois; k++) {
    const debut = process.hrtime.bigint();
    fonction(donnees);
    mesures.push(Number(process.hrtime.bigint() - debut) / 1e6);
  }
  mesures.sort((a, b) => a - b);
  return mesures[Math.floor(fois / 2)];
}

const donnees = references();
const fonction = charger(nom);
const fois = nom === 'origine' ? 3 : 5;
const temps = mesurer(fonction, donnees, fois);
console.log(`Version ${nom}, ${milliers(donnees.length)} références : `
  + `${temps.toFixed(1).replace('.', ',')} ms (médiane de ${fois} mesures).`);

if (nom === 'origine') {
  console.log('C\'est la version de référence : chaque proposition est comparée à son résultat.');
} else {
  const attendu = charger('origine')(donnees);
  const obtenu = fonction(donnees);
  const identique = JSON.stringify(attendu) === JSON.stringify(obtenu);
  console.log(`Résultat identique à la version d'origine : ${identique ? 'oui' : 'non'} `
    + `(${milliers(obtenu.length)} références en double, l'origine en trouve ${milliers(attendu.length)}).`);
}
