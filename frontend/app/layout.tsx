import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-kanit",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Tableau de bord Benchmark REST",
  description:
    "Visualisation des indicateurs de performance pour les variantes de services web REST."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={kanit.variable}>
      <body className="min-h-screen bg-slate-100">{children}</body>
    </html>
  );
}

