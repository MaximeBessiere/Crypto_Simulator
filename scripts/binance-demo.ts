import { fetchPriceHistory } from "../src/lib/api/binance";
import { calculateDca } from "../src/lib/dca/calculate";

async function main() {
  const from = new Date(2020, 0, 1); // 1er janvier 2020
  const to = new Date(); // aujourd'hui

  console.log(
    `Récupération de l'historique BTC/EUR (Binance) du ${from.toLocaleDateString("fr-FR")} au ${to.toLocaleDateString("fr-FR")}...`
  );
  const priceHistory = await fetchPriceHistory("bitcoin", from, to);
  console.log(`${priceHistory.length} points de prix récupérés.`);
  console.log(
    "Premier point :",
    priceHistory[0].date.toLocaleDateString("fr-FR"),
    priceHistory[0].price.toFixed(2),
    "€"
  );
  console.log(
    "Dernier point :",
    priceHistory[priceHistory.length - 1].date.toLocaleDateString("fr-FR"),
    priceHistory[priceHistory.length - 1].price.toFixed(2),
    "€"
  );

  const result = calculateDca({
    asset: "bitcoin",
    amountPerPeriod: 100,
    frequency: "monthly",
    startDate: from,
    endDate: to,
    priceHistory,
  });

  console.log("\n--- Résultat DCA (100€/mois, BTC, données réelles Binance, jan 2020 -> aujourd'hui) ---");
  console.log("totalInvested:", result.totalInvested.toFixed(2), "€");
  console.log("totalAcquired:", result.totalAcquired.toFixed(8), "BTC");
  console.log("averagePrice:", result.averagePrice.toFixed(2), "€");
  console.log("finalValue:", result.finalValue.toFixed(2), "€");
  console.log("performancePercent:", result.performancePercent.toFixed(2), "%");

  // Démonstration du recadrage explicite pour Solana (historique EUR depuis mai 2021 seulement).
  console.log("\n--- Test du recadrage Solana (from = janvier 2020) ---");
  const solHistory = await fetchPriceHistory("solana", new Date(2020, 0, 1), to);
  console.log(
    `Demandé depuis le 01/01/2020, premier point réellement reçu pour SOL : ${solHistory[0].date.toLocaleDateString("fr-FR")}`
  );
}

main().catch((err) => {
  console.error("Erreur:", err.message);
  process.exit(1);
});
