import { ArrowUpRight, ShieldCheck } from "lucide-react";

export function SiteNav() {
  return (
    <header className="topbar">
      <a className="brand" href="/" aria-label="QuantTearSheet home">
        <span className="brand-icon"><span className="brand-mark" /></span>
        <span>quant<span style={{ color: "var(--accent)" }}>.</span>tearsheet</span>
      </a>
      <nav className="topnav" aria-label="Main navigation">
        <a href="/#analytics">Analytics</a>
        <a href="/#methodology">Methodology</a>
        <a href="/about">About</a>
        <a href="/privacy">Privacy</a>
        <a href="/contact">Contact</a>
        <a className="nav-payment" href="/payment">Payment <ArrowUpRight size={12} /></a>
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
        <a href="/about">About us</a>
        <a href="/privacy"><ShieldCheck size={12} /> Privacy policy</a>
        <a href="/contact">Contact us</a>
        <a href="/payment">Payment link</a>
      </nav>
    </footer>
  );
}
