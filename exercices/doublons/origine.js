// Fichier de la formation : ne pas modifier.
'use strict';

// Version d'origine de trouverDoublons, en service depuis 2019 : les références
// présentes plus d'une fois dans la liste, chacune une seule fois, triées.

function trouverDoublons(references) {
  const doublons = [];
  for (let i = 0; i < references.length; i++) {
    for (let j = i + 1; j < references.length; j++) {
      if (references[i] === references[j] && !doublons.includes(references[i])) {
        doublons.push(references[i]);
      }
    }
  }
  return doublons.sort();
}

module.exports = { trouverDoublons };
