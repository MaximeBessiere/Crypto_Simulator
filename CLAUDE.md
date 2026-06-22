@AGENTS.md

# Simulateur Crypto DCA — état du projet

Simulateur d'investissement crypto en Dollar Cost Averaging (DCA), test technique
pour une candidature de dev freelance IA. Design "S'investir" (dark premium
finance). Déployé sur Vercel.

## Stack

- Next.js 16 (App Router) + TypeScript, Tailwind CSS v4 (tokens définis via
  `@theme` dans `src/app/globals.css`, pas de `tailwind.config.js`).
- Police Inter (`next/font/google`).
- Recharts (v3 — API différente de v2/des connaissances d'entraînement, voir
  note ci-dessous) pour le graphe d'évolution.
- Aucune base de données / aucun state serveur : tout est calculé à la volée.

## Architecture — modules isolés + contrat d'interface

Le principe directeur du projet : la logique de calcul DCA ne doit **jamais**
être modifiée pour s'adapter à une source de données, et la source de données
doit être remplaçable sans toucher au calcul.

- `src/lib/dca/calculate.ts` — `calculateDca()`, fonction pure, zéro dépendance
  React/réseau. Reçoit `priceHistory: PricePoint[]` en paramètre ; ne sait pas
  d'où viennent les prix. Trouve le prix le plus proche de chaque date
  d'investissement (`findClosestPrice`), gère les fréquences once/daily/weekly/
  monthly (`addMonthsClamped` évite le bug de `setMonth` en fin de mois).
- `src/lib/api/binance.ts` — seul module qui parle réseau. Contrat :
  `fetchPriceHistory(asset, from, to): Promise<PricePoint[]>`. Ce contrat est
  celui qu'avait l'ancien module CoinGecko (remplacé, voir décisions ci-dessous)
  — toute nouvelle source doit le respecter pour ne rien casser en aval.
- `src/lib/assets.ts` — métadonnées des actifs (labels, symboles, mapping
  Binance, dates de disponibilité). Volontairement **sans** logique réseau,
  pour être importable côté client (`Simulator.tsx`) sans embarquer tout
  `binance.ts` dans le bundle navigateur.
- `src/app/api/price-history/route.ts` — route serveur Next.js qui appelle
  `binance.ts` et renvoie `{ prices, notice? }` / `{ error }`. Le client
  (`Simulator.tsx`) ne parle jamais directement à Binance.
- `src/components/simulator/` — `Simulator.tsx` (orchestration + state),
  `InputForm.tsx` (formulaire), `ResultsCards.tsx` (cartes de résultats),
  `PortfolioChart.tsx` (graphe, consomme directement `result.timeSeries`,
  zéro transformation côté calcul), `InfoTooltip.tsx` (bulle d'info partagée).
  `<Simulator />` est autonome/embarquable (peu de dépendances, pas de contexte
  global requis).

## Décisions clés (à ne pas redécouvrir)

- **Source de données : Binance `/api/v3/klines`, pas CoinGecko.** CoinGecko
  gratuit limite désormais l'historique à 365 jours (vérifié en direct, pas
  une supposition) — incompatible avec l'objectif "historique 2020→2026".
  CryptoCompare/CoinDesk exige une clé, Coinpaprika limite aussi à 365j,
  CoinCap a fermé son API gratuite. Binance : gratuit, sans clé, paires EUR
  natives, historique réel depuis janvier 2020 pour BTC/ETH.
- **Solana : historique EUR disponible seulement depuis le 28/05/2021** (date
  de listing de la paire SOLEUR sur Binance, vérifiée en direct). Ce n'est pas
  un bug : si l'utilisateur demande une période antérieure, l'API renvoie un
  champ `notice` explicite et `Simulator.tsx` recadre `startDate` côté calcul
  (sinon `totalInvested` serait faussé par des dates antérieures à toute
  donnée réelle). Dates de référence dans `ASSET_AVAILABLE_SINCE`
  (`src/lib/assets.ts`) : BTC/ETH 03/01/2020, ADA 13/11/2020, SOL 28/05/2021.
- **Région Vercel forcée à `fra1`** (`vercel.json`, clé `regions`). Binance
  bloque les IP US ; Vercel exécute les fonctions Node.js en `iad1` (Washington)
  par défaut. Attention : `export const preferredRegion` dans une route Next.js
  ne fonctionne **que** pour le runtime Edge — ne pas réintroduire ce piège.
- **Auto-recalcul avec debounce (500ms), pas de bouton "Calculer".** Choix
  délibéré : simulateur de lecture pure, pas de soumission destructive, donc
  pas besoin de l'étape supplémentaire d'un bouton.
