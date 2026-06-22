import type { Metadata } from "next";
import { Orbitron, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400","700","900"], variable: "--font-orbitron" });
const inter = Inter({ subsets: ["latin"], weight: ["300","400","500","600","700"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "AI-BED — Build Edge Discipline",
  description: "Plateforme de trading automatisé par intelligence artificielle.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${orbitron.variable} ${inter.variable}`}>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
