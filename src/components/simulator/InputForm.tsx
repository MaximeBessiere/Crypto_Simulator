"use client";

import type { ReactNode } from "react";
import type { SupportedAsset } from "@/lib/api/binance";
import { ASSET_OPTIONS } from "@/lib/assets";
import type { Frequency } from "@/types/dca";
import { InfoTooltip } from "./InfoTooltip";

export interface DcaFormValues {
  asset: SupportedAsset;
  amountPerPeriod: number;
  frequency: Frequency;
  startDate: string;
  endDate: string;
}

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "once", label: "Une seule fois" },
  { value: "daily", label: "Par jour" },
  { value: "weekly", label: "Par semaine" },
  { value: "monthly", label: "Par mois" },
];

// Plafonds du montant par période, selon la fréquence : un même montant "ne
// veut pas dire la même chose" en one-shot vs récurrent, donc le plafond est
// d'autant plus bas que la fréquence est rapprochée.
const AMOUNT_MAX_BY_FREQUENCY: Record<Frequency, number> = {
  once: 1_000_000_000,
  monthly: 100_000_000,
  weekly: 10_000_000,
  daily: 10_000_000,
};

const inputClass =
  "w-full border-0 border-b border-border-subtle bg-transparent py-2 text-text-primary outline-none transition-colors focus:border-accent-primary";

function Field({
  label,
  info,
  children,
}: {
  label: string;
  info?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-text-secondary">
        {label}
        {info && <InfoTooltip text={info} />}
      </span>
      {children}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute right-0 h-4 w-4 text-text-secondary"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

// Le sélecteur de date natif n'expose pas de couleur personnalisable pour son
// icône calendrier : on masque l'icône native (toujours cliquable, juste
// invisible) et on superpose notre propre icône, à la couleur des labels.
function DateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative flex items-center border-b border-border-subtle transition-colors focus-within:border-accent-primary">
      <input
        type="date"
        className="w-full border-0 bg-transparent py-2 pr-6 text-text-primary outline-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <CalendarIcon />
    </div>
  );
}

interface InputFormProps {
  values: DcaFormValues;
  onChange: (values: DcaFormValues) => void;
  notice?: string | null;
}

export function InputForm({ values, onChange, notice }: InputFormProps) {
  function update<K extends keyof DcaFormValues>(key: K, value: DcaFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  const amountMax = AMOUNT_MAX_BY_FREQUENCY[values.frequency];

  return (
    <div className="space-y-5">
      <Field label="Actif numérique" info="La cryptomonnaie sur laquelle porte la simulation.">
        <select
          className={inputClass}
          value={values.asset}
          onChange={(e) => update("asset", e.target.value as SupportedAsset)}
        >
          {ASSET_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-surface text-text-primary">
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Montant"
        info="Le montant investi à chaque période (ou en une fois si fréquence unique)."
      >
        <div className="flex items-baseline border-b border-border-subtle transition-colors focus-within:border-accent-primary">
          <input
            type="number"
            min={0}
            max={amountMax}
            step="10"
            className="w-full border-0 bg-transparent py-2 text-text-primary outline-none"
            value={values.amountPerPeriod}
            onChange={(e) => {
              const raw = Number(e.target.value);
              update("amountPerPeriod", Number.isNaN(raw) ? raw : Math.min(raw, amountMax));
            }}
          />
          <span className="pl-2 text-text-secondary">€</span>
        </div>
      </Field>

      <Field
        label="Fréquence"
        info="À quel rythme l'investissement est répété : une seule fois, ou régulièrement (DCA)."
      >
        <select
          className={inputClass}
          value={values.frequency}
          onChange={(e) => {
            const frequency = e.target.value as Frequency;
            const newMax = AMOUNT_MAX_BY_FREQUENCY[frequency];
            onChange({
              ...values,
              frequency,
              amountPerPeriod: Math.min(values.amountPerPeriod, newMax),
            });
          }}
        >
          {FREQUENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-surface text-text-primary">
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Depuis" info="Date de début de la simulation.">
        <DateField value={values.startDate} onChange={(value) => update("startDate", value)} />
        {notice && <p className="mt-1.5 text-xs text-text-secondary">{notice}</p>}
      </Field>

      <Field label="Jusqu'au" info="Date de fin de la simulation.">
        <DateField value={values.endDate} onChange={(value) => update("endDate", value)} />
      </Field>
    </div>
  );
}
