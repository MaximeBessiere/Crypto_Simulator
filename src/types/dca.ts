export type Frequency = "once" | "daily" | "weekly" | "monthly";

export interface PricePoint {
  date: Date;
  price: number;
}

export interface DcaInput {
  asset: string;
  amountPerPeriod: number;
  frequency: Frequency;
  startDate: Date;
  endDate: Date;
  priceHistory: PricePoint[];
}

export interface TimeSeriesPoint {
  date: Date;
  investedCumulative: number;
  portfolioValue: number;
}

export interface DcaResult {
  totalInvested: number;
  totalAcquired: number;
  averagePrice: number;
  finalValue: number;
  performancePercent: number;
  timeSeries: TimeSeriesPoint[];
}
