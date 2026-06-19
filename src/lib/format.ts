const eurFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

// Comme formatEUR, mais sans ",00" superflu quand le montant est un entier
// (ex. "200 €" plutôt que "200,00 €") — utilisé dans la phrase de synthèse,
// où le montant saisi par l'utilisateur est presque toujours rond.
const eurTrimFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const amountFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Choisit le nombre de décimales (et bascule en notation compacte "k/M/Md"
 * au-delà du million) selon l'ordre de grandeur de la quantité, pour qu'un
 * nombre de tokens ne devienne jamais une chaîne interminable — que l'actif
 * vaille 0,0001 € (beaucoup de tokens) ou 90 000 € (peu de tokens) l'unité.
 */
function cryptoFormatter(value: number): Intl.NumberFormat {
  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    return new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 2 });
  }
  if (abs >= 1_000) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });
  }
  if (abs >= 1) {
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 4 });
  }
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 6 });
}

const percentFormatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  signDisplay: "exceptZero",
});

export function formatEUR(value: number): string {
  return eurFormatter.format(value);
}

export function formatEURTrim(value: number): string {
  return eurTrimFormatter.format(value);
}

/** Montant formaté sans le symbole € (pour les gros chiffres où l'unité est affichée séparément). */
export function formatAmountFR(value: number): string {
  return amountFormatter.format(value);
}

export function formatDateFR(date: Date): string {
  return date.toLocaleDateString("fr-FR");
}

export function formatCrypto(value: number): string {
  return cryptoFormatter(value).format(value);
}

export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)} %`;
}
