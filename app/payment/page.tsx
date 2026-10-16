import type { Metadata } from "next";
import { ArrowUpRight, CreditCard, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteNav } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Payment | QuantTearSheet",
  description: "Payment information for QuantTearSheet products and services.",
};

export default function PaymentPage() {
  const paymentUrl = process.env.NEXT_PUBLIC_PAYMENT_URL;
  return (
    <main className="shell">
      <SiteNav />
      <section className="content-hero">
        <div className="eyebrow"><span className="dot" /> Secure checkout</div>
        <h1>Payment, when<br /><span className="accent-text">you’re ready.</span></h1>
        <p>Use the official payment link provided by QuantTearSheet. Any payment should be processed by a trusted third-party payment provider.</p>
      </section>
      <section className="contact-card payment-card">
        <div className="contact-icon"><CreditCard size={21} /></div>
        <h2>QuantTearSheet payment</h2>
        {paymentUrl ? (
          <>
            <p>You will continue to the configured payment provider to review the amount and payment terms before completing a transaction.</p>
            <a className="btn btn-primary" href={paymentUrl} target="_blank" rel="noopener noreferrer">Continue to payment <ArrowUpRight size={14} /></a>
            <p className="fine-print"><ShieldCheck size={13} /> Check the provider domain and final amount before paying.</p>
          </>
        ) : (
          <>
            <p><strong>Payments are not configured yet.</strong> No payment will be collected from this page until the site owner adds a verified checkout URL.</p>
            <div className="setup-note"><strong>Site owner setup</strong><br />Add <code>NEXT_PUBLIC_PAYMENT_URL</code> to the Vercel project’s Environment Variables, using your real payment link (for example, a payment link from your chosen provider), then redeploy.</div>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
