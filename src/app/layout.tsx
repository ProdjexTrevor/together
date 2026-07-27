import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Together — shared plans for two",
  description:
    "A calm shared home for couples to track tasks, decisions, goals, and financial targets.",
  applicationName: "Together",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Together",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#C8795D",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full font-sans text-ink">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
