'use strict';

// Tests écrits depuis docs/regles-remises.md, pas depuis le code :
// chaque test cite la règle qu'il vérifie.

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const { calculerDevis, calculerLigne, tauxRemiseQuantite, arrondir } = require('../../src/devis/calcul');

const vis = { reference: 'VIS', prix_ht: 10 };
const client = { grand_compte: 0 };
const grandCompte = { grand_compte: 1 };

describe('§ 1. Prix d’une ligne', () => {
  test('le brut est le prix unitaire multiplié par la quantité', () => {
    assert.equal(calculerLigne(vis, 3).brut, 30);
  });

  for (const quantite of [0, -1, 2.5, '3', null]) {
    test(`la quantité ${JSON.stringify(quantite)} est refusée`, () => {
      assert.throws(() => calculerLigne(vis, quantite), /Quantité invalide/);
    });
  }
});

describe('§ 2. Remise sur quantité, seuils inclus', () => {
  const cas = [[1, 0], [9, 0], [10, 0.05], [49, 0.05], [50, 0.08], [99, 0.08], [100, 0.12], [500, 0.12]];
  for (const [quantite, taux] of cas) {
    test(`${quantite} unités donnent ${taux * 100} %`, () => {
      assert.equal(tauxRemiseQuantite(quantite), taux);
    });
  }

  test('une ligne de 10 unités à 10 € coûte 95 € net', () => {
    const ligne = calculerLigne(vis, 10);
    assert.deepEqual([ligne.brut, ligne.remise, ligne.net], [100, 5, 95]);
  });
});

describe('§ 3. Remise grand compte', () => {
  test('5 % supplémentaires sur le total après remises de ligne', () => {
    const devis = calculerDevis(grandCompte, [{ produit: vis, quantite: 60 }]);
    // 600 brut, 8 % de remise ligne = 552, puis 5 % = 27,60
    assert.equal(devis.remiseClient, 27.6);
    assert.equal(devis.totalHT, 524.4);
  });

  test('un client ordinaire n’a pas de remise grand compte', () => {
    assert.equal(calculerDevis(client, [{ produit: vis, quantite: 60 }]).remiseClient, 0);
  });
});

describe('§ 4. Plafond de remise à 15 % du brut', () => {
  test('la remise grand compte est réduite pour respecter le plafond', () => {
    const devis = calculerDevis(grandCompte, [{ produit: vis, quantite: 100 }]);
    // 1000 brut, 12 % ligne = 120, plafond 150 : la remise client est ramenée à 30
    assert.equal(devis.remiseClient, 30);
    assert.equal(devis.totalHT, 850);
  });

  test('sous le plafond, la remise grand compte est entière', () => {
    const devis = calculerDevis(grandCompte, [{ produit: vis, quantite: 10 }]);
    // 100 brut, 5 net de remise ligne, 95 * 5 % = 4,75 ; total remises 9,75 < 15
    assert.equal(devis.remiseClient, 4.75);
  });
});

describe('§ 5. Frais de port', () => {
  test('25 € sous 500 € HT remisé', () => {
    assert.equal(calculerDevis(client, [{ produit: vis, quantite: 49 }]).port, 25);
  });

  test('offerts à exactement 500 € HT remisé', () => {
    const devis = calculerDevis(client, [{ produit: { reference: 'P', prix_ht: 500 }, quantite: 1 }]);
    assert.equal(devis.port, 0);
    assert.equal(devis.totalHT, 500);
  });

  test('le port entre dans la base de TVA', () => {
    const devis = calculerDevis(client, [{ produit: vis, quantite: 1 }]);
    assert.deepEqual([devis.totalHT, devis.tva, devis.totalTTC], [35, 7, 42]);
  });
});

describe('§ 6. TVA et arrondis', () => {
  test('la TVA se calcule sur le HT arrondi', () => {
    const devis = calculerDevis(client, [{ produit: { reference: 'R', prix_ht: 3.75 }, quantite: 3 }]);
    // 11,25 + 25 de port = 36,25 HT ; TVA 7,25 ; TTC 43,50
    assert.deepEqual([devis.totalHT, devis.tva, devis.totalTTC], [36.25, 7.25, 43.5]);
  });

  test('arrondir conserve deux décimales', () => {
    assert.equal(arrondir(1.005 * 1000), 1005);
    assert.equal(arrondir(2.344), 2.34);
    assert.equal(arrondir(2.346), 2.35);
  });
});

describe('§ 7. Devis vide', () => {
  test('un devis sans ligne est refusé', () => {
    assert.throws(() => calculerDevis(client, []), /au moins une ligne/);
  });
});
