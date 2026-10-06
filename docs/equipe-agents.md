# Équipe d’agents : constats

## Sessions parallèles

| Dossier | Ligne ajoutée que montre git diff README.md |
|---|---|
| df-commandes | +Page des devis du jour : GET /devis/du-jour (session A) |
| df-commandes-essai | +Essai de session parallèle (session B) |

## Orchestration

| Sous-agent | Première phrase de la consigne reçue | Une information de la demande absente de sa consigne |
|---|---|---|
| dev-web | Ajoute dans src/routes/devis.js une route GET /devis/du-jour qui renvoie une page HTML… | Le besoin de Marc : consulter la page chaque soir |
| testeur-web | Écris dans test/devis/du-jour.test.js des tests node:test pour GET /devis/du-jour… | Aucune nouvelle dépendance npm |
| relecteur-web | Relis la route GET /devis/du-jour de src/routes/devis.js. | Le texte exact « Aucun devis aujourd’hui » |

Coût relevé : Copilot app, /usage de 3 % à 4 %.
