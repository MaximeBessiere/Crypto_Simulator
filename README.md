# Simulateur Crypto — Test technique S'investir

## Présentation

Simulateur d'investissement en cryptomonnaie : il calcule la performance d'un investissement en une seule fois ou récurrent (DCA) à partir de données de marché historiques réelles. L'interface reprend le design des simulateurs S'investir.

## Démo en ligne

https://crypto-simulator-two.vercel.app

## Stack

- Next.js 16 + TypeScript
- Tailwind CSS v4
- Recharts (graphe d'évolution)
- Déploiement Vercel
- Source de données : API Binance (`/api/v3/klines`)

## Lancer le projet en local

Node.js 20.9 ou supérieur est requis (version minimale imposée par Next.js 16).

Installation et lancement en développement :

```bash
npm install
npm run dev
```

L'application est accessible sur http://localhost:3000.

Build de production :

```bash
npm run build
npm run start
```

Aucune variable d'environnement n'est nécessaire. La source de données (Binance) est publique et ne requiert pas de clé d'API.

## Architecture

Le projet sépare trois responsabilités, pour que chacune reste testable et remplaçable indépendamment des autres :

- la logique de calcul : une fonction pure, sans dépendance à React ni au réseau, qui reçoit un historique de prix en paramètre et retourne le résultat ;
- l'accès aux données : un module isolé qui encapsule l'appel à l'API de marché, derrière une interface stable ;
- l'interface utilisateur : les composants React, qui ne connaissent ni le détail du calcul ni celui de la source de données.

```
src/
  lib/
    dca/calculate.ts       logique de calcul DCA (fonction pure)
    api/binance.ts          accès aux données (seul module qui appelle Binance)
    assets.ts                métadonnées des actifs (labels, symboles, historique disponible)
    format.ts                 formatage des nombres (euros, quantités, pourcentages)
  app/
    api/price-history/      route serveur Next.js, proxy vers Binance
    page.tsx                  page d'accueil
  components/
    simulator/
      Simulator.tsx           orchestration (état, requêtes, debounce)
      InputForm.tsx            formulaire de saisie
      ResultsCards.tsx          cartes de résultats
      PortfolioChart.tsx        graphe d'évolution
    PageHeader.tsx             en-tête de la page
  types/dca.ts                types partagés entre les couches
```

Le composant `<Simulator />` est autonome : il ne dépend que de la route `/api/price-history` et peut être intégré ailleurs sans le reste de la page.

## Partis pris techniques

**Stack alignée sur celle de S'investir.** Next.js, TypeScript et Tailwind correspondent à un environnement d'intégration habituel, pour faciliter une éventuelle reprise du code.

**Source de données.** Le développement a démarré avec CoinGecko, choix initial évident pour une API de marché gratuite. Les tests effectués pendant le développement ont montré que le tier gratuit limite désormais l'historique accessible à 365 jours, ce qui ne permettait pas de couvrir une période depuis 2020. Le projet est donc passé à l'API Binance : gratuite, sans clé, avec des paires de cotation en euros natives et un historique disponible depuis 2020 pour les principaux actifs. Grâce à l'isolation du module d'accès aux données, ce changement de fournisseur n'a nécessité de modifier qu'un seul fichier, sans toucher à la logique de calcul ni à l'interface.

**Région de déploiement Vercel.** Binance bloque les requêtes provenant d'adresses IP américaines, alors que les fonctions Vercel s'exécutent par défaut depuis les États-Unis. Le fichier `vercel.json` force l'exécution depuis la région de Francfort.

**Historique réellement disponible par actif.** Chaque actif n'affiche que les données réellement cotées en euros sur Binance, sans reconstruction par conversion d'une autre devise. Solana, par exemple, n'a une paire euro cotée que depuis mai 2021 : demander une période antérieure déclenche un message explicite plutôt qu'un recadrage silencieux ou une donnée approximative.

## Périmètre

Le test couvre : le calcul DCA et investissement unique, les chiffres clés (capital investi, quantité acquise, prix moyen, capital final, performance), le graphe d'évolution du portefeuille, et une interface responsive.

N'ont volontairement pas été traités, comme extensions naturelles au-delà du périmètre d'un test technique : la comparaison de plusieurs actifs sur un même graphe, une vue tableau détaillée des transactions périodiques, et des types de graphiques alternatifs (chandeliers, vue logarithmique).
