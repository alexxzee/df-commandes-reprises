'use strict';                                          // mode strict

const test = require('node:test');                     // le lanceur de tests intégré à Node
const assert = require('node:assert');                 // les vérifications
const { ouvrirBase, peupler } = require('../../src/db'); // une base en mémoire, données fictives
const { creerApp } = require('../../src/app');         // l’application, sans la démarrer sur 3000

async function chercher(url) {                         // interroge l’application et rend les références
  const serveur = creerApp(peupler(ouvrirBase(), { commandes: 1 })).listen(0); // port libre choisi par le système
  await new Promise((ok) => serveur.once('listening', ok)); // attend que le serveur écoute
  const reponse = await fetch(`http://127.0.0.1:${serveur.address().port}${url}`); // appelle l’adresse
  const produits = await reponse.json();               // lit la liste JSON
  serveur.close();                                     // arrête le serveur
  return produits.map((p) => p.reference);             // garde les références, plus lisibles
}

test('la recherche ignore les accents', async () => {  // le cas qui manque le plus souvent
  assert.deepStrictEqual(await chercher('/produits?q=cable'), ['CABLE-R2V-3G25']);
});

test('sans résultat, une liste vide', async () => {    // aucun produit ne contient zzz
  assert.deepStrictEqual(await chercher('/produits?q=zzz'), []);
});
