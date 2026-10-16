import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuantTearSheet — Quantitative Strategy Analytics",
  description: "Turn strategy returns or asset-price CSVs into clear quantitative performance, risk, and drawdown analytics.",
  applicationName: "QuantTearSheet",
};
export const viewport: Viewport = { themeColor: "#080b12", colorScheme: "dark" };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
