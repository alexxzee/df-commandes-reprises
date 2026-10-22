// Fichier de la formation : ne pas modifier.
'use strict';

// Proposition d'un assistant pour accélérer trouverDoublons : un seul passage
// sur la liste, avec un ensemble des références déjà vues.

function trouverDoublons(references) {
  const vues = new Set();
  const doublons = new Set();
  for (const reference of references) {
    if (vues.has(reference)) doublons.add(reference);
    vues.add(reference);
  }
  return [...doublons].sort();
}

module.exports = { trouverDoublons };
