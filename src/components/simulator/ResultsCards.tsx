import type { DcaResult, Frequency } from "@/types/dca";
import {
  formatAmountFR,
  formatCrypto,
  formatDateFR,
  formatEUR,
  formatEURTrim,
  formatPercent,
} from "@/lib/format";

const FREQUENCY_ADVERB: Record<Frequency, string> = {
  once: "en une seule fois",
  daily: "chaque jour",
  weekly: "chaque semaine",
  monthly: "chaque mois",
};

interface ResultsCardsProps {
  result: DcaResult;
  symbol: string;
  assetLabel: string;
  frequency: Frequency;
  amountPerPeriod: number;
  startDate: Date;
  endDate: Date;
}

function CardShell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`h-full rounded-2xl border border-border-subtle bg-surface p-6 ${className ?? ""}`}>
      {children}
    </div>
  );
}

function ProportionBar({ invested, finalValue }: { invested: number; finalValue: number }) {
  if (finalValue >= invested) {
    const investedPct = finalValue > 0 ? (invested / finalValue) * 100 : 0;
    return (
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-border-subtle">
        <div className="bg-accent-primary" style={{ width: `${investedPct}%` }} />
        <div className="bg-positive" style={{ width: `${100 - investedPct}%` }} />
      </div>
    );
  }

  const remainingPct = invested > 0 ? Math.max((finalValue / invested) * 100, 0) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-border-subtle">
      <div className="h-full bg-negative" style={{ width: `${remainingPct}%` }} />
    </div>
  );
}

export function ResultsCards({
  result,
  symbol,
  assetLabel,
  frequency,
  amountPerPeriod,
  startDate,
  endDate,
}: ResultsCardsProps) {
  const gain = result.finalValue - result.totalInvested;
  const isGain = gain >= 0;
  const acquiredText = `${formatCrypto(result.totalAcquired)} ${symbol}`;

  return (
    <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-3 sm:grid-rows-[auto_1fr]">
      {/* Carte 1 : Capital final, avec sa décomposition investi / plus-value */}
      <CardShell className="sm:col-span-2">
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          Capital final
        </p>
        <p className="mt-2 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-text-primary">
            {formatAmountFR(result.finalValue)}
          </span>
          <span className="text-4xl font-bold text-text-primary">€</span>
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
          <span className="text-accent-primary">
            Investi <span className="font-semibold">{formatEUR(result.totalInvested)}</span>
          </span>
          <span className={isGain ? "text-positive" : "text-negative"}>
            {isGain ? "Plus-value" : "Moins-value"}{" "}
            <span className="font-semibold">{formatEUR(Math.abs(gain))}</span>
          </span>
        </div>

        <div className="mt-3">
          <ProportionBar invested={result.totalInvested} finalValue={result.finalValue} />
        </div>
      </CardShell>

      {/* Carte 2 : Performance, seule */}
      <CardShell className="flex flex-col">
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
          Performance
        </p>
        <div className="flex flex-1 items-center justify-center">
          <p
            className={`whitespace-nowrap text-2xl font-bold ${
              isGain ? "text-positive" : "text-negative"
            }`}
          >
            {formatPercent(result.performancePercent)}
          </p>
        </div>
      </CardShell>

      {/* Carte 3 : Acquis + Prix moyen, les deux métriques "par unité" du DCA */}
      <CardShell>
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Acquis</p>
        <p className="mt-2 whitespace-nowrap text-lg font-bold text-text-primary">
          {acquiredText}
        </p>

        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-text-secondary">
          Prix moyen d&apos;acquisition
        </p>
        <p className="mt-2 whitespace-nowrap text-lg font-bold text-text-primary">
          {formatEUR(result.averagePrice)}
        </p>
      </CardShell>

      {/* Carte 4 : phrase de synthèse */}
      <CardShell className="sm:col-span-2 flex flex-col items-center justify-center text-center">
        <p className="text-sm leading-relaxed text-text-primary">
          En investissant <span className="font-semibold">{formatEURTrim(amountPerPeriod)}</span>{" "}
          {FREQUENCY_ADVERB[frequency]} sur <span className="font-semibold">{assetLabel}</span>{" "}
          entre le {formatDateFR(startDate)} et le {formatDateFR(endDate)}, vous auriez acquis{" "}
          <span className="font-semibold">{acquiredText}</span>
          , pour un capital final de{" "}
          <span className="font-semibold">{formatEUR(result.finalValue)}</span> (
          {formatPercent(result.performancePercent)}).
        </p>
      </CardShell>
    </div>
  );
}
