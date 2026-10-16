import type { DataRow, InputMode, MonthlyReturn, QuantAnalysis, QuantMetrics, RawCSVRow } from "@/types/quant";

const TRADING_DAYS_PER_YEAR = 252;
const DAY_MS = 86_400_000;
export class QuantInputError extends Error {
  constructor(message: string) { super(message); this.name = "QuantInputError"; }
}

function parseDate(input: string): string {
  const candidate = input.trim();
  if (!candidate) throw new QuantInputError("Every row must contain a date.");
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) throw new QuantInputError(`Invalid date: "${candidate}".`);
  return parsed.toISOString().slice(0, 10);
}
function parseNumeric(input: string, rowNumber: number): number {
  const normalized = input.trim().replace(/,/g, "");
  const value = Number(normalized);
  if (!normalized || !Number.isFinite(value)) throw new QuantInputError(`Row ${rowNumber}: value must be a finite number.`);
  return value;
}
function splitCSVLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { cells.push(cell.trim()); cell = ""; }
    else cell += char;
  }
  if (quoted) throw new QuantInputError("CSV contains an unclosed quoted field.");
  cells.push(cell.trim());
  return cells;
}

/** Parse Date + Return or Date + Price CSV. Decimal returns are the default convention. */
export function parseCSV(content: string): { rows: RawCSVRow[]; mode: InputMode; warnings: string[] } {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 3) throw new QuantInputError("Upload a CSV with a header and at least two observations.");
  const headers = splitCSVLine(lines[0]).map((header) => header.trim().toLowerCase());
  const dateIndex = headers.findIndex((header) => ["date", "datetime", "timestamp"].includes(header));
  const returnIndex = headers.findIndex((header) => ["return", "returns", "daily_return", "return_pct", "returnpercent"].includes(header));
  const priceIndex = headers.findIndex((header) => ["price", "close", "adj close", "adjusted_close", "adjusted close"].includes(header));
  if (dateIndex < 0) throw new QuantInputError('CSV needs a "Date" column.');
  if (returnIndex < 0 && priceIndex < 0) throw new QuantInputError('CSV needs a "Return" or "Price" column.');
  const mode: InputMode = returnIndex >= 0 ? "returns" : "prices";
  const valueIndex = mode === "returns" ? returnIndex : priceIndex;
  const rows: RawCSVRow[] = [];
  const warnings: string[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCSVLine(lines[i]);
    if (cells.length <= Math.max(dateIndex, valueIndex)) throw new QuantInputError(`Row ${i + 1}: missing expected column.`);
    const date = parseDate(cells[dateIndex]);
    const value = parseNumeric(cells[valueIndex], i + 1);
    if (mode === "prices" && value <= 0) throw new QuantInputError(`Row ${i + 1}: prices must be greater than zero.`);
    rows.push({ date, value });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < rows.length; i += 1) {
    if (rows[i].date === rows[i - 1].date) throw new QuantInputError(`Duplicate observation date: ${rows[i].date}.`);
  }
  if (mode === "prices") return { rows, mode, warnings: ["Price data is converted to simple close-to-close returns. Dividends, fees, and corporate actions are not inferred."] };

  const header = headers[valueIndex];
  const percentHeader = header.includes("pct") || header.includes("percent");
  const maxAbs = Math.max(...rows.map((row) => Math.abs(row.value)));
  if (!percentHeader && maxAbs > 1) warnings.push("Return values exceed 100% in decimal representation. Confirm decimals (0.01 = 1%) versus percentage points (1 = 1%).");
  return { rows: percentHeader ? rows.map((row) => ({ ...row, value: row.value / 100 })) : rows, mode, warnings };
}
function mean(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}
function sampleStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}
function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * p;
  const lower = Math.floor(position), upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}
function compoundMonthlyReturns(rows: DataRow[]): MonthlyReturn[] {
  const groups = new Map<string, { year: number; month: number; product: number }>();
  for (const row of rows) {
    const date = new Date(`${row.date}T00:00:00.000Z`);
    const year = date.getUTCFullYear(), month = date.getUTCMonth(), key = `${year}-${month}`;
    const group = groups.get(key) ?? { year, month, product: 1 };
    group.product *= 1 + row.returnDecimal;
    groups.set(key, group);
  }
  return [...groups.values()].map(({ year, month, product }) => ({ year, month, returnDecimal: product - 1 })).sort((a, b) => a.year - b.year || a.month - b.month);
}

/**
 * Sharpe/Sortino use periodic excess returns consistently. VaR95 is the
 * non-negative magnitude of the empirical 5th percentile of periodic returns.
 */