- **Formatage crypto adaptatif** (`src/lib/format.ts`, `formatCrypto`) : le
  nombre de décimales et le passage en notation compacte (`16,88 Md ADA`)
  dépendent de l'ordre de grandeur de la quantité — sans ça, certains actifs
  (ADA notamment) produisent des nombres qui débordent des cartes.
- Pas de clé API nécessaire nulle part (Binance public + Vercel route serveur
  uniquement pour contourner CORS/rate-limit/géoblocage, pas pour cacher une clé).
- **Recharts v3, pas v2** : `Tooltip`'s `content` prop attend une fonction
  `(props: TooltipContentProps) => ReactNode`, pas un `<Tooltip content={<X/>} />`
  avec `TooltipProps` (qui n'a plus `payload`/`label`/`active` — déplacés dans
  `TooltipContentProps`). Vérifié dans `node_modules/recharts/types/component/
  Tooltip.d.ts` avant d'écrire `PortfolioChart.tsx`, pas supposé.
- **`ResponsiveContainer` warning "width(-1) height(-1)" au montage** : son
  état interne démarre à `{ width: -1, height: -1 }` et n'est corrigé qu'après
  le premier callback `ResizeObserver` (donc après le rendu initial) — il
  prévient donc à chaque montage par défaut, même avec un conteneur de taille
  fixe. Corrigé en passant `initialDimension={{ width: -1, height: <hauteur
  connue> }}` (une seule dimension positive suffit à supprimer le warning,
  voir `node_modules/recharts/es6/component/ResponsiveContainer.js`). Si la
  hauteur du conteneur du graphe change (`h-80 p-6` dans `PortfolioChart.tsx`),
  mettre à jour la valeur `272` en conséquence (hauteur du conteneur − padding).

## Scripts de vérification (pas des tests automatisés)

`scripts/dca-demo.ts` et `scripts/binance-demo.ts` : scripts manuels
(`npx tsx scripts/...`) utilisés pour valider les calculs avec de vraies
données pendant le développement. Pas de suite de tests unitaires pour
l'instant.

## Environnement local (spécifique à cette machine)

- Un pare-feu/EDR local fait de l'inspection TLS : `npm`/`npx` ont besoin de
  `NODE_OPTIONS=--use-system-ca`, et `git` a besoin de
  `http.sslBackend=schannel` (déjà configuré globalement).
- `node`/`npm` ne sont pas dans le PATH par défaut dans les nouveaux shells :
  toujours préfixer avec
  `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`
  en PowerShell avant `npm`/`npx`.
- Pas de `chromium-cli` installé. **Playwright est installé en devDependency
  pour les vérifications visuelles — ne pas réinstaller à chaque session.**
  Les navigateurs (`npx playwright install chromium`) sont aussi déjà
  installés sur cette machine. Pour une vérification : écrire un script
  jetable dans `scripts/` (ex. `scripts/visual-check.ts`), l'exécuter avec
  `npx tsx scripts/visual-check.ts`, puis supprimer uniquement le script et
  les captures après usage — ne pas toucher à la dépendance `playwright` elle-même.

## Reste à faire

- **Polish** : bulle d'info sur le champ "Actif numérique" peut légèrement
  dépasser à gauche sur très petit viewport (bug mineur connu, pas corrigé).
  Pas de tests unitaires automatisés sur `calculateDca`/`binance.ts`.

## Déjà fait (ne pas recommencer)

- Étape 4 — graphe `PortfolioChart.tsx` (AreaChart Recharts, deux séries,
  axes/tooltip/légende stylés dark, géré le cas "une seule fois" = 1 point).
- Bulles d'info sur les labels du formulaire **et** sur les 4 cartes de
  résultats (Capital final, Performance, Acquis, Prix moyen d'acquisition).
- Notice (recadrage de plage par actif) déplacée sous le champ "Depuis",
  visuellement distincte d'une vraie erreur (rouge, masque les cartes).
- Plage de dates future : message dédié ("La période demandée est dans le
  futur...") avec status HTTP 400 plutôt que 502 (`BinanceError` porte le
  status explicitement, voir `src/lib/api/binance.ts`).
- Bug de skeleton de chargement bloqué : les branches de validation précoce
  de `Simulator.tsx` (montant/dates invalides) remettent maintenant
  `isLoading` à `false` avant leur `return`.
- Alignement de la carte "Performance" sur mobile (elle centrait sa valeur
  horizontalement alors que les autres cartes sont alignées à gauche).
- `README.md` réécrit pour l'équipe S'investir (présentation, démo, stack,
  lancement local, architecture, partis pris techniques, périmètre assumé).
  Ne pas revenir au contenu généré par `create-next-app`.
