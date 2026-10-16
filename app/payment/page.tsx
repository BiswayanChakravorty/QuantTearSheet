import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, CreditCard, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteNav } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Plans and Pricing | QuantTearSheet",
  description: "Compare the free QuantTearSheet plan with unlimited monthly analysis.",
};

export default function PaymentPage() {
  const paymentUrl = process.env.NEXT_PUBLIC_PAYMENT_URL;
  return (
    <main className="shell">
      <SiteNav />
      <section className="content-hero">
        <div className="eyebrow"><span className="dot" /> Simple, transparent plans</div>
        <h1>Start free.<br /><span className="accent-text">Scale your research.</span></h1>
        <p>Explore your first strategy reports for free, then move to unlimited analysis when you need to compare more ideas. You can review your data and assumptions before deciding what to do next.</p>
      </section>
      <section className="pricing-grid">
        <article className="pricing-card">
          <div className="pricing-label">FREE</div>
          <h2>Research Starter</h2>
          <p className="pricing-price">$0 <span>/ month</span></p>
          <p className="pricing-description">For students, new users, and occasional strategy checks.</p>
          <ul className="pricing-list">
            <li><Check size={15} /> 5 analyses per month</li>
            <li><Check size={15} /> Core performance and risk metrics</li>
            <li><Check size={15} /> Interactive charts</li>
            <li><Check size={15} /> PDF tear-sheet export</li>
            <li><Check size={15} /> CSV stays in your browser</li>
          </ul>
          <Link className="btn" href="/">Try the free tool</Link>
        </article>
        <article className="pricing-card pricing-featured">
          <div className="pricing-label"><span className="dot" /> UNLIMITED</div>
          <h2>Research Pro</h2>
          <p className="pricing-price">$9 <span>/ month</span></p>
          <p className="pricing-description">For active learners and researchers who regularly test and compare strategies.</p>
          <ul className="pricing-list">
            <li><Check size={15} /> Unlimited analyses per month</li>
            <li><Check size={15} /> All core performance and risk metrics</li>
            <li><Check size={15} /> Interactive charts and monthly return heatmap</li>
            <li><Check size={15} /> PDF tear-sheet export</li>
            <li><Check size={15} /> No brokerage connection required</li>
          </ul>
          {paymentUrl ? (
            <a className="btn btn-primary" href={paymentUrl} target="_blank" rel="noopener noreferrer">Subscribe for $9/month <ArrowUpRight size={14} /></a>
          ) : (
            <div className="setup-note"><strong>Checkout is not active yet.</strong><br />The owner must connect a verified subscription checkout and usage tracking before this plan can be purchased or unlimited usage can be enforced.</div>
          )}
        </article>
      </section>
      <section className="content-note">
        <h2>What you should know</h2>
        <p>Prices are shown in USD. The $9 plan is intended to renew monthly through a third-party checkout once configured. Review the provider checkout for the final amount, taxes, renewal, and cancellation terms before paying. Do not pay through unofficial links.</p>
        <p>The current MVP does not yet have sign-in or server-side monthly usage tracking. Those controls must be implemented alongside billing before these limits can be enforced reliably.</p>
        <Link href="/contact" className="btn"><CreditCard size={14} /> Questions about plans?</Link>
      </section>
      <SiteFooter />
    </main>
  );
}
