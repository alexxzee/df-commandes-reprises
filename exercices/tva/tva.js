// Fichier de l'exercice « la TVA, calculée à la main » : à compléter.
'use strict';

// Trois devis d'un particulier, sur la TVA et les frais de port.
//   npm run tva              lance ces tests sur le code de src/devis/calcul.js
//   npm run tva:couverture   montre les lignes de src/devis/ qu'ils exécutent

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculerDevis } = require('../../src/devis/calcul');

const particulier = { grand_compte: false };

test('une vis à 10 €', () => {
  const devis = calculerDevis(particulier, [{ produit: { reference: 'VIS-M6', prix_ht: 10 }, quantite: 1 }]);
  assert.ok(devis);
});

test('trois raccords à 3,75 €', () => {
  const devis = calculerDevis(particulier, [{ produit: { reference: 'RAC-15', prix_ht: 3.75 }, quantite: 3 }]);
  assert.ok(devis);
});

test('deux pompes à 250 €', () => {
  const devis = calculerDevis(particulier, [{ produit: { reference: 'POM-25', prix_ht: 250 }, quantite: 2 }]);
  assert.ok(devis);
});
