'use strict';                                          // mode strict, comme le reste du dépôt

const express = require('express');                    // le routeur d’Express, déjà utilisé par le dépôt

// Ramène un texte à une forme comparable : minuscules, sans accents.
function normaliser(texte) {                           // « Câble » et « cable » deviennent identiques
  return String(texte).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase(); // sépare puis retire les accents
}

module.exports = function routesProduits(db) {        // la route reçoit la base, comme les autres
  const router = express.Router();                    // un routeur pour /produits

  router.get('/', (req, res) => {                     // GET /produits, avec ou sans paramètres
    const { categorie, q } = req.query;               // lit les deux filtres de l’adresse
    let produits = categorie                          // d’abord le filtre de catégorie existant
      ? db.prepare('SELECT * FROM produits WHERE categorie = ? ORDER BY reference').all(categorie)
      : db.prepare('SELECT * FROM produits ORDER BY reference').all();
    if (q) {                                          // une recherche est demandée
      const cherche = normaliser(q);                  // le texte tapé, sans accents ni majuscules
      produits = produits.filter((p) => normaliser(p.libelle).includes(cherche)); // garde les libellés qui le contiennent
    }
    res.json(produits);                               // une liste, vide si rien ne correspond
  });

  router.get('/:reference', (req, res) => {           // la fiche d’un produit, inchangée
    const produit = db.prepare('SELECT * FROM produits WHERE reference = ?').get(req.params.reference);
    if (!produit) return res.status(404).json({ erreur: 'Produit introuvable' }); // référence inconnue
    res.json(produit);                                // le produit trouvé
  });

  return router;                                      // rend le routeur à l’application
};
