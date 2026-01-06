import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Gunakan URL produksi atau fallback ke localhost saat dev
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
  ? process.env.NEXT_PUBLIC_BASE_URL
  : process.env.NODE_ENV === 'production'
    ? 'https://fishit.store' // Ganti dengan domain default jika env tidak ada
    : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "FishIt Marketplace - Jual Beli Akun & Item Game Terpercaya",
    template: "%s | FishIt Marketplace"
  },
  description: "Marketplace terbaik untuk jual beli akun Roblox, item game, dan topup terpercaya di Indonesia. Transaksi aman, cepat, dan otomatis.",
  keywords: ["Jual Akun Roblox", "Blox Fruits", "Topup Game", "Item Roblox Murah", "FishIt Marketplace"],
  authors: [{ name: "FishIt Team" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: BASE_URL,
    siteName: "FishIt Marketplace",
    images: [
      {
        url: "/images/og-image.jpg", // Pastikan file ini ada di folder public/images
        width: 1200,
        height: 630,
        alt: "FishIt Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FishIt Marketplace",
    description: "Jual Beli Akun Roblox Terpercaya",
    images: ["/images/og-image.jpg"], // Menggunakan gambar yang sama
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-100`}
      >
        <ToastProvider>
        <div
          className="pointer-events-none fixed inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <Navbar />
        {children}
        <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
