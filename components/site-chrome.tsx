import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

export function SiteNav() {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="QuantTearSheet home">
        <span className="brand-icon"><span className="brand-mark" /></span>
        <span>quant<span style={{ color: "var(--accent)" }}>.</span>tearsheet</span>
      </Link>
      <nav className="topnav" aria-label="Main navigation">
        <Link href="/#analytics">Analytics</Link>
        <Link href="/methodology">Methodology</Link>
        <Link href="/about">Why QuantTearSheet</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/contact">Contact</Link>
        <Link className="nav-payment" href="/payment">Payment <ArrowUpRight size={12} /></Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="footer site-footer">
      <div>
        <span>QuantTearSheet © {new Date().getFullYear()} · Built for quantitative research and education.</span>
        <span className="footer-disclaimer">Historical analytics are not investment advice. Results depend on data quality and stated assumptions.</span>
      </div>
      <nav className="footer-links" aria-label="Footer navigation">
        <Link href="/about">About us</Link>
        <Link href="/privacy"><ShieldCheck size={12} /> Privacy policy</Link>
        <Link href="/contact">Contact us</Link>
        <Link href="/payment">Payment link</Link>
      </nav>
    </footer>
  );
}
