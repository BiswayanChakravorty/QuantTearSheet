export type InputMode = "returns" | "prices";
export interface RawCSVRow { date: string; value: number }
export interface DataRow {
  date: string;
  /** Simple periodic return; 0.01 = 1%. */
  returnDecimal: number;
  /** Growth multiple of one unit of initial capital. */
  equity: number;
  /** Drawdown from running high, in decimal units. */
  drawdown: number;
}
export interface MonthlyReturn { year: number; month: number; returnDecimal: number }
export interface QuantMetrics {
  totalReturn: number; cagr: number; annualizedVol: number;
  sharpeRatio: number | null; sortinoRatio: number | null;
  maxDrawdown: number; maxDrawdownDurationDays: number; var95: number;
  winRate: number; bestMonth: number | null; worstMonth: number | null;
  observations: number; startDate: string; endDate: string; riskFreeRate: number;
  monthlyReturns: MonthlyReturn[];
}
export interface QuantAnalysis { rows: DataRow[]; metrics: QuantMetrics; source: InputMode; warnings: string[] }
