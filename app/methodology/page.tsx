import type { Metadata } from "next";
import Link from "next/link";
import { Activity, AlertTriangle, BarChart3, Calculator, FileChartColumnIncreasing, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteNav } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Methodology | QuantTearSheet",
  description: "Detailed metric definitions, assumptions, and limitations used by QuantTearSheet.",
};

export default function MethodologyPage() {
  return (
    <main className="shell">
      <SiteNav />
      <section className="content-hero">
        <div className="eyebrow"><span className="dot" /> Transparent calculations</div>
        <h1>Know what each metric means.<br /><span className="accent-text">Understand its limits.</span></h1>
        <p>This page documents how QuantTearSheet turns a compatible historical CSV into performance and risk statistics. The aim is clarity and repeatability, not to imply that one report can certify a strategy or predict future returns.</p>
      </section>
      <section className="content-grid methodology-section">
        <article className="content-card"><Calculator size={20} className="content-icon"/><h2>1. Prepare the data</h2><p>Upload a CSV containing a date column and either returns or prices. Dates should be valid and observations should be ordered consistently. Returns are decimals by default: 0.01 means 1%. Headers explicitly marked as percentages are interpreted as percentage points.</p></article>
        <article className="content-card"><Activity size={20} className="content-icon"/><h2>2. Calculate the series</h2><p>For return data, the equity curve compounds each observation. For price data, the tool derives simple close-to-close returns. The first price is used as the baseline and does not create an extra return observation.</p></article>
        <article className="content-card"><FileChartColumnIncreasing size={20} className="content-icon"/><h2>3. Review and export</h2><p>Explore the equity curve, drawdown profile, monthly-return heatmap, and summary metrics. Export a PDF tear sheet for documentation and discussion. Always validate the input and assumptions before sharing a report.</p></article>
      </section>
      <section className="content-note">
        <h2>Core metric definitions</h2>
        <p>These are the conventions used by the current MVP. Observations are assumed to be daily for annualization; the application does not infer sampling frequency from gaps between dates.</p>
        <table className="methodology-table">
          <thead><tr><th>Metric</th><th>Definition</th><th>Interpretation caution</th></tr></thead>
          <tbody>
            <tr><td><strong>CAGR</strong></td><td>Annualized compound growth calculated from the first and last equity observations over elapsed calendar time.</td><td>Short samples can produce extreme or unstable annualized figures.</td></tr>
            <tr><td><strong>Total return</strong></td><td>Change in the compounded equity value from the start to the end of the sample.</td><td>Does not by itself describe the path or risk taken to earn the return.</td></tr>
            <tr><td><strong>Annualized volatility</strong></td><td>Sample standard deviation of daily returns multiplied by √252.</td><td>Volatility is not the same as maximum possible loss.</td></tr>
            <tr><td><strong>Sharpe ratio</strong></td><td>Mean daily excess return divided by sample daily standard deviation, annualized by √252. The annual risk-free rate is converted to an effective daily hurdle.</td><td>Sensitive to the sample, risk-free assumption, outliers, and return distribution.</td></tr>
            <tr><td><strong>Sortino ratio</strong></td><td>Mean daily excess return divided by downside deviation relative to the daily risk-free hurdle, annualized by √252.</td><td>Different conventions for downside deviation can produce different results.</td></tr>
            <tr><td><strong>Maximum drawdown</strong></td><td>Largest percentage decline from a previous equity high to a subsequent trough.</td><td>Past drawdown does not bound future losses; recovery time is not the same as peak-to-trough duration.</td></tr>
            <tr><td><strong>Historical VaR (95%)</strong></td><td>Non-negative magnitude of the empirical 5th percentile of observed daily returns.</td><td>It is a historical threshold, not a worst-case loss or guarantee.</td></tr>
            <tr><td><strong>Win rate</strong></td><td>Share of positive return observations in the sample.</td><td>This is not trade-level win rate; the tool does not infer trade count or profit factor from daily returns.</td></tr>
            <tr><td><strong>Monthly returns</strong></td><td>Returns aggregated by calendar month for the displayed heatmap and best/worst-month statistics.</td><td>Partial first or last months may be included when the input period begins or ends mid-month.</td></tr>
          </tbody>
        </table>
      </section>
      <section className="content-grid methodology-section">
        <article className="content-card"><BarChart3 size={20} className="content-icon"/><h2>Annualization assumptions</h2><p>The tool uses 252 trading days per year. It assumes observations are daily and uses a sample standard deviation for volatility. Irregular dates, weekly data, intraday data, or missing observations can make the estimates unsuitable without preprocessing.</p></article>
        <article className="content-card"><ShieldCheck size={20} className="content-icon"/><h2>Data and privacy</h2><p>In the current MVP, the CSV is read and analyzed in the browser, with a 10 MB file-size limit. There is no QuantTearSheet CSV upload API and no brokerage-account connection. Hosting providers may still process standard request and security logs.</p></article>
        <article className="content-card"><AlertTriangle size={20} className="content-icon"/><h2>What is not modeled</h2><p>The tool does not automatically infer commissions, taxes, slippage, liquidity constraints, financing costs, corporate actions, survivorship bias, or look-ahead bias. Price series should be appropriately adjusted where relevant.</p></article>
      </section>
      <section className="content-note">
        <h2>Industry-style reporting, not certification</h2>
        <p>QuantTearSheet helps beginners and independent researchers use a consistent vocabulary and a repeatable report layout similar to common performance-analysis workflows. It does not certify that your strategy meets professional, regulatory, or institutional standards. Professional review and strategy-specific validation may still be required.</p>
        <div className="value-actions"><Link className="btn btn-primary" href="/">Analyze a CSV</Link><Link className="btn" href="/about">Why this service helps</Link></div>
      </section>
      <SiteFooter />
    </main>
  );
}
