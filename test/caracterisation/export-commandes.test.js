// Fichier de la formation : ne pas modifier.
'use strict';

// Tests de caractérisation : ils figent le comportement ACTUEL de l'export,
// bon ou mauvais. Une refactorisation doit les garder au vert sans les modifier.

// Ce fichier teste le module src/legacy/export-commandes.js : l'export CSV des
// commandes que le cabinet comptable lit chaque nuit (séparateur ";", montants
// à la française, une dernière ligne "# clients actifs;N").
// Il sert à deux exercices :
// - ch03, refactorisation de l'export : `npm run test:caracterisation` rejoue ces
//   5 tests après chaque modification ; ils doivent rester verts ;
// - ch07, hook qui dit non : le dossier test/caracterisation est celui que le hook
//   protège ; l'agent est invité à supprimer le test du filtre de date.
// Le fichier export-attendu.csv, à côté, est la sortie de référence du premier test.

const { test } = require('node:test'); // lanceur de tests intégré à Node
const assert = require('node:assert/strict'); // comparaisons strictes (===, égalité profonde)
const fs = require('node:fs');
const path = require('node:path');
const { ouvrirBase, peupler } = require('../../src/db'); // base SQLite en mémoire et jeu de données fictif
const { exporterCommandes } = require('../../src/legacy/export-commandes'); // le code legacy testé

const ATTENDU = fs.readFileSync(path.join(__dirname, 'export-attendu.csv'), 'utf8'); // sortie de référence, enregistrée une fois pour toutes

// L'export legacy rend son résultat par callback (err, csv) : cette fonction
// l'enveloppe dans une promesse pour pouvoir écrire `await exporter(...)`.
function exporter(db, depuis) {
  return new Promise((resolve, reject) => {
    exporterCommandes(db, depuis, (err, csv) => (err ? reject(err) : resolve(csv)));
  });
}

// Vérifie : l'export de toutes les commandes est identique, au caractère près,
// au fichier de référence export-attendu.csv.
// Données : 200 commandes générées avec la graine 42 (toujours les mêmes) et une
// date de départ, 2000-01-01, antérieure à toutes les commandes.
// Attendu : égalité stricte des deux textes. C'est le filet principal : toute
// différence (une ligne, un ordre, un montant, un espace) le fait passer au rouge.
test('l’export complet est identique au fichier de référence', async () => {
  const db = peupler(ouvrirBase(), { commandes: 200, graine: 42 }); // graine fixe : jeu de données reproductible
  assert.equal(await exporter(db, '2000-01-01'), ATTENDU); // comparaison du CSV entier
});

// Vérifie : le paramètre `depuis` écarte les commandes datées avant lui.
// Données : le même jeu de 200 commandes, filtré à partir du 2026-01-01.
// Attendu : au moins une commande exportée, et toutes datées du 2026-01-01 ou après.
// Le défaut attrapé : un filtre perdu ou inversé pendant la refactorisation.
test('le filtre de date exclut les commandes antérieures', async () => {
  const db = peupler(ouvrirBase(), { commandes: 200, graine: 42 }); // même jeu que le test précédent
  const csv = await exporter(db, '2026-01-01');
  const dates = csv.trim().split('\n').slice(1, -1).map((l) => l.split(';')[1]); // retire l'en-tête et la ligne "# clients actifs", garde la 2e colonne (date)
  assert.ok(dates.length > 0); // au moins une date : sur une liste vide, every() serait vrai sans rien prouver
  assert.ok(dates.every((d) => d >= '2026-01-01')); // dates AAAA-MM-JJ : l'ordre alphabétique est l'ordre chronologique
});

// Vérifie : le cas limite de la base vide.
// Données : une base créée sans aucune commande ni client.
// Attendu : seulement la ligne d'en-tête et "# clients actifs;0", chacune
// terminée par un saut de ligne. Le défaut attrapé : une ligne vide en trop,
// un pied de fichier absent, ou une erreur quand il n'y a rien à exporter.
test('une base sans commande produit l’en-tête et zéro client actif', async () => {
  const db = ouvrirBase(); // base vide : le schéma, aucune donnée
  assert.equal(await exporter(db, '2000-01-01'),
    'numero;date;client;ville;nb_lignes;total_ht;total_ttc\n# clients actifs;0\n'); // en-tête + pied, rien d'autre
});

// Vérifie : le format des montants et du nom de client dans le CSV.
// Données : un client dont le nom contient un ";" et une commande livrée de
// 3 unités à 10,10 € HT.
// Attendu : le ";" du nom devient "," (sinon il décalerait les colonnes du CSV),
// et les montants s'écrivent avec une virgule et toujours deux décimales.
test('les montants utilisent la virgule et deux décimales', async () => {
  const db = ouvrirBase();
  db.exec("INSERT INTO clients (nom, ville, grand_compte) VALUES ('Bâtir; et Fils', 'Lyon', 0)"); // nom piégé : contient le séparateur du CSV
  db.exec("INSERT INTO produits (reference, libelle, categorie, prix_ht) VALUES ('X', 'X', 'x', 10.1)");
  db.exec("INSERT INTO commandes (client_id, date, statut) VALUES (1, '2026-01-05', 'livree')");
  db.exec('INSERT INTO lignes_commande (commande_id, produit_id, quantite, prix_unitaire) VALUES (1, 1, 3, 10.1)'); // 3 x 10,1 = 30,3 : une seule décimale, que l'export doit compléter
  assert.equal(await exporter(db, '2000-01-01'),
    'numero;date;client;ville;nb_lignes;total_ht;total_ttc\n'
    + '1;2026-01-05;Bâtir, et Fils;Lyon;1;30,30;36,36\n# clients actifs;1\n'); // "30,30" et non "30,3" ; "Bâtir, et Fils" sans ";"
});

// Vérifie : une commande au statut "annulee" est ignorée par l'export.
// Données : un client et une seule commande, annulée, de 2 unités à 5 €.
// Attendu : la même sortie qu'une base vide : aucune ligne de commande, et le
// client n'est pas compté comme actif. Le défaut attrapé : un filtre de statut
// oublié, ou un client compté actif avant que la commande soit écartée.
test('une commande annulée n’apparaît pas et ne compte pas comme client actif', async () => {
  const db = ouvrirBase();
  db.exec("INSERT INTO clients (nom, ville, grand_compte) VALUES ('A', 'Lyon', 0)");
  db.exec("INSERT INTO produits (reference, libelle, categorie, prix_ht) VALUES ('X', 'X', 'x', 5)");
  db.exec("INSERT INTO commandes (client_id, date, statut) VALUES (1, '2026-01-05', 'annulee')"); // seule commande de la base, annulée
  db.exec('INSERT INTO lignes_commande (commande_id, produit_id, quantite, prix_unitaire) VALUES (1, 1, 2, 5)');
  assert.equal(await exporter(db, '2000-01-01'),
    'numero;date;client;ville;nb_lignes;total_ht;total_ttc\n# clients actifs;0\n'); // identique à la base vide
});
