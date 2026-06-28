import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Community Hero - AI Powered Hyperlocal Problem Solver",
  description: "Report community issues like potholes, garbage, water leakage with AI-powered analysis. Join your community in making your city better.",
  keywords: ["community", "civic", "report", "pothole", "garbage", "AI", "smart city"],
  authors: [{ name: "Community Hero Team" }],
  openGraph: {
    title: "Community Hero - AI Powered Hyperlocal Problem Solver",
    description: "Report and track community issues with AI-powered analysis",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
