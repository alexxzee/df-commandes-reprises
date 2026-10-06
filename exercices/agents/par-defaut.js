'use strict';

const test = require('node:test'); // le lanceur de tests intégré à Node
const assert = require('node:assert/strict'); // les comparaisons strictes
const { conditionsPaiement } = require('../../src/paiement/conditions'); // la fonction testée

const ordinaire = { grand_compte: false }; // un client ordinaire
const grandCompte = { grand_compte: true }; // un client grand compte

test('petite commande : pas d’acompte, solde à 30 jours', () => {
  const c = conditionsPaiement(ordinaire, 450); // 450 € TTC
  assert.deepEqual(c, { acompte: 0, solde: 450, delaiSoldeJours: 30 }); // tout au solde
});

test('commande de 1 000 € : pas d’acompte', () => {
  const c = conditionsPaiement(ordinaire, 1000); // exactement 1 000 € TTC
  assert.equal(c.acompte, 0); // le code ne demande l'acompte qu'au-delà de 1 000 €
});

test('commande de 2 000 € : acompte de 30 %', () => {
  const c = conditionsPaiement(ordinaire, 2000); // 2 000 € TTC
  assert.equal(c.acompte, 600); // 30 % de 2 000
  assert.equal(c.solde, 1400); // le reste au solde
});

test('grand compte : pas d’acompte, solde à 30 jours', () => {
  const c = conditionsPaiement(grandCompte, 5000); // 5 000 € TTC
  assert.equal(c.acompte, 0); // jamais d'acompte
  assert.equal(c.delaiSoldeJours, 30); // délai lu dans le code
});

test('un total négatif est refusé', () => {
  assert.throws(() => conditionsPaiement(ordinaire, -10)); // montant impossible : erreur
});
