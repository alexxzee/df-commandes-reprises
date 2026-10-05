# Journal des prompts

Une entrée par demande significative faite à Copilot pendant les exercices : ce que vous avez demandé, ce que l’assistant a produit, ce que vous en avez fait.

| Exercice | Prompt envoyé (ou résumé fidèle) | Ce que Copilot a produit | Ce que j’ai gardé, corrigé ou refusé, et pourquoi |
|---|---|---|---|
| exemple | « Écris formaterDate(date) qui renvoie une date au format JJ/MM/AAAA, avec node:test pour une date valide et une date absente » | La fonction et deux tests | Gardé la fonction. Refusé le test de la date absente, qui attendait une chaîne vide : notre convention est de lever une erreur |
| TP1 | « Lis docs/regles-remises.md. Écris dans test/devis/calcul.test.js les tests de src/devis/calcul.js avec node:test et node:assert/strict. Un describe par paragraphe de la spec, un test par seuil, seuils inclus. N’utilise pas le code pour déduire le résultat attendu : calcule-le depuis la spec. » | 24 tests, dont 4 en échec | Gardé tous les tests. Les 4 échecs révèlent deux écarts à la spec : seuil de 10 unités exclu, plafond de 15 % absent |
| TP1 | « Corrige src/devis/calcul.js pour que les tests passent, sans modifier les tests. Explique chaque modification. » | Correction du seuil et ajout du plafond | Gardé le seuil. Réécrit le plafond : la première proposition plafonnait aussi les remises de ligne, la spec ne réduit que la remise grand compte |
