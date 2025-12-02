"use client";

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Star, Zap, Fish, Gamepad2 } from "lucide-react";
import { formatIDR } from "@/lib/currency";
import { useCart } from '@/store/cart'

type Product = {
  _id?: string
  id: string
  name: string
  price: number
  image_url: string;
  stock?: number;
  specifications: Record<string, unknown>;
  category: { name: string; slug: string } | null;
}

function borderGlow(slug?: string) {
  if (slug === 'secret-fish') return 'hover:border-red-500 hover:shadow-secret'
  if (slug === 'high-tier-accounts') return 'hover:border-mythicGold hover:shadow-mythic'
  if (slug === 'coins-cs') return 'hover:border-emerald-400 hover:shadow-neon'
  return 'hover:border-slate-400'
}

export default function GameCard({ product }: { product: Product }) {
  const { addItem } = useCart()
  const placeholder = 'https://placehold.co/600x400/1e293b/4ade80?text=Fish+It+Item'
  const hasImage = !!product.image_url

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    addItem({
      id: product.id || product._id || '',
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      category: {
        name: product.category?.name || 'Uncategorized',
        slug: product.category?.slug || 'uncategorized'
      },
      specifications: product.specifications
    });
  }

  const stock = product.stock ?? 0;

  return (
    <div className="group glass-card rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-glow-cyan border border-white/10 hover:border-web3-accent-cyan/50 flex flex-col">
      <Link href={`/game/${product.id || product._id}`} className="block flex-1 flex flex-col">
        <div className="relative mb-4 overflow-hidden rounded-xl">
          {/* Floating Rarity Badge */}
          {product.category?.slug && (
            <div className="absolute top-2 right-2 z-10">
              <span className={`
                inline-block rounded-full px-3 py-1 text-xs font-bold backdrop-blur-sm
                ${product.category.slug === 'secret-fish' ? 'bg-gradient-to-r from-red-500/80 to-pink-500/80 text-white shadow-glow-pink' : ''}
                ${product.category.slug === 'high-tier-accounts' ? 'bg-gradient-to-r from-yellow-500/80 to-orange-500/80 text-white shadow-glow-pink' : ''}
                ${product.category.slug === 'coins-cs' ? 'bg-gradient-to-r from-emerald-500/80 to-green-500/80 text-white shadow-glow-green' : ''}
              `}>
                {product.category.name}
              </span>
            </div>
          )}

          <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5">
            {hasImage ? (
              <Image 
                src={product.image_url || placeholder} 
                alt={product.name} 
                fill 
                className="object-cover transition-transform duration-500 group-hover:scale-110" 
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-web3-bg-secondary to-web3-bg-primary">
                {product.category?.slug === 'high-tier-accounts' ? (
                  <Gamepad2 className="h-16 w-16 text-web3-accent-purple" />
                ) : (
                  <Fish className="h-16 w-16 text-web3-accent-cyan" />
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-base font-bold text-web3-text-primary line-clamp-2 group-hover:text-web3-accent-cyan transition-colors">
              {product.name}
            </h3>
            <span className="gradient-text text-lg font-extrabold whitespace-nowrap">
              {formatIDR(product.price)}
            </span>
          </div>
          
          {/* Specs Pills */}
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(product.specifications || {}).slice(0, 2).map(([k, v]) => (
              <span 
                key={k} 
                className="inline-flex items-center rounded-lg bg-web3-accent-cyan/10 border border-web3-accent-cyan/20 px-2.5 py-1 text-[11px]"
              >
                <span className="text-web3-text-secondary mr-1 capitalize">{k}:</span>
                <span className="text-web3-accent-cyan font-semibold">{String(v)}</span>
              </span>
            ))}
          </div>

          {/* Stock Badge - Push to bottom with margin-top auto */}
          <div className="mt-auto pt-3">
            {stock !== undefined && (
              <span className={`
                inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold
                ${stock > 0 
                  ? 'bg-web3-accent-green/10 border border-web3-accent-green/30 text-web3-accent-green' 
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }
              `}>
                {stock > 0 ? `${stock} in stock` : 'Out of stock'}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart Button - Always at bottom, highly interactive */}
      <button
        onClick={handleAddToCart}
        disabled={stock === 0}
        className={`
          relative overflow-hidden mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold transition-all inline-flex items-center justify-center gap-2 group/btn
          ${stock === 0
            ? 'bg-white/5 text-web3-text-muted cursor-not-allowed'
            : 'bg-gradient-to-r from-web3-accent-green to-web3-accent-cyan text-white hover:scale-[1.03] hover:shadow-glow-green active:scale-[0.98]'
          }
        `}
      >
        {/* Ripple effect on click */}
        {stock > 0 && (
          <span className="absolute inset-0 bg-white/20 rounded-xl scale-0 group-hover/btn:scale-100 transition-transform duration-500 ease-out"></span>
        )}
        
        <ShoppingCart className={`h-4 w-4 relative z-10 transition-transform ${stock > 0 ? 'group-hover/btn:rotate-12 group-hover/btn:scale-110' : ''}`} />
        <span className="relative z-10">{stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
      </button>
    </div>
  )
}
