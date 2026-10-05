# Utiliser ce dépôt pendant la formation

Fichier de la formation : ne pas modifier.

## Installation, une fois

Dans un terminal, depuis le dossier où vous rangez vos projets :

```bash
git clone https://github.com/alexxzee/df-commandes
git clone https://github.com/alexxzee/df-verifications
cd df-commandes
npm install
```

Les deux dossiers doivent être **côte à côte**. Ouvrez ensuite **seulement** `df-commandes` dans VS Code (**Fichier**, **Ouvrir le dossier**). `df-verifications` contient les vérificateurs des exercices : les commandes ci-dessous l’appellent, vous n’avez pas à l’ouvrir.

## Commandes de vérification

| Commande | Ce qu’elle vérifie |
|---|---|
| `npm test` | tous les tests du dossier `test/` |
| `npm run lint` | la qualité du code (ESLint) |
| `npm run arrondi` | `arrondirAuCentime`, dans `src/utils/arrondi.js` |
| `npm run arrondi:appli` | `arrondir`, dans `src/devis/calcul.js` |
| `npm run prix` | `formaterPrix`, dans `src/utils/format.js` |
| `npm run reference` | la fonction exportée par `src/validation/reference.js` |
| `npm run test:caracterisation` | le comportement de l’export comptable |
| `npm run bench` | le temps de l’export comptable |

## Fichiers à remplir pendant les exercices

Ils existent déjà, vides : ouvrez-les et remplissez-les, sans créer de dossier ni de fichier. Chacun commence par la ligne « À compléter pendant l’exercice », que vous pouvez effacer.

## Fichiers à ne pas modifier

Les fichiers qui commencent par le commentaire « Fichier de la formation : ne pas modifier. », ainsi que `package.json`, `package-lock.json` et `test/caracterisation/export-attendu.csv`, qui ne peuvent pas porter de commentaire.
