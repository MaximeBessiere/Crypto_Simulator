import { calculateDca } from "../src/lib/dca/calculate";
import type { PricePoint } from "../src/types/dca";

// Prix fictif, prévisible : +10€ chaque 1er du mois, de janvier à juin.
const priceHistory: PricePoint[] = [
  { date: new Date(2026, 0, 1), price: 100 },
  { date: new Date(2026, 1, 1), price: 110 },
  { date: new Date(2026, 2, 1), price: 120 },
  { date: new Date(2026, 3, 1), price: 130 },
  { date: new Date(2026, 4, 1), price: 140 },
  { date: new Date(2026, 5, 1), price: 150 },
];

const result = calculateDca({
  asset: "bitcoin",
  amountPerPeriod: 100,
  frequency: "monthly",
  startDate: new Date(2026, 0, 1),
  endDate: new Date(2026, 5, 1),
  priceHistory,
});

console.log("totalInvested:", result.totalInvested);
console.log("totalAcquired:", result.totalAcquired);
console.log("averagePrice:", result.averagePrice);
console.log("finalValue:", result.finalValue);
console.log("performancePercent:", result.performancePercent);
console.log("timeSeries:");
for (const point of result.timeSeries) {
  console.log(
    `  ${point.date.toLocaleDateString("fr-FR")}  investedCumulative=${point.investedCumulative.toFixed(2)}  portfolioValue=${point.portfolioValue.toFixed(2)}`
  );
}
