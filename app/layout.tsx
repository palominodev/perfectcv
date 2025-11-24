import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Perfect CV - Optimize your CV for any job offer",
  description: "Upload your CV and a job offer to get a perfectly optimized CV that passes ATS filters.",
  openGraph: {
    title: "Perfect CV - Optimize your CV for any job offer",
    description: "Upload your CV and a job offer to get a perfectly optimized CV that passes ATS filters.",
    url: "https://makeperfectcv.vercel.app",
    siteName: "Perfect CV",
    images: [
      {
        url: "/imagen-open-graph-perfect-cv.png",
        width: 1200,
        height: 630,
        alt: "Perfect CV Landing Page",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Perfect CV - Optimize your CV for any job offer",
    description: "Upload your CV and a job offer to get a perfectly optimized CV that passes ATS filters.",
    images: ["/imagen-open-graph-perfect-cv.png"],
  },
  keywords: ["CV", "Resume", "ATS", "Job Offer", "Optimization", "AI", "Career"],
  alternates: {
    canonical: "https://makeperfectcv.vercel.app",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Perfect CV",
  url: "https://makeperfectcv.vercel.app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
