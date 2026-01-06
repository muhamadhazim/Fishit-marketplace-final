"use client";

import Hero from "@/components/ui/Hero";
import GameCard from "@/components/ui/GameCard";
import { useTopSellingProducts } from "@/hooks/useTopSellingProducts";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";

export default function Home() {
  const { products, loading } = useTopSellingProducts(10);

  return (
    <main className="mx-auto max-w-6xl p-6 min-h-screen">
      <Hero />
      <section id="market" className="py-16">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-cyan-400" />
            <h2 className="text-3xl font-bold text-slate-100">
              Top Produk Terlaris
            </h2>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors group"
          >
            Lihat Semua Produk
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xl text-slate-400">Memuat produk...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-slate-400">Belum ada produk tersedia.</p>
            <Link href="/products" className="text-cyan-400 hover:underline mt-2 inline-block">
              Lihat semua produk
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map((p) => (
                <GameCard key={p.id} product={p} />
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="text-center mt-12">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-3 px-8 rounded-xl transition-all hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
              >
                Jelajahi Semua Produk
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
