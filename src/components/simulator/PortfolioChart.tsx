"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import type { TimeSeriesPoint } from "@/types/dca";
import { formatEUR } from "@/lib/format";

interface PortfolioChartProps {
  timeSeries: TimeSeriesPoint[];
}

interface ChartPoint {
  timestamp: number;
  portfolioValue: number;
  investedCumulative: number;
}

const yAxisFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

function formatYAxisTick(value: number): string {
  return yAxisFormatter.format(value);
}

/** Format de date d'axe X adapté à l'étendue de la période : année seule pour
 * une longue plage, mois+année pour une plage moyenne, jour+mois sinon. */
function formatXAxisTick(timestamp: number, spanMs: number): string {
  const date = new Date(timestamp);
  const spanDays = spanMs / (24 * 60 * 60 * 1000);

  if (spanDays > 730) {
    return date.toLocaleDateString("fr-FR", { year: "numeric" });
  }
  if (spanDays > 60) {
    return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
  }
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}

/** Calcule jusqu'à `count` ticks régulièrement espacés entre min et max. */
function buildTicks(min: number, max: number, count: number): number[] {
  if (min === max || count <= 1) return [min];
  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, i) => Math.round(min + step * i));
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0 || typeof label !== "number") return null;

  const date = new Date(label).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-border-subtle bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-text-primary">{date}</p>
      {payload.map((entry) => (
        <p key={String(entry.name)} style={{ color: entry.color }}>
          {entry.name} : {formatEUR(Number(entry.value))}
        </p>
      ))}
    </div>
  );
}

export function PortfolioChart({ timeSeries }: PortfolioChartProps) {
  if (timeSeries.length === 0) return null;

  const data: ChartPoint[] = timeSeries.map((point) => ({
    timestamp: point.date.getTime(),
    portfolioValue: point.portfolioValue,
    investedCumulative: point.investedCumulative,
  }));

  const minTimestamp = data[0].timestamp;
  const maxTimestamp = data[data.length - 1].timestamp;
  const spanMs = maxTimestamp - minTimestamp;
  const ticks = buildTicks(minTimestamp, maxTimestamp, Math.min(6, data.length));

  return (
    <div className="h-80 w-full rounded-2xl border border-border-subtle bg-surface p-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent-secondary)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--color-accent-secondary)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--color-border-subtle)" strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="timestamp"
            type="number"
            domain={[minTimestamp, maxTimestamp]}
            ticks={ticks}
            tickFormatter={(value) => formatXAxisTick(value, spanMs)}
            tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border-subtle)" }}
            tickLine={false}
          />

          <YAxis
            tickFormatter={formatYAxisTick}
            tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={70}
          />

          <Tooltip content={(props) => <ChartTooltip {...props} />} />

          <Legend
            verticalAlign="bottom"
            height={32}
            formatter={(value) => <span className="text-xs text-text-secondary">{value}</span>}
          />

          <Area
            type="monotone"
            dataKey="investedCumulative"
            name="Investi"
            stroke="var(--color-accent-secondary)"
            fill="url(#investedGradient)"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="portfolioValue"
            name="Valeur du portefeuille"
            stroke="var(--color-accent-primary)"
            fill="url(#portfolioGradient)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
