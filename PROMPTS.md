# Journal des prompts

Une entrée par demande significative faite à Copilot pendant les TP. Ce journal fait partie du livrable : il montre comment vous avez guidé l’assistant et ce que vous avez corrigé.

| TP | Prompt envoyé (ou résumé fidèle) | Ce que Copilot a produit | Ce que j’ai gardé, corrigé ou refusé, et pourquoi |
|---|---|---|---|
| exemple | « Écris les tests de `calculerLigne` avec node:test, à partir de docs/regles-remises.md, un test par règle et par seuil » | 9 tests, dont un sur le seuil de 10 unités | Gardé. Refusé un test qui vérifiait un prix négatif accepté : la spec le refuse |
| TP1 | « Lis docs/regles-remises.md. Écris dans test/devis/calcul.test.js les tests de src/devis/calcul.js avec node:test et node:assert/strict. Un describe par paragraphe de la spec, un test par seuil, seuils inclus. N’utilise pas le code pour déduire le résultat attendu : calcule-le depuis la spec. » | 24 tests, dont 4 en échec | Gardé tous les tests. Les 4 échecs révèlent deux écarts à la spec : seuil de 10 unités exclu, plafond de 15 % absent |
| TP1 | « Corrige src/devis/calcul.js pour que les tests passent, sans modifier les tests. Explique chaque modification. » | Correction du seuil et ajout du plafond | Gardé le seuil. Réécrit le plafond : la première proposition plafonnait aussi les remises de ligne, la spec ne réduit que la remise grand compte |
| TP2 | « Ajoute la JSDoc de chaque fonction exportée de src/devis/calcul.js : paramètres, retour, exceptions, un @example. Renvoie aux paragraphes de docs/regles-remises.md. » | JSDoc complète | Corrigé l’exemple : le total proposé ignorait les frais de port |
| TP2 | « Rédige un README pour ce dépôt à partir de package.json, src/app.js et src/routes. Sections : présentation, prérequis, installation, points d’entrée, développement, limites connues. » | README structuré | Retiré une section « Déploiement Docker » inventée : il n’y a pas de Dockerfile |
| TP2 | « Résume la PR du TP1 pour un relecteur : contexte, changements, comment vérifier, risques. Base-toi sur git diff main...corrige/tp1. » | Résumé en 4 sections | Ajouté le risque métier : les devis grands comptes déjà émis diffèrent du nouveau calcul |
| ch03 | « Analyse src/legacy/export-commandes.js : liste les code smells, la complexité et la cause de la lenteur. Ne modifie rien. » | 7 problèmes, dont la double boucle commandes × lignes | Gardé le diagnostic. Écarté la proposition de passer en SQL GROUP BY : l’ordre des additions change et le TTC peut différer d’un centime |
| ch03 | « Étape 1 seulement : extrais le formatage des montants dans une fonction formaterMontant, sans rien changer d’autre. » | Fonction extraite | Gardé après npm run test:caracterisation au vert |
| ch03 | « Étape 2 : remplace la recherche des lignes et des clients par des Map construites une fois. Garde le TTC calculé sur le HT non arrondi. » | Map et Set | Gardé : 5 679 ms à 24 ms, tests au vert |
