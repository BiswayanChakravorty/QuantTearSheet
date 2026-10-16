import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";
import { SiteFooter, SiteNav } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Contact Us | QuantTearSheet",
  description: "Contact the QuantTearSheet team with questions, feedback, or support requests.",
};

export default function ContactPage() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "chakravortybiswayan@gmail.com";
  return (
    <main className="shell">
      <SiteNav />
      <section className="content-hero">
        <div className="eyebrow"><span className="dot" /> Contact and support</div>
        <h1>Questions about the tool?<br /><span className="accent-text">Get in touch.</span></h1>
        <p>Send feedback, report a bug, or ask a question about using the CSV analytics workflow.</p>
      </section>
      <section className="contact-card">
        <div className="contact-icon"><Mail size={21} /></div>
        <h2>Email support</h2>
        {contactEmail ? (
          <>
            <p>For support or feedback, email us at the address below. Please do not include passwords, payment card details, or confidential datasets.</p>
            <a className="btn btn-primary" href={`mailto:${contactEmail}?subject=QuantTearSheet%20support`}> <Mail size={14} /> {contactEmail}</a>
          </>
        ) : (
          <>
            <p>The support email has not been configured yet. The site owner should add <code>NEXT_PUBLIC_CONTACT_EMAIL</code> in Vercel project settings and redeploy.</p>
            <span className="pill"><MessageCircle size={12} /> Contact details pending setup</span>
          </>
        )}
      </section>
      <SiteFooter />
    </main>
  );
}
