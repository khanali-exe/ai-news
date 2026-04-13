import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "AI Intelligence Hub", template: "%s — AI Intelligence Hub" },
  description: "Verified AI news — collected from trusted sources, processed and fact-checked automatically.",
  openGraph: {
    title: "AI Intelligence Hub",
    description: "Verified AI news, automatically processed and fact-checked.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans min-h-screen antialiased`}
            style={{ background: "var(--bg)", color: "#e4e4e7" }}>
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-4 sm:py-10 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
