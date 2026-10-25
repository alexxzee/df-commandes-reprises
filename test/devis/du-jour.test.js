'use strict'; // mode strict, comme le reste du projet

// Ce fichier teste la route GET /devis/du-jour (src/routes/devis.js) : une page
// HTML qui liste les devis datés du jour, avec le nom du client et le total TTC.
// C'est le corrigé de l'équipe d'agents du ch08 : l'agent dev-web écrit la route,
// puis l'agent testeur-web écrit ces tests et lance npm test. Les tests passent par HTTP :
// ils démarrent la vraie application sur un port libre et lisent la page.
// Les trois tests couvrent les trois exigences de la demande : la liste et le
// format du montant, l'exclusion des autres jours avec le message de liste vide,
// et l'échappement HTML du nom de client.

const { test } = require('node:test'); // lanceur de tests intégré à Node
const assert = require('node:assert/strict'); // vérifications strictes
const { ouvrirBase, peupler } = require('../../src/db'); // base SQLite en mémoire, données fictives
const { creerApp } = require('../../src/app'); // l'application Express, sans la démarrer

async function lirePage(db) { // démarre l'appli, lit la page, arrête l'appli
  const serveur = creerApp(db).listen(0); // port 0 : le système choisit un port libre
  await new Promise((resolve) => serveur.once('listening', resolve)); // attend que le serveur écoute
  try {
    const reponse = await fetch(`http://127.0.0.1:${serveur.address().port}/devis/du-jour`); // appelle la route
    return { statut: reponse.status, type: reponse.headers.get('content-type'), html: await reponse.text() }; // ce qu'on vérifie
  } finally {
    serveur.close(); // arrête le serveur même si l'appel échoue
  }
}

function ajouterDevis(db, clientId, date, totalTTC) { // insère un devis à la date voulue
  db.prepare('INSERT INTO devis (client_id, date, total_ht, total_ttc, detail) VALUES (?, ?, ?, ?, ?)') // requête paramétrée
    .run(clientId, date, totalTTC / 1.2, totalTTC, '{}'); // HT déduit du TTC, détail vide
}

const aujourdhui = new Date().toISOString().slice(0, 10); // date du jour, au format de la base

// Vérifie : un devis du jour apparaît sur la page, avec son total TTC.
// Données : 5 commandes générées (pour avoir des clients) et un devis du jour
// à 120 € TTC pour le client 1.
// Attendu : statut 200, type text/html, et "120,00" dans la page (montant à la
// française : virgule et deux décimales). Le défaut attrapé : une route absente
// (404), une réponse JSON, ou un montant affiché "120".
test('la page liste les devis du jour avec leur total TTC', async () => {
  const db = peupler(ouvrirBase(), { commandes: 5 }); // petite base de test
  ajouterDevis(db, 1, aujourdhui, 120); // un devis du jour à 120 € TTC
  const page = await lirePage(db); // lit la page
  assert.equal(page.statut, 200); // la route existe
  assert.match(page.type, /text\/html/); // elle renvoie du HTML
  assert.match(page.html, /120,00/); // le total TTC est affiché à la française
});

// Vérifie : un devis d'un autre jour n'est pas listé, et la page vide le dit.
// Données : un seul devis, daté du 2020-01-15, à 99 € TTC.
// Attendu : pas de "99,00" dans la page, et le message de liste vide
// (avec l'apostrophe typographique, comme dans la route).
// Le défaut attrapé : une route qui liste tous les devis sans filtrer la date,
// ou une page vide sans message.
test('un devis de la veille n’apparaît pas', async () => {
  const db = peupler(ouvrirBase(), { commandes: 5 }); // base sans devis du jour
  ajouterDevis(db, 2, '2020-01-15', 99); // un devis d'une autre date
  const page = await lirePage(db); // lit la page
  assert.doesNotMatch(page.html, /99,00/); // l'ancien devis n'est pas listé
  assert.match(page.html, /Aucun devis aujourd’hui/); // et la page le dit
});

// Vérifie : le nom du client est échappé avant d'être inséré dans le HTML.
// Données : le client 1 renommé "A <b>B</b>", et un devis du jour à son nom.
// Attendu : la page contient "A &lt;b&gt;B&lt;/b&gt;", c'est-à-dire le texte
// affiché tel quel. Le défaut attrapé : une injection HTML (XSS), si le nom
// était collé sans échappement dans la page.
test('un nom de client est échappé dans le HTML', async () => {
  const db = peupler(ouvrirBase(), { commandes: 5 }); // petite base de test
  db.prepare("UPDATE clients SET nom = 'A <b>B</b>' WHERE id = 1").run(); // nom qui contient du HTML
  ajouterDevis(db, 1, aujourdhui, 10); // un devis du jour pour ce client
  const page = await lirePage(db); // lit la page
  assert.match(page.html, /A &lt;b&gt;B&lt;\/b&gt;/); // le nom est affiché, pas interprété
});
