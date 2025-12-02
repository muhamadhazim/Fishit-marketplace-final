"use client";
import { useEffect, useMemo, useState, use } from "react";
import { api } from "@/lib/api";
import Image from "next/image";
import { Fish, CreditCard, User, Gamepad2, ShoppingCart, AlertCircle } from "lucide-react";
import { useCart } from "@/store/cart";

type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string;
  specifications: Record<string, unknown>;
  category: { name: string; slug: string } | null;
};

function badgeColor(slug?: string) {
  if (!slug) return "border-white/10";
  if (slug === "secret-fish") return "border-red-500 shadow-glow-red";
  if (slug === "high-tier-accounts") return "border-web3-accent-purple shadow-glow-purple";
  if (slug === "coins-cs") return "border-web3-accent-green shadow-glow-green";
  return "border-white/10";
}

function formatIDR(n?: number) {
  if (!n && n !== 0) return "";
  return "Rp " + new Intl.NumberFormat("id-ID").format(n);
}

function iconForKey(key: string) {
  const k = key.toLowerCase();
  if (k.includes("rod")) return <Gamepad2 className="h-4 w-4 text-web3-accent-cyan" />;
  if (k.includes("level")) return <User className="h-4 w-4 text-web3-accent-purple" />;
  if (k.includes("weight") || k.includes("fish"))
    return <Fish className="h-4 w-4 text-web3-accent-pink" />;
  if (
    k.includes("rarity") ||
    k.includes("method") ||
    k.includes("coins") ||
    k.includes("price")
  )
    return <CreditCard className="h-4 w-4 text-web3-accent-green" />;
  return <User className="h-4 w-4 text-web3-text-secondary" />;
}

const ProductSkeleton = () => (
  <div className="mx-auto max-w-6xl p-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="glass-card rounded-2xl border border-white/10 p-6 flex items-center justify-center animate-pulse">
        <div className="relative w-full max-w-md aspect-square bg-white/5 rounded-xl"></div>
      </div>
      <div>
        <div className="h-10 w-3/4 bg-white/5 rounded-xl animate-pulse"></div>
        <div className="h-8 w-1/4 bg-white/5 rounded-xl mt-3 animate-pulse"></div>
        <div className="mt-8">
          <div className="h-8 w-1/2 bg-white/5 rounded-xl animate-pulse"></div>
          <div className="mt-4 space-y-3">
            <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse"></div>
            <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse"></div>
            <div className="h-12 w-full bg-white/5 rounded-xl animate-pulse"></div>
          </div>
        </div>
        <div className="mt-8">
          <div className="h-14 w-full bg-web3-accent-cyan/20 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

export default function Page({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, setIsOpen } = useCart();



  useEffect(() => {
    async function fetchProduct() {

      try {
        const res = await api.get(`/api/products/${params.id}`);
        setProduct(res.data);
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      category: {
        name: product.category?.name || 'Uncategorized',
        slug: product.category?.slug || 'uncategorized'
      },
      specifications: product.specifications
    });
    setIsOpen(true);
  };

  if (loading) {
    return <ProductSkeleton />;
  }
  if (!product) {
    return (
      <div className="p-6 text-center">
        <div className="glass-card rounded-2xl p-12 border border-white/10 max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-web3-accent-cyan mx-auto mb-4" />
          <p className="text-xl font-bold text-web3-text-primary mb-2">Product not found</p>
          <p className="text-web3-text-secondary">It might have been removed or the link is incorrect.</p>
        </div>
      </div>
    );
  }

  const borderClass = badgeColor(product.category?.slug);
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="mx-auto max-w-6xl p-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className={`glass-card rounded-2xl border-2 ${borderClass} p-6 flex items-center justify-center relative overflow-hidden group`}>
          {product.category && (
            <div className="absolute top-4 right-4 z-10 px-4 py-2 rounded-xl bg-gradient-to-r from-web3-accent-cyan/20 to-web3-accent-purple/20 border border-web3-accent-cyan/50 backdrop-blur-xl">
              <span className="text-sm font-bold text-web3-accent-cyan uppercase tracking-wide">
                {product.category.name}
              </span>
            </div>
          )}
          <div className="relative w-full max-w-md aspect-square">
            <Image
              src={product.image_url || "/vercel.svg"}
              alt={product.name}
              fill
              className="object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          </div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-web3-bg-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>

        {/* Info Section */}
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold gradient-text mb-2">{product.name}</h1>
          <div className="text-3xl font-extrabold gradient-text mb-6">
            {formatIDR(product.price)}
          </div>

          {/* Stock Badge */}
          <div className="mb-6">
            {isOutOfStock ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 border-2 border-red-500 text-red-400 font-bold">
                <AlertCircle className="h-5 w-5" />
                Out of Stock
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-web3-accent-green/20 border-2 border-web3-accent-green text-web3-accent-green font-bold">
                ✓ {product.stock} in stock
              </div>
            )}
          </div>

          {/* Specifications */}
          <section>
            <h2 className="text-xl font-bold text-web3-text-primary mb-4">Specifications</h2>
            <div className="space-y-3">
              {Object.entries(product.specifications || {}).map(([k, v]) => (
                <div
                  key={k}
                  className="glass-card flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 hover:border-web3-accent-cyan/30 transition-all group"
                >
                  <div className="group-hover:scale-110 transition-transform">
                    {iconForKey(k)}
                  </div>
                  <span className="text-web3-text-secondary capitalize text-sm">
                    {k.replace(/_/g, " ")}:
                  </span>
                  <span className="text-white font-semibold ml-auto">
                    {String(v)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Add to Cart Button */}
          <section className="mt-auto pt-8">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`relative w-full inline-flex items-center justify-center gap-3 rounded-xl px-6 py-4 font-bold text-white transition-all border-2 overflow-hidden group ${
                isOutOfStock
                  ? "bg-gray-600/30 border-gray-500 cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-web3-accent-green to-web3-accent-cyan border-web3-accent-green/50 hover:scale-105 active:scale-[0.98] hover:shadow-glow-green"
              }`}
            >
              {!isOutOfStock && (
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
              )}
              <ShoppingCart className="h-5 w-5 relative z-10" />
              <span className="relative z-10">
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
