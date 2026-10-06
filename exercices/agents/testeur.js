'use strict';

const test = require('node:test'); // le lanceur de tests intégré à Node
const assert = require('node:assert/strict'); // les comparaisons strictes
const { conditionsPaiement } = require('../../src/paiement/conditions'); // la fonction testée

const ordinaire = { grand_compte: false }; // un client ordinaire
const grandCompte = { grand_compte: true }; // un client grand compte

test('§ 1 : total nul refusé', () => {
  assert.throws(() => conditionsPaiement(ordinaire, 0)); // un total nul est refusé
});

test('§ 2 : 999,99 €, aucun acompte', () => {
  const c = conditionsPaiement(ordinaire, 999.99); // juste sous le seuil
  assert.equal(c.acompte, 0); // pas d'acompte sous 1 000 €
});

test('§ 2 : 1 000 €, acompte de 30 %', () => {
  const c = conditionsPaiement(ordinaire, 1000); // sur le seuil, inclus
  assert.equal(c.acompte, 300); // 30 % de 1 000 €
});

test('§ 3 : grand compte, aucun acompte', () => {
  const c = conditionsPaiement(grandCompte, 5000); // gros montant, grand compte
  assert.equal(c.acompte, 0); // jamais d'acompte pour un grand compte
});

test('§ 4 : grand compte, solde à 45 jours', () => {
  const c = conditionsPaiement(grandCompte, 5000); // même commande
  assert.equal(c.delaiSoldeJours, 45); // 45 jours pour un grand compte
});

test('§ 5 : acompte et solde font le total', () => {
  const c = conditionsPaiement(ordinaire, 1234.57); // montant qui oblige à arrondir
  assert.equal(c.acompte, 370.37); // 30 % de 1 234,57, arrondi au centime
  assert.equal(c.solde, 864.2); // le reste, exactement
});
