// Fichier de la formation : ne pas modifier.
'use strict';

// Chiffre un fichier avant de le stocker ou de le transmettre (AES-256-GCM).
//   npm run chiffrer                  chiffre exercices/confidentialite/export-clients.csv
//   npm run chiffrer -- --dechiffrer  affiche le contenu déchiffré
// La phrase de passe est lue dans la variable d'environnement DF_CLE_EXPORT,
// créée dans le terminal : elle n'est écrite dans aucun fichier du dépôt.
// Le fichier chiffré contient : sel (16 octets), vecteur d'initialisation
// (12 octets), étiquette d'authentification (16 octets), puis les données.

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const DOSSIER = path.join(__dirname, '..', 'exercices', 'confidentialite');
const CLAIR = path.join(DOSSIER, 'export-clients.csv');
const CHIFFRE = path.join(DOSSIER, 'export-clients.chiffre');
const ENTETE = 'DF-CHIFFRE AES-256-GCM';
const LONGUEUR_MIN = 12;

function cleDepuis(phrase, sel) {
  return crypto.scryptSync(phrase, sel, 32);
}

function chiffrer(clair, phrase) {
  const sel = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const chiffreur = crypto.createCipheriv('aes-256-gcm', cleDepuis(phrase, sel), iv);
  const donnees = Buffer.concat([chiffreur.update(clair), chiffreur.final()]);
  const tout = Buffer.concat([sel, iv, chiffreur.getAuthTag(), donnees]).toString('base64');
  return `${ENTETE}\n${tout.match(/.{1,64}/g).join('\n')}\n`;
}

function dechiffrer(texte, phrase) {
  const tout = Buffer.from(texte.replace(ENTETE, '').replace(/\s/g, ''), 'base64');
  const sel = tout.subarray(0, 16);
  const iv = tout.subarray(16, 28);
  const etiquette = tout.subarray(28, 44);
  const dechiffreur = crypto.createDecipheriv('aes-256-gcm', cleDepuis(phrase, sel), iv);
  dechiffreur.setAuthTag(etiquette);
  return Buffer.concat([dechiffreur.update(tout.subarray(44)), dechiffreur.final()]);
}

const phrase = process.env.DF_CLE_EXPORT;
if (!phrase) {
  console.log('Variable DF_CLE_EXPORT absente de ce terminal : créez-la, puis relancez.');
  process.exit(1);
}
if (phrase.length < LONGUEUR_MIN) {
  console.log(`Phrase de passe trop courte : ${LONGUEUR_MIN} caractères au moins.`);
  process.exit(1);
}

if (process.argv.includes('--dechiffrer')) {
  const texte = fs.readFileSync(CHIFFRE, 'utf8');
  if (!texte.startsWith(ENTETE)) {
    console.log('export-clients.chiffre ne contient pas encore de fichier chiffré : lancez npm run chiffrer.');
    process.exit(1);
  }
  try {
    process.stdout.write(dechiffrer(texte, phrase));
  } catch {
    console.log('Déchiffrement refusé : ce n’est pas la phrase de passe qui a chiffré le fichier.');
    process.exit(1);
  }
  process.exit(0);
}

const clair = fs.readFileSync(CLAIR);
const texte = chiffrer(clair, phrase);
fs.writeFileSync(CHIFFRE, texte);
const controle = dechiffrer(texte, phrase).equals(clair);
const lignes = clair.toString('utf8').trim().split(/\r?\n/).length;
console.log(`Fichier chiffré : exercices/confidentialite/export-clients.chiffre (${ENTETE})`);
console.log(`Lignes chiffrées : ${lignes}`);
console.log(`Contrôle : ${controle ? 'le déchiffrement redonne le fichier d’origine' : 'ÉCHEC, prévenez le formateur'}`);
console.log('Le fichier en clair est inchangé : ne le joignez à aucune demande.');
