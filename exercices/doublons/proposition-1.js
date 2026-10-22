// Fichier de la formation : ne pas modifier.
'use strict';

// Proposition d'un assistant pour accélérer trouverDoublons : un seul passage
// sur la liste, avec un compteur par référence.

function trouverDoublons(references) {
  const compteurs = new Map();
  for (const reference of references) {
    compteurs.set(reference, (compteurs.get(reference) || 0) + 1);
  }
  const doublons = [];
  for (const [reference, nombre] of compteurs) {
    if (nombre === 2) doublons.push(reference);
  }
  return doublons.sort();
}

module.exports = { trouverDoublons };
