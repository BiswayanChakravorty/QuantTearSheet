import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteNav } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Privacy Policy | QuantTearSheet",
  description: "Privacy information for the QuantTearSheet web application.",
};

export default function PrivacyPage() {
  return (
    <main className="shell">
      <SiteNav />
      <article className="legal-document">
        <div className="eyebrow"><span className="dot" /> Legal information</div>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: October 16, 2026</p>
        <p>This policy describes how QuantTearSheet handles information when you use this website. It is a product privacy summary and should be reviewed for your actual operating practices before commercial launch.</p>
        <h2>1. CSV files and analysis</h2>
        <p>The current analytics tool processes selected CSV files locally in your browser. The application does not send those files to a QuantTearSheet upload API. Do not upload confidential, personal, or third-party data unless you have the right to use it.</p>
        <h2>2. Information collected by hosting providers</h2>
        <p>The website is intended to be hosted by Vercel. Hosting and security infrastructure may process technical information such as request metadata, IP addresses, browser details, and logs to operate, secure, and troubleshoot the service. Consult the hosting provider&apos;s current privacy documentation for details.</p>
        <h2>3. Contact messages</h2>
        <p>If you contact us by email, we will receive the information you choose to include in that message and use it to respond and handle the request. Avoid sending passwords, payment card details, or sensitive financial information.</p>
        <h2>4. Payments and third-party services</h2>
        <p>If a payment provider is added, payment processing may take place on that provider's website under its own terms and privacy policy. QuantTearSheet should not collect or store full payment-card details. The payment page remains inactive until the site owner configures a verified payment URL.</p>
        <h2>5. Cookies and analytics</h2>
        <p>The current app does not intentionally set product analytics cookies. Hosting, security, or third-party services may use their own technologies. Update this section if analytics, advertising, authentication, or other tracking tools are introduced.</p>
        <h2>6. Data retention and your choices</h2>
        <p>CSV data processed locally remains under your browser&apos;s control and is not saved by the app to a server. Email correspondence may remain in the relevant email systems. You can choose not to use the site or not to send a contact message.</p>
        <h2>7. Children and changes</h2>
        <p>This service is intended for general educational and research use, not specifically for children. We may update this policy when the service changes; the updated date will be shown at the top of this page.</p>
        <h2>8. Contact</h2>
        <p>For privacy questions, use the <Link href="/contact">Contact Us</Link> page. Before launch, the site owner should publish a monitored contact email and confirm that this policy matches the actual deployment, jurisdiction, and payment setup.</p>
      </article>
      <SiteFooter />
    </main>
  );
}
