'use strict';

const express = require('express');
const { calculerDevis } = require('../devis/calcul');

const ENTITES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }; // caractères spéciaux du HTML et leur forme sûre

function echapperHtml(texte) { // rend un texte sûr à insérer dans une page
  return String(texte).replace(/[&<>"']/g, (c) => ENTITES[c]); // un nom de client s'affiche tel quel, jamais interprété
}

function formaterEuros(montant) { // montant au format français, deux décimales
  return montant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; // 1 234,50 €
}

/**
 * Routes /devis : création et consultation des devis.
 * POST /devis      corps { clientId, lignes: [{ reference, quantite }] }, renvoie 201 et le devis calculé
 * GET  /devis/du-jour  page HTML des devis du jour
 * GET  /devis/:id  un devis enregistré
 * Erreurs : 400 (lignes invalides, quantité invalide, devis vide), 404 (client ou produit inconnu).
 * @param {import('node:sqlite').DatabaseSync} db Base ouverte.
 * @returns {import('express').Router}
 */
module.exports = function routesDevis(db) {
  const router = express.Router();

  router.post('/', (req, res) => {
    const { clientId, lignes } = req.body || {};
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(Number(clientId));
    if (!client) return res.status(404).json({ erreur: 'Client introuvable' });
    if (!Array.isArray(lignes)) return res.status(400).json({ erreur: 'lignes doit être une liste' });

    const lignesProduits = [];
    for (const ligne of lignes) {
      const produit = db.prepare('SELECT * FROM produits WHERE reference = ?').get(String(ligne.reference));
      if (!produit) return res.status(404).json({ erreur: `Produit introuvable : ${ligne.reference}` });
      lignesProduits.push({ produit, quantite: ligne.quantite });
    }

    let devis;
    try {
      devis = calculerDevis(client, lignesProduits);
    } catch (e) {
      return res.status(400).json({ erreur: e.message });
    }

    const date = new Date().toISOString().slice(0, 10);
    const { lastInsertRowid } = db
      .prepare('INSERT INTO devis (client_id, date, total_ht, total_ttc, detail) VALUES (?, ?, ?, ?, ?)')
      .run(client.id, date, devis.totalHT, devis.totalTTC, JSON.stringify(devis));
    res.status(201).json({ id: Number(lastInsertRowid), clientId: client.id, date, ...devis });
  });

  router.get('/du-jour', (req, res) => { // déclarée avant /:id, sinon « du-jour » est pris pour un numéro
    const jour = new Date().toISOString().slice(0, 10); // même format que la date enregistrée par POST /devis
    const devis = db
      .prepare(`SELECT devis.id, clients.nom, devis.total_ttc FROM devis
        JOIN clients ON clients.id = devis.client_id WHERE devis.date = ? ORDER BY devis.id`) // devis du jour et nom du client
      .all(jour); // la date passe en paramètre, jamais collée dans le SQL
    const lignes = devis
      .map((d) => `<tr><td>${d.id}</td><td>${echapperHtml(d.nom)}</td><td>${formaterEuros(d.total_ttc)}</td></tr>`) // une ligne par devis
      .join('\n'); // lignes du tableau, l'une sous l'autre
    const contenu = devis.length === 0
      ? '<p>Aucun devis aujourd’hui</p>' // message demandé quand la liste est vide
      : `<table>\n<tr><th>Devis</th><th>Client</th><th>Total TTC</th></tr>\n${lignes}\n</table>`; // tableau avec en-tête
    res.type('html').send(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>Devis du jour</title></head>
<body><h1>Devis du ${jour}</h1>
${contenu}
</body></html>`); // page complète, servie en text/html
  });

  router.get('/:id', (req, res) => {
    const ligne = db.prepare('SELECT * FROM devis WHERE id = ?').get(Number(req.params.id));
    if (!ligne) return res.status(404).json({ erreur: 'Devis introuvable' });
    res.json({ id: ligne.id, clientId: ligne.client_id, date: ligne.date, ...JSON.parse(ligne.detail) });
  });

  return router;
};
