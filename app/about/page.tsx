import type { Metadata } from "next";
import Link from "next/link";
import { Activity, FileChartColumnIncreasing, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteNav } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "About Us | QuantTearSheet",
  description: "Learn about QuantTearSheet, a browser-based tool for quantitative strategy performance and risk analysis.",
};

export default function AboutPage() {
  return (
    <main className="shell">
      <SiteNav />
      <section className="content-hero">
        <div className="eyebrow"><span className="dot" /> About QuantTearSheet</div>
        <h1>Clearer analysis.<br /><span className="accent-text">Better questions.</span></h1>
        <p>QuantTearSheet turns historical strategy returns or price data into an understandable performance and risk report, without asking you to connect a brokerage account.</p>
      </section>
      <section className="content-grid">
        <article className="content-card">
          <Activity size={20} className="content-icon" />
          <h2>What we do</h2>
          <p>We provide an accessible starting point for exploring strategy performance: growth, volatility, risk-adjusted returns, drawdowns, monthly results, and a downloadable tear sheet.</p>
        </article>
        <article className="content-card">
          <ShieldCheck size={20} className="content-icon" />
          <h2>Privacy by design</h2>
          <p>In the current version, your CSV is read and analyzed in your browser. The app does not send the dataset to a QuantTearSheet upload endpoint or connect to a brokerage account.</p>
        </article>
        <article className="content-card">
          <FileChartColumnIncreasing size={20} className="content-icon" />
          <h2>Research, not predictions</h2>
          <p>Our metrics describe the data and assumptions you provide. Historical results are not a forecast, a guarantee, or a recommendation to buy or sell any asset.</p>
        </article>
      </section>
      <section className="content-note">
        <h2>Who is it for?</h2>
        <p>Students, independent researchers, and quantitative finance learners who want to inspect backtest data and communicate results more clearly. Always check data quality, fees, slippage, and backtest limitations before relying on any analysis.</p>
        <Link className="btn btn-primary" href="/">Open the analytics tool</Link>
      </section>
      <SiteFooter />
    </main>
  );
}
