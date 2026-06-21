"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateDca } from "@/lib/dca/calculate";
import { ASSET_AVAILABLE_SINCE, ASSET_OPTIONS } from "@/lib/assets";
import type { DcaResult, PricePoint } from "@/types/dca";
import { InputForm, type DcaFormValues } from "./InputForm";
import { PortfolioChart } from "./PortfolioChart";
import { ResultsCards } from "./ResultsCards";

const DEBOUNCE_MS = 500;

interface PriceHistoryResponse {
  prices: { date: string; price: number }[];
  notice?: string;
  error?: string;
}

function todayAsInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultFormValues(): DcaFormValues {
  return {
    asset: "bitcoin",
    amountPerPeriod: 100,
    frequency: "monthly",
    startDate: "2020-01-01",
    endDate: todayAsInputValue(),
  };
}

export function Simulator() {
  const [values, setValues] = useState<DcaFormValues>(defaultFormValues);
  const [debouncedValues, setDebouncedValues] = useState(values);
  const [result, setResult] = useState<DcaResult | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValues(values), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [values]);

  useEffect(() => {
    const { asset, amountPerPeriod, frequency, startDate, endDate } = debouncedValues;

    if (!startDate || !endDate || amountPerPeriod <= 0) {
      setError("Renseignez un montant positif et des dates valides.");
      setResult(null);
      setNotice(null);
      setIsLoading(false);
      return;
    }
    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      setError("La date de fin doit être postérieure à la date de début.");
      setResult(null);
      setNotice(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function run() {
      setIsLoading(true);
      setError(null);
      setNotice(null);

      try {
        const params = new URLSearchParams({ asset, from: startDate, to: endDate });
        const response = await fetch(`/api/price-history?${params}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as PriceHistoryResponse;

        if (!response.ok || data.error) {
          throw new Error(data.error ?? "Erreur inattendue lors de la récupération des prix.");
        }

        const priceHistory: PricePoint[] = data.prices.map((point) => ({
          date: new Date(point.date),
          price: point.price,
        }));

        // La requête API recadre déjà priceHistory à la fenêtre réellement
        // disponible pour l'actif (voir `notice`). On applique le même
        // recadrage à startDate/endDate ici : sinon calculateDca générerait
        // des dates d'investissement antérieures au listing de l'actif (ou
        // futures), qui retomberaient toutes sur le même prix le plus proche
        // disponible et fausseraient totalInvested/averagePrice.
        const now = new Date();
        const availableSince = ASSET_AVAILABLE_SINCE[asset];
        const effectiveStartDate = new Date(
          Math.max(new Date(startDate).getTime(), availableSince.getTime())
        );
        const effectiveEndDate = new Date(Math.min(new Date(endDate).getTime(), now.getTime()));

        const dcaResult = calculateDca({
          asset,
          amountPerPeriod,
          frequency,
          startDate: effectiveStartDate,
          endDate: effectiveEndDate,
          priceHistory,
        });

        setResult(dcaResult);
        if (data.notice) setNotice(data.notice);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Erreur inattendue.");
        setResult(null);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    run();
    return () => controller.abort();
  }, [debouncedValues]);

  const selectedAsset = useMemo(
    () => ASSET_OPTIONS.find((option) => option.value === debouncedValues.asset),
    [debouncedValues.asset]
  );

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <section className="flex flex-col gap-6">
          <SectionTitle title="Simulation" />
          <InputForm values={values} onChange={setValues} notice={notice} />
        </section>

        <section className="flex flex-col gap-6">
          <SectionTitle title="Vos résultats" />

          {error && (
            <div className="rounded-xl border border-negative/30 bg-negative/10 px-4 py-3 text-sm text-negative">
              {error}
            </div>
          )}

          <div className="lg:flex-1">
            {isLoading && <ResultsSkeleton />}
            {!isLoading && result && (
              <ResultsCards
                result={result}
                symbol={selectedAsset?.symbol ?? ""}
                assetLabel={selectedAsset?.label ?? ""}
                frequency={debouncedValues.frequency}
                amountPerPeriod={debouncedValues.amountPerPeriod}
                startDate={new Date(debouncedValues.startDate)}
                endDate={new Date(debouncedValues.endDate)}
              />
            )}
            {!isLoading && !result && !error && (
              <p className="text-sm text-text-secondary">
                Renseignez les paramètres pour lancer la simulation.
              </p>
            )}
          </div>
        </section>
      </div>

      {!isLoading && result && (
        <section className="flex flex-col gap-6">
          <SectionTitle title="Évolution du portefeuille" />
          <PortfolioChart timeSeries={result.timeSeries} />
        </section>
      )}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-6 w-1 rounded-full bg-accent-primary" />
      <h2 className="text-xl font-bold text-text-primary">{title}</h2>
    </div>
  );
}

function ResultsSkeleton() {
  const placeholders = [
    { span: "sm:col-span-2", height: "h-28" },
    { span: "", height: "h-28" },
    { span: "", height: "h-28 sm:h-full" },
    { span: "sm:col-span-2", height: "h-28 sm:h-full" },
  ];
  return (
    <div className="grid h-full grid-cols-1 gap-4 sm:grid-cols-3 sm:grid-rows-[auto_1fr]">
      {placeholders.map(({ span, height }, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-2xl border border-border-subtle bg-surface ${height} ${span}`}
        />
      ))}
    </div>
  );
}
