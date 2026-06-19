import { NextResponse } from "next/server";
import {
  ASSET_AVAILABLE_SINCE,
  ASSET_TO_BINANCE_SYMBOL,
  BinanceError,
  fetchPriceHistory,
  type SupportedAsset,
} from "@/lib/api/binance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const asset = searchParams.get("asset");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  if (!asset || !(asset in ASSET_TO_BINANCE_SYMBOL)) {
    return NextResponse.json(
      { error: "Paramètre 'asset' invalide ou manquant." },
      { status: 400 }
    );
  }
  if (!fromParam || !toParam) {
    return NextResponse.json(
      { error: "Paramètres 'from' et 'to' requis (format ISO)." },
      { status: 400 }
    );
  }

  const from = new Date(fromParam);
  const to = new Date(toParam);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "Dates invalides." }, { status: 400 });
  }

  // Si la date de début demandée précède l'historique EUR disponible pour cet
  // actif, on le signale explicitement au client plutôt que de le laisser
  // découvrir un recadrage silencieux dans les données reçues.
  const availableSince = ASSET_AVAILABLE_SINCE[asset as SupportedAsset];
  const notice =
    from.getTime() < availableSince.getTime()
      ? `Données disponibles pour cet actif à partir du ${availableSince.toLocaleDateString("fr-FR")}.`
      : undefined;

  try {
    const prices = await fetchPriceHistory(asset, from, to);
    return NextResponse.json({ prices, ...(notice ? { notice } : {}) });
  } catch (err) {
    if (err instanceof BinanceError) {
      return NextResponse.json({ error: err.message }, { status: err.status ?? 502 });
    }
    return NextResponse.json({ error: "Erreur interne inattendue." }, { status: 500 });
  }
}
