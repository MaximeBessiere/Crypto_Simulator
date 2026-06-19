export type SupportedAsset = "bitcoin" | "ethereum" | "solana" | "cardano";

export interface AssetOption {
  value: SupportedAsset;
  label: string;
  symbol: string;
}

export const ASSET_OPTIONS: AssetOption[] = [
  { value: "bitcoin", label: "Bitcoin", symbol: "BTC" },
  { value: "ethereum", label: "Ethereum", symbol: "ETH" },
  { value: "solana", label: "Solana", symbol: "SOL" },
  { value: "cardano", label: "Cardano", symbol: "ADA" },
];

export const ASSET_TO_BINANCE_SYMBOL: Record<SupportedAsset, string> = {
  bitcoin: "BTCEUR",
  ethereum: "ETHEUR",
  cardano: "ADAEUR",
  solana: "SOLEUR",
};

// Date de la première bougie EUR réellement disponible sur Binance pour chaque
// actif (vérifié en direct le 2026-06-19 via /api/v3/klines). En-deçà de ces
// dates, la paire EUR n'existait simplement pas encore sur l'exchange — ce
// n'est pas une limite de l'API, c'est l'historique réel du marché.
export const ASSET_AVAILABLE_SINCE: Record<SupportedAsset, Date> = {
  bitcoin: new Date(Date.UTC(2020, 0, 3)),
  ethereum: new Date(Date.UTC(2020, 0, 3)),
  cardano: new Date(Date.UTC(2020, 10, 13)),
  solana: new Date(Date.UTC(2021, 4, 28)),
};

export function isSupportedAsset(asset: string): asset is SupportedAsset {
  return asset in ASSET_TO_BINANCE_SYMBOL;
}
