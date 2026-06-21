import type { PricePoint } from "../../types/dca";
import { ASSET_AVAILABLE_SINCE, ASSET_TO_BINANCE_SYMBOL, isSupportedAsset } from "../assets";

export type { SupportedAsset } from "../assets";
export { ASSET_AVAILABLE_SINCE, ASSET_TO_BINANCE_SYMBOL } from "../assets";

const BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines";
const MAX_CANDLES_PER_REQUEST = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export class BinanceError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "BinanceError";
    this.status = status;
  }
}

// Format d'une bougie renvoyée par /klines : [openTime, open, high, low, close, volume, closeTime, ...]
type Kline = [number, string, string, string, string, string, number, ...unknown[]];

async function fetchKlinesPage(
  symbol: string,
  startTime: number,
  endTime: number
): Promise<Kline[]> {
  const url =
    `${BINANCE_KLINES_URL}?symbol=${symbol}&interval=1d` +
    `&startTime=${startTime}&endTime=${endTime}&limit=${MAX_CANDLES_PER_REQUEST}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new BinanceError("Impossible de contacter l'API Binance (problème réseau).");
  }

  if (response.status === 429 || response.status === 418) {
    throw new BinanceError(
      "Limite de requêtes Binance atteinte. Réessaie dans une minute.",
      response.status
    );
  }
  if (!response.ok) {
    throw new BinanceError(`Erreur Binance (HTTP ${response.status}).`, response.status);
  }

  return (await response.json()) as Kline[];
}

/**
 * Récupère l'historique de prix de clôture journalier (en EUR) d'un actif sur
 * Binance entre `from` et `to`, et le transforme au format PricePoint[] attendu
 * par calculateDca. Même contrat que l'ancien module CoinGecko qu'il remplace.
 *
 * La plage demandée est recadrée dans la fenêtre réellement disponible :
 * - `to` est ramené à "maintenant" s'il est dans le futur.
 * - `from` est ramené à la date de première cotation EUR de l'actif si la
 *   requête remonte avant son historique disponible (voir ASSET_AVAILABLE_SINCE).
 * Le recadrage de `from` est une information produit importante (l'utilisateur
 * doit savoir que sa plage a été raccourcie) : il n'est donc PAS fait
 * silencieusement ici. C'est la route API qui le détecte en amont (en comparant
 * `from` à ASSET_AVAILABLE_SINCE) et le communique au client via un champ
 * `notice` dédié.
 */
export async function fetchPriceHistory(
  asset: string,
  from: Date,
  to: Date
): Promise<PricePoint[]> {
  if (!isSupportedAsset(asset)) {
    throw new BinanceError(`Actif non supporté: ${asset}`);
  }

  const symbol = ASSET_TO_BINANCE_SYMBOL[asset];
  const availableSince = ASSET_AVAILABLE_SINCE[asset];
  const now = new Date();

  // Plage entièrement future : ce n'est pas un problème de listing de l'actif,
  // donc un message dédié plutôt que de réutiliser celui du recadrage
  // "historique pas encore disponible" ci-dessous. Erreur de saisie utilisateur
  // (4xx), pas un problème amont (Binance n'a simplement pas de prix futurs).
  if (from.getTime() > now.getTime()) {
    throw new BinanceError("La période demandée est dans le futur. Choisissez des dates passées.", 400);
  }

  const effectiveTo = to.getTime() > now.getTime() ? now : to;
  const effectiveFrom = from.getTime() < availableSince.getTime() ? availableSince : from;

  if (effectiveTo.getTime() < effectiveFrom.getTime()) {
    // Plage entièrement antérieure au listing de l'actif : également une
    // erreur de saisie utilisateur (4xx), pas un problème amont.
    throw new BinanceError(
      `Aucune donnée disponible : l'historique EUR de cet actif démarre le ` +
        `${availableSince.toLocaleDateString("fr-FR")}, après la fin de la plage demandée.`,
      400
    );
  }

  const points: PricePoint[] = [];
  let cursor = effectiveFrom.getTime();
  const endMs = effectiveTo.getTime();

  while (cursor <= endMs) {
    const pageEnd = Math.min(cursor + (MAX_CANDLES_PER_REQUEST - 1) * DAY_MS, endMs);
    const klines = await fetchKlinesPage(symbol, cursor, pageEnd);

    if (klines.length === 0) break;

    for (const candle of klines) {
      points.push({ date: new Date(candle[0]), price: parseFloat(candle[4]) });
    }

    cursor = klines[klines.length - 1][0] + DAY_MS;
  }

  if (points.length === 0) {
    throw new BinanceError("Aucune donnée de prix disponible pour cette plage de dates.");
  }

  return points;
}
