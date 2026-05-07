import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const brandSans = Space_Grotesk({
  variable: "--font-brand-sans",
  subsets: ["latin"],
});

const brandMono = IBM_Plex_Mono({
  variable: "--font-brand-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stock Closet",
  description:
    "Track item prices, quantities, and searchable inventory from one fast dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${brandSans.variable} ${brandMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