export function analyzeRows(rawRows: RawCSVRow[], mode: InputMode, riskFreeRate = 0.02, warnings: string[] = []): QuantAnalysis {
  if (rawRows.length < 2) throw new QuantInputError("At least two observations are required.");
  if (!Number.isFinite(riskFreeRate) || riskFreeRate < 0 || riskFreeRate >= 1) throw new QuantInputError("Annual risk-free rate must be between 0% and 100%.");
  const ordered = [...rawRows].sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 1; i < ordered.length; i += 1) {
    if (ordered[i].date === ordered[i - 1].date) throw new QuantInputError(`Duplicate observation date: ${ordered[i].date}.`);
  }
  const returnRows = mode === "prices"
    ? ordered.slice(1).map((row, index) => ({ date: row.date, value: row.value / ordered[index].value - 1 }))
    : ordered.map((row) => ({ date: row.date, value: row.value }));
  const allWarnings = [...warnings];
  if (mode === "prices") allWarnings.push("The first price observation establishes starting value; no return is available for that date.");
  const dailyReturns: number[] = [];
  for (const row of returnRows) {
    if (!Number.isFinite(row.value) || row.value <= -1) throw new QuantInputError(`Return on ${row.date} must be greater than -100%.`);
    dailyReturns.push(row.value);
  }

  let equity = 1, peak = 1, peakDate = ordered[0].date;
  let maxDrawdown = 0, maxDrawdownDurationDays = 0;
  const rows: DataRow[] = [];
  for (const { date, value: returnDecimal } of returnRows) {
    equity *= 1 + returnDecimal;
    const currentDate = new Date(`${date}T00:00:00.000Z`);
    if (equity >= peak) { peak = equity; peakDate = date; }
    const drawdown = equity / peak - 1;
    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownDurationDays = Math.max(0, Math.round((currentDate.getTime() - new Date(`${peakDate}T00:00:00.000Z`).getTime()) / DAY_MS));
    }
    rows.push({ date, returnDecimal, equity, drawdown });
  }
  const firstDate = new Date(`${rows[0].date}T00:00:00.000Z`);
  const lastDate = new Date(`${rows[rows.length - 1].date}T00:00:00.000Z`);
  const elapsedDays = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / DAY_MS);
  const totalReturn = equity - 1;
  const cagr = equity > 0 ? Math.pow(equity, 365.2425 / elapsedDays) - 1 : -1;
  const annualizedVol = sampleStdDev(dailyReturns) * Math.sqrt(TRADING_DAYS_PER_YEAR);
  const dailyRiskFreeRate = Math.pow(1 + riskFreeRate, 1 / TRADING_DAYS_PER_YEAR) - 1;
  const excessReturns = dailyReturns.map((value) => value - dailyRiskFreeRate);
  const excessMean = mean(excessReturns), dailyVol = sampleStdDev(dailyReturns);
  const downsideDeviation = Math.sqrt(mean(dailyReturns.map((value) => Math.min(value - dailyRiskFreeRate, 0) ** 2)));
  const monthlyReturns = compoundMonthlyReturns(rows);
  const metrics: QuantMetrics = {
    totalReturn, cagr,
    annualizedVol,
    sharpeRatio: dailyVol > 0 ? (excessMean / dailyVol) * Math.sqrt(TRADING_DAYS_PER_YEAR) : null,
    sortinoRatio: downsideDeviation > 0 ? (excessMean / downsideDeviation) * Math.sqrt(TRADING_DAYS_PER_YEAR) : null,
    maxDrawdown, maxDrawdownDurationDays,
    var95: Math.max(0, -percentile(dailyReturns, 0.05)),
    winRate: dailyReturns.filter((value) => value > 0).length / dailyReturns.length,
    bestMonth: monthlyReturns.length ? Math.max(...monthlyReturns.map((item) => item.returnDecimal)) : null,
    worstMonth: monthlyReturns.length ? Math.min(...monthlyReturns.map((item) => item.returnDecimal)) : null,
    observations: dailyReturns.length, startDate: rows[0].date, endDate: rows[rows.length - 1].date, riskFreeRate, monthlyReturns,
  };
  return { rows, metrics, source: mode, warnings: [...new Set(allWarnings)] };
}
export function calculateMetrics(rawRows: RawCSVRow[], riskFreeRate = 0.02): QuantMetrics {
  return analyzeRows(rawRows, "returns", riskFreeRate).metrics;
}
export function parseAndAnalyzeCSV(content: string, riskFreeRate = 0.02): QuantAnalysis {
  const parsed = parseCSV(content);
  return analyzeRows(parsed.rows, parsed.mode, riskFreeRate, parsed.warnings);
}

export const SAMPLE_CSV = `Date,Return
2024-01-02,0.004
2024-01-03,-0.002
2024-01-04,0.006
2024-01-05,0.001
2024-01-08,-0.004
2024-01-09,0.003
2024-01-10,0.002
2024-01-11,-0.001
2024-01-12,0.005
2024-01-15,0.002
2024-01-16,-0.003
2024-01-17,0.004
2024-01-18,0.001
2024-01-19,0.003
2024-01-22,-0.002
2024-01-23,0.006
2024-01-24,0.001
2024-01-25,-0.004
2024-01-26,0.003
2024-01-29,0.002
2024-01-30,0.004
2024-02-01,0.002
2024-02-02,-0.001
2024-02-05,0.005
2024-02-06,0.003
2024-02-07,-0.003
2024-02-08,0.004
2024-02-09,0.002
2024-02-12,-0.002
2024-02-13,0.006
2024-02-14,0.001
2024-02-15,0.003
2024-02-16,-0.004
2024-02-19,0.005
2024-02-20,0.002
2024-02-21,0.004
2024-02-22,-0.002
2024-02-23,0.003
2024-02-26,0.001
2024-02-27,0.004
2024-02-28,-0.001
2024-03-01,0.003
2024-03-04,0.002
2024-03-05,-0.005
2024-03-06,0.006
2024-03-07,0.004
2024-03-08,-0.002
2024-03-11,0.003
2024-03-12,0.001
2024-03-13,0.005`;
