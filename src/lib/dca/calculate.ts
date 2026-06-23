import type {
  DcaInput,
  DcaResult,
  Frequency,
  PricePoint,
  TimeSeriesPoint,
} from "../../types/dca";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Adds `months` calendar months to `date`, clamping the day-of-month to the
 * target month's last day. Without this, `setMonth` on Jan 31 would silently
 * roll over into March instead of landing on Feb 28/29.
 */
function addMonthsClamped(date: Date, months: number): Date {
  const day = date.getDate();
  const firstOfTargetMonth = new Date(
    date.getFullYear(),
    date.getMonth() + months,
    1
  );
  const lastDayOfTargetMonth = new Date(
    firstOfTargetMonth.getFullYear(),
    firstOfTargetMonth.getMonth() + 1,
    0
  ).getDate();
  firstOfTargetMonth.setDate(Math.min(day, lastDayOfTargetMonth));
  return firstOfTargetMonth;
}

/** Builds the list of investment dates between startDate and endDate (both inclusive) for a given frequency. */
function generateInvestmentDates(
  startDate: Date,
  endDate: Date,
  frequency: Frequency
): Date[] {
  if (frequency === "once") {
    return [new Date(startDate)];
  }

  const dates: Date[] = [];
  let current = new Date(startDate);

  while (current.getTime() <= endDate.getTime()) {
    dates.push(current);
    current =
      frequency === "monthly"
        ? addMonthsClamped(current, 1)
        : new Date(
            current.getTime() + (frequency === "weekly" ? 7 * DAY_MS : DAY_MS)
          );
  }

  return dates;
}

/** Returns the price point whose date is nearest to `target` (earlier point wins on a tie). */
function findClosestPrice(priceHistory: PricePoint[], target: Date): PricePoint {
  let closest = priceHistory[0];
  let smallestDiff = Math.abs(closest.date.getTime() - target.getTime());

  for (const point of priceHistory) {
    const diff = Math.abs(point.date.getTime() - target.getTime());
    if (diff < smallestDiff) {
      closest = point;
      smallestDiff = diff;
    }
  }

  return closest;
}

export function calculateDca(input: DcaInput): DcaResult {
  const { amountPerPeriod, frequency, startDate, endDate, priceHistory } = input;

  if (priceHistory.length === 0) {
    throw new Error("calculateDca: priceHistory ne peut pas être vide.");
  }
  if (endDate.getTime() < startDate.getTime()) {
    throw new Error(
      "calculateDca: endDate doit être postérieure ou égale à startDate."
    );
  }

  const investmentDates = generateInvestmentDates(startDate, endDate, frequency);

  // La courbe doit suivre la valorisation du portefeuille à chaque pas de
  // temps DISPONIBLE DANS LES PRIX, pas seulement aux dates d'investissement :
  // sinon un "une seule fois" ne produit qu'un point isolé, alors que la
  // quantité acquise (fixe après l'achat) continue de se valoriser chaque
  // jour au gré du prix. On parcourt donc priceHistory en avançant en
  // parallèle dans investmentDates (les deux sont triés par date croissante),
  // et on cumule investi/acquis au fur et à mesure que chaque date
  // d'investissement est atteinte.
  let totalInvested = 0;
  let totalAcquired = 0;
  let investmentIndex = 0;
  const timeSeries: TimeSeriesPoint[] = [];

  function applyInvestment(date: Date) {
    const { price } = findClosestPrice(priceHistory, date);
    if (price <= 0) {
      throw new Error(
        `calculateDca: prix invalide (<= 0) pour la date ${date.toISOString()}.`
      );
    }
    totalInvested += amountPerPeriod;
    totalAcquired += amountPerPeriod / price;
  }

  for (const point of priceHistory) {
    while (
      investmentIndex < investmentDates.length &&
      investmentDates[investmentIndex].getTime() <= point.date.getTime()
    ) {
      applyInvestment(investmentDates[investmentIndex]);
      investmentIndex++;
    }

    timeSeries.push({
      date: point.date,
      investedCumulative: totalInvested,
      portfolioValue: totalAcquired * point.price,
    });
  }

  // Dates d'investissement postérieures au dernier prix disponible (ne
  // devrait pas arriver tant que priceHistory couvre bien [startDate, endDate],
  // mais on les comptabilise tout de même dans les totaux par sécurité).
  while (investmentIndex < investmentDates.length) {
    applyInvestment(investmentDates[investmentIndex]);
    investmentIndex++;
  }

  const finalPrice = findClosestPrice(priceHistory, endDate).price;
  const finalValue = totalAcquired * finalPrice;

  return {
    totalInvested,
    totalAcquired,
    averagePrice: totalAcquired === 0 ? 0 : totalInvested / totalAcquired,
    finalValue,
    performancePercent:
      totalInvested === 0 ? 0 : ((finalValue - totalInvested) / totalInvested) * 100,
    timeSeries,
  };
}
