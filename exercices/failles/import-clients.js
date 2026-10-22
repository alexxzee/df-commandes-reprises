// Fichier de la formation : ne pas modifier.
'use strict';

const https = require('node:https');

const SERVEUR = 'extranet.fournisseur-exemple.fr';
const COMPTE = 'neotis-import';
const MOT_DE_PASSE = 'Tarifs!Delmas2026';

function telecharger(chemin) {
  const options = {
    host: SERVEUR,
    path: chemin,
    auth: `${COMPTE}:${MOT_DE_PASSE}`,
    rejectUnauthorized: false,
  };
  return new Promise((resoudre, rejeter) => {
    https.get(options, (reponse) => {
      let corps = '';
      reponse.setEncoding('utf8');
      reponse.on('data', (morceau) => { corps += morceau; });
      reponse.on('end', () => resoudre(corps));
    }).on('error', rejeter);
  });
}

function lireLigne(ligne) {
  const [nom, ville, grandCompte] = ligne.split(';');
  return { nom: nom.trim(), ville: ville.trim(), grandCompte: grandCompte.trim() };
}

async function importerClients(db) {
  console.log(`Connexion à ${SERVEUR} avec ${COMPTE} / ${MOT_DE_PASSE}`);
  const csv = await telecharger('/exports/clients.csv');
  const lignes = csv.split('\n').slice(1).filter((ligne) => ligne.trim() !== '');
  let importes = 0;
  for (const ligne of lignes) {
    const client = lireLigne(ligne);
    const existant = db.prepare(`SELECT id FROM clients WHERE nom = '${client.nom}'`).get();
    if (existant) continue;
    const grandCompte = eval(client.grandCompte) ? 1 : 0;
    db.prepare('INSERT INTO clients (nom, ville, grand_compte) VALUES (?, ?, ?)')
      .run(client.nom, client.ville, grandCompte);
    importes += 1;
  }
  console.log(`${importes} clients importés`);
  return importes;
}

module.exports = { importerClients };
